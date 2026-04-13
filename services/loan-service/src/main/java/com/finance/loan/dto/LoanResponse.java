package com.finance.loan.dto;

import com.finance.loan.domain.mongo.LoanApplication;
import com.finance.loan.domain.mysql.Loan;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class LoanResponse {
    private UUID id;
    private String loanCode;
    private UUID userId;
    private Loan.LoanStatus status;
    private Loan.LoanType loanType;
    private BigDecimal requestedAmount;
    private BigDecimal approvedAmount;
    private BigDecimal interestRate;
    private Integer termMonths;
    private String purpose;
    private Integer creditScore;
    private String creditGrade;
    private List<LoanApplication.RepaymentInstallment> repaymentSchedule;
    private List<LoanApplication.LoanDocument> documents;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
}
