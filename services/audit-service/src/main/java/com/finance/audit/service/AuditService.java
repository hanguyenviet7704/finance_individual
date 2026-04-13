package com.finance.audit.service;

import com.finance.audit.domain.AuditLog;
import com.finance.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    // Lắng nghe TẤT CẢ các events quan trọng và ghi audit log
    @KafkaListener(topics = "payment.created", groupId = "audit-service-payment-created")
    public void onPaymentCreated(Map<String, Object> event) {
        writeLog(event, "payment-service", "PAYMENT_CREATED", "TRANSACTION");
    }

    @KafkaListener(topics = "payment.completed", groupId = "audit-service-payment-completed")
    public void onPaymentCompleted(Map<String, Object> event) {
        writeLog(event, "payment-service", "PAYMENT_COMPLETED", "TRANSACTION");
    }

    @KafkaListener(topics = "payment.failed", groupId = "audit-service-payment-failed")
    public void onPaymentFailed(Map<String, Object> event) {
        writeLog(event, "payment-service", "PAYMENT_FAILED", "TRANSACTION");
    }

    @KafkaListener(topics = "fraud.detected", groupId = "audit-service-fraud")
    public void onFraudDetected(Map<String, Object> event) {
        writeLog(event, "fraud-service", "FRAUD_DETECTED", "ACCOUNT");
    }

    @KafkaListener(topics = "account.created", groupId = "audit-service-account-created")
    public void onAccountCreated(Map<String, Object> event) {
        writeLog(event, "account-service", "ACCOUNT_CREATED", "ACCOUNT");
    }

    @KafkaListener(topics = "account.frozen", groupId = "audit-service-account-frozen")
    public void onAccountFrozen(Map<String, Object> event) {
        writeLog(event, "account-service", "ACCOUNT_FROZEN", "ACCOUNT");
    }

    @KafkaListener(topics = "loan.approved", groupId = "audit-service-loan")
    public void onLoanApproved(Map<String, Object> event) {
        writeLog(event, "loan-service", "LOAN_APPROVED", "LOAN");
    }

    private void writeLog(Map<String, Object> event, String serviceName,
                          String action, String resourceType) {
        try {
            String traceId = (String) event.getOrDefault("traceId", "");
            Map<String, Object> payload = event.containsKey("payload")
                ? (Map<String, Object>) event.get("payload")
                : event;

            String actorId     = extractString(payload, "initiatedBy", "userId", "actorId");
            String resourceId  = extractString(payload, "transactionId", "accountId", "loanId");

            AuditLog log = AuditLog.builder()
                .timestamp(LocalDateTime.now())
                .serviceName(serviceName)
                .action(action)
                .actorId(actorId)
                .actorType("USER")
                .resourceId(resourceId)
                .resourceType(resourceType)
                .traceId(traceId)
                .result("SUCCESS")
                .build();

            auditLogRepository.save(log);

        } catch (Exception e) {
            log.error("Failed to write audit log for action {}: {}", action, e.getMessage());
        }
    }

    private String extractString(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null) return val.toString();
        }
        return null;
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }

    public Page<AuditLog> getLogsForActor(String actorId, Pageable pageable) {
        return auditLogRepository.findByActorIdOrderByTimestampDesc(actorId, pageable);
    }

    public Page<AuditLog> getLogsForResource(String resourceId, Pageable pageable) {
        return auditLogRepository.findByResourceIdOrderByTimestampDesc(resourceId, pageable);
    }

    public Page<AuditLog> getLogsByService(String serviceName,
            LocalDateTime from, LocalDateTime to, Pageable pageable) {
        return auditLogRepository.findByServiceNameAndTimestampBetweenOrderByTimestampDesc(
            serviceName, from, to, pageable);
    }
}
