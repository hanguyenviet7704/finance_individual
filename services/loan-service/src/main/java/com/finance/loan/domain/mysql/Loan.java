package com.finance.loan.domain.mysql;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Loan entity lưu trong MySQL (dữ liệu có cấu trúc, cần ACID).
 * Chi tiết documents, repayment schedule, review history lưu trong MongoDB.
 */
@Entity
@Table(name = "loans",
    indexes = {
        @Index(name = "idx_loans_user", columnList = "userId"),
        @Index(name = "idx_loans_status", columnList = "status")
    }
)
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "loan_code", nullable = false, unique = true, length = 30)
    private String loanCode;      // e.g. LOAN-2026-001234

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LoanStatus status = LoanStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "loan_type", nullable = false)
    private LoanType loanType;

    @Column(name = "requested_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal requestedAmount;

    @Column(name = "approved_amount", precision = 18, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "disbursed_amount", precision = 18, scale = 2)
    private BigDecimal disbursedAmount = BigDecimal.ZERO;

    @Column(name = "outstanding_amount", precision = 18, scale = 2)
    private BigDecimal outstandingAmount = BigDecimal.ZERO;

    @Column(name = "interest_rate", precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(name = "term_months")
    private Integer termMonths;

    @Column(name = "purpose", length = 200)
    private String purpose;

    @Column(name = "credit_score")
    private Integer creditScore;

    @Column(name = "credit_grade", length = 5)
    private String creditGrade;

    // ID của document trong MongoDB chứa chi tiết
    @Column(name = "mongo_doc_id", length = 50)
    private String mongoDocId;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "disbursed_at")
    private LocalDateTime disbursedAt;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    private Integer version = 0;

    public enum LoanStatus { PENDING, UNDER_REVIEW, APPROVED, REJECTED, DISBURSED, ACTIVE, COMPLETED, DEFAULTED }
    public enum LoanType   { PERSONAL, VEHICLE, MORTGAGE, BUSINESS, EDUCATION }
}
