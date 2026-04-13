package com.finance.report.domain.mongo;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * CQRS Read Model — denormalized cho query nhanh.
 * Được cập nhật bởi Kafka consumer khi có payment.completed event.
 */
@Document(collection = "transaction_read_models")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionReadModel {

    @Id
    private String id;

    @Indexed
    private String transactionId;

    @Indexed
    private String accountId;       // Cả from và to đều được index

    private String direction;       // "DEBIT" or "CREDIT"

    private String referenceNo;

    private BigDecimal amount;

    private String currency;

    private String type;
    
    private String category;

    private String status;

    private String description;

    private String counterpartyAccountId;

    private String counterpartyName;

    private BigDecimal balanceAfter;

    @Indexed
    private LocalDateTime transactionDate;

    private LocalDateTime createdAt;
}
