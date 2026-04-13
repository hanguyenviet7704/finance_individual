package com.finance.loan.domain.mongo;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * LoanApplication lưu trong MongoDB — chứa dữ liệu linh hoạt:
 * - Documents (CCCD, income proof, ...)
 * - Repayment schedule
 * - Review history
 */
@Document(collection = "loan_applications")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanApplication {

    @Id
    private String id;

    private String loanId;           // Reference đến Loan.id trong MySQL
    private String loanCode;

    private CreditScore creditScore;
    private List<LoanDocument> documents = new ArrayList<>();
    private List<ReviewEntry> reviewHistory = new ArrayList<>();
    private List<RepaymentInstallment> repaymentSchedule = new ArrayList<>();
    private Map<String, Object> additionalData;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreditScore {
        private int score;
        private String grade;
        private LocalDateTime calculatedAt;
        private Map<String, Double> factors;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoanDocument {
        private String type;      // CCCD, INCOME, COLLATERAL
        private String fileId;
        private String fileName;
        private String status;    // PENDING, VERIFIED, REJECTED
        private String rejectionReason;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ReviewEntry {
        private String reviewedBy;
        private String action;
        private String note;
        private LocalDateTime timestamp;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RepaymentInstallment {
        private int installmentNo;
        private LocalDateTime dueDate;
        private BigDecimal principal;
        private BigDecimal interest;
        private BigDecimal total;
        private String status;    // PENDING, PAID, OVERDUE
        private LocalDateTime paidAt;
    }
}
