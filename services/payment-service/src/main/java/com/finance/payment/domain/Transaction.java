package com.finance.payment.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions",
    indexes = {
        @Index(name = "idx_tx_from_account", columnList = "fromAccountId, createdAt"),
        @Index(name = "idx_tx_to_account",   columnList = "toAccountId, createdAt"),
        @Index(name = "idx_tx_status",       columnList = "status"),
        @Index(name = "idx_tx_reference",    columnList = "referenceNo"),
        @Index(name = "idx_tx_idempotency",  columnList = "idempotencyKey")
    }
)
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reference_no", nullable = false, unique = true, length = 30)
    private String referenceNo;

    @Column(name = "from_account_id", nullable = false)
    private UUID fromAccountId;

    @Column(name = "to_account_id", nullable = false)
    private UUID toAccountId;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Builder.Default
    @Column(name = "fee", nullable = false, precision = 18, scale = 2)
    private BigDecimal fee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "currency", length = 3)
    private String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TransactionType type;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TransactionStatus status = TransactionStatus.PENDING;

    @Column(name = "description")
    private String description;

    @Column(name = "category", length = 50)
    private String category;

    // JSON extra info (merchant, bill ref, ...)
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "idempotency_key", unique = true)
    private UUID idempotencyKey;

    @Column(name = "fraud_score", precision = 5, scale = 2)
    private BigDecimal fraudScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "fraud_decision")
    private FraudDecision fraudDecision;

    @Column(name = "initiated_by", nullable = false)
    private UUID initiatedBy;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "device_id", length = 255)
    private String deviceId;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Builder.Default
    @Column(name = "otp_verified")
    private Boolean otpVerified = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder.Default
    @Version
    private Integer version = 0;

    public enum TransactionType   { TRANSFER, TOPUP, WITHDRAW, PAYMENT, REFUND }
    public enum TransactionStatus { PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REVERSED }
    public enum FraudDecision     { ALLOW, REVIEW, BLOCK }
}
