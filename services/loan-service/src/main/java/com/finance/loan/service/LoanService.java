package com.finance.loan.service;

import com.finance.loan.domain.mongo.LoanApplication;
import com.finance.loan.domain.mysql.Loan;
import com.finance.loan.dto.ApplyLoanRequest;
import com.finance.loan.dto.LoanResponse;
import com.finance.loan.exception.LoanException;
import com.finance.loan.repository.LoanApplicationRepository;
import com.finance.loan.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final LoanApplicationRepository loanApplicationRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final CreditScoreService creditScoreService;

    @Transactional
    public LoanResponse applyLoan(UUID userId, UUID accountId, ApplyLoanRequest request) {
        // 1. Tính credit score
        int creditScore = creditScoreService.calculateScore(userId);
        String creditGrade = scoreToGrade(creditScore);

        if (creditScore < 400) {
            throw new LoanException("Credit score too low: " + creditScore,
                org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY, "LOW_CREDIT_SCORE");
        }

        // 2. Tạo Loan record trong MySQL
        String loanCode = generateLoanCode();
        Loan loan = Loan.builder()
            .loanCode(loanCode)
            .userId(userId)
            .accountId(accountId)
            .status(Loan.LoanStatus.PENDING)
            .loanType(request.getLoanType())
            .requestedAmount(request.getAmount())
            .termMonths(request.getTermMonths())
            .purpose(request.getPurpose())
            .creditScore(creditScore)
            .creditGrade(creditGrade)
            .build();

        loan = loanRepository.save(loan);

        // 3. Tạo LoanApplication document trong MongoDB (chứa dữ liệu linh hoạt)
        LoanApplication application = LoanApplication.builder()
            .loanId(loan.getId().toString())
            .loanCode(loanCode)
            .creditScore(LoanApplication.CreditScore.builder()
                .score(creditScore)
                .grade(creditGrade)
                .calculatedAt(LocalDateTime.now())
                .factors(Map.of(
                    "payment_history", 0.85,
                    "credit_utilization", 0.62,
                    "history_length", 0.70
                ))
                .build())
            .documents(new ArrayList<>())
            .reviewHistory(new ArrayList<>())
            .repaymentSchedule(generateRepaymentSchedule(request.getAmount(), request.getTermMonths()))
            .build();

        LoanApplication savedApp = loanApplicationRepository.save(application);

        // 4. Link MongoDB doc ID vào MySQL
        loan.setMongoDocId(savedApp.getId());
        loanRepository.save(loan);

        // 5. Publish event
        kafkaTemplate.send("loan.applied", loan.getId().toString(), Map.of(
            "loanId", loan.getId().toString(),
            "userId", userId.toString(),
            "amount", request.getAmount(),
            "creditScore", creditScore
        ));

        log.info("Loan applied: {} user: {} amount: {}", loanCode, userId, request.getAmount());
        return toResponse(loan, savedApp);
    }

    @Transactional
    public LoanResponse approveLoan(UUID loanId, UUID officerId, BigDecimal approvedAmount, BigDecimal interestRate) {
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> LoanException.notFound(loanId.toString()));

        if (loan.getStatus() != Loan.LoanStatus.PENDING && loan.getStatus() != Loan.LoanStatus.UNDER_REVIEW) {
            throw new LoanException("Loan cannot be approved in current status: " + loan.getStatus(),
                org.springframework.http.HttpStatus.CONFLICT, "INVALID_STATUS");
        }

        loan.setStatus(Loan.LoanStatus.APPROVED);
        loan.setApprovedAmount(approvedAmount);
        loan.setInterestRate(interestRate);
        loan.setApprovedBy(officerId);
        loan.setApprovedAt(LocalDateTime.now());
        loan = loanRepository.save(loan);

        // Cập nhật review history trong MongoDB
        loanApplicationRepository.findByLoanId(loanId.toString()).ifPresent(app -> {
            app.getReviewHistory().add(LoanApplication.ReviewEntry.builder()
                .reviewedBy(officerId.toString())
                .action("APPROVED")
                .note("Approved amount: " + approvedAmount + " VND, rate: " + interestRate + "%")
                .timestamp(LocalDateTime.now())
                .build());
            loanApplicationRepository.save(app);
        });

        kafkaTemplate.send("loan.approved", loanId.toString(), Map.of(
            "loanId", loanId.toString(),
            "userId", loan.getUserId().toString(),
            "approvedAmount", approvedAmount
        ));

        return toResponse(loan, null);
    }

    @Transactional
    public LoanResponse rejectLoan(UUID loanId, UUID officerId, String reason) {
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> LoanException.notFound(loanId.toString()));

        loan.setStatus(Loan.LoanStatus.REJECTED);
        loan = loanRepository.save(loan);

        loanApplicationRepository.findByLoanId(loanId.toString()).ifPresent(app -> {
            app.getReviewHistory().add(LoanApplication.ReviewEntry.builder()
                .reviewedBy(officerId.toString())
                .action("REJECTED")
                .note(reason)
                .timestamp(LocalDateTime.now())
                .build());
            loanApplicationRepository.save(app);
        });

        return toResponse(loan, null);
    }

    @Transactional(readOnly = true)
    public LoanResponse getLoan(UUID loanId) {
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> LoanException.notFound(loanId.toString()));
        LoanApplication app = loan.getMongoDocId() != null
            ? loanApplicationRepository.findById(loan.getMongoDocId()).orElse(null)
            : null;
        return toResponse(loan, app);
    }

    @Transactional(readOnly = true)
    public Page<LoanResponse> getUserLoans(UUID userId, Pageable pageable) {
        return loanRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
            .map(loan -> toResponse(loan, null));
    }

    private List<LoanApplication.RepaymentInstallment> generateRepaymentSchedule(
            BigDecimal principal, int termMonths) {
        // Tính lãi đơn giản (flat rate) — thực tế dùng PMT formula
        BigDecimal monthlyRate = new BigDecimal("0.01"); // 1% tháng (demo)
        BigDecimal monthlyPrincipal = principal.divide(BigDecimal.valueOf(termMonths), 2, RoundingMode.HALF_UP);

        List<LoanApplication.RepaymentInstallment> schedule = new ArrayList<>();
        BigDecimal remaining = principal;

        for (int i = 1; i <= termMonths; i++) {
            BigDecimal interest = remaining.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal total = monthlyPrincipal.add(interest);

            schedule.add(LoanApplication.RepaymentInstallment.builder()
                .installmentNo(i)
                .dueDate(LocalDateTime.now().plusMonths(i))
                .principal(monthlyPrincipal)
                .interest(interest)
                .total(total)
                .status("PENDING")
                .build());

            remaining = remaining.subtract(monthlyPrincipal);
        }
        return schedule;
    }

    private String generateLoanCode() {
        return "LOAN-" + LocalDateTime.now().getYear() + "-"
            + String.format("%06d", (int)(Math.random() * 1_000_000));
    }

    private String scoreToGrade(int score) {
        if (score >= 750) return "A+";
        if (score >= 700) return "A";
        if (score >= 650) return "B+";
        if (score >= 600) return "B";
        if (score >= 550) return "C+";
        if (score >= 500) return "C";
        return "D";
    }

    private LoanResponse toResponse(Loan loan, LoanApplication app) {
        return LoanResponse.builder()
            .id(loan.getId())
            .loanCode(loan.getLoanCode())
            .userId(loan.getUserId())
            .status(loan.getStatus())
            .loanType(loan.getLoanType())
            .requestedAmount(loan.getRequestedAmount())
            .approvedAmount(loan.getApprovedAmount())
            .interestRate(loan.getInterestRate())
            .termMonths(loan.getTermMonths())
            .purpose(loan.getPurpose())
            .creditScore(loan.getCreditScore())
            .creditGrade(loan.getCreditGrade())
            .repaymentSchedule(app != null ? app.getRepaymentSchedule() : null)
            .documents(app != null ? app.getDocuments() : null)
            .createdAt(loan.getCreatedAt())
            .approvedAt(loan.getApprovedAt())
            .build();
    }
}
