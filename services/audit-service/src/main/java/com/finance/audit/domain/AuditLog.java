package com.finance.audit.domain;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/**
 * Audit log — immutable append-only document trong MongoDB.
 * Không bao giờ UPDATE hay DELETE, chỉ INSERT.
 * MongoDB thay thế Cassandra cho persistence.
 */
@Document(collection = "audit_logs")
@CompoundIndexes({
    @CompoundIndex(name = "idx_audit_service_date", def = "{'serviceName': 1, 'timestamp': -1}"),
    @CompoundIndex(name = "idx_audit_actor", def = "{'actorId': 1, 'timestamp': -1}")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    private String id;

    @Indexed
    private LocalDateTime timestamp;

    private String serviceName;    // "payment-service", "account-service", ...

    private String action;         // "PAYMENT_CREATED", "ACCOUNT_FROZEN", ...

    @Indexed
    private String actorId;        // User hoặc service thực hiện

    private String actorType;      // "USER", "SYSTEM", "ADMIN"

    @Indexed
    private String resourceId;     // ID của đối tượng bị tác động

    private String resourceType;   // "TRANSACTION", "ACCOUNT", "LOAN"

    private String oldValue;       // JSON trước khi thay đổi

    private String newValue;       // JSON sau khi thay đổi

    private String ipAddress;

    private String userAgent;

    private String traceId;        // OpenTelemetry trace ID

    private String result;         // "SUCCESS", "FAILURE"

    private String errorMessage;

    @CreatedDate
    private LocalDateTime createdAt;
}
