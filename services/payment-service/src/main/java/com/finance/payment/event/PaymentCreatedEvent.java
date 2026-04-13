package com.finance.payment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentCreatedEvent {
    private String eventId;
    private String eventType = "payment.created";
    private String eventVersion = "1.0";
    private LocalDateTime timestamp;
    private String traceId;
    private Payload payload;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Payload {
        private UUID transactionId;
        private UUID fromAccountId;
        private UUID toAccountId;
        private BigDecimal amount;
        private String currency;
        private String type;
        private UUID initiatedBy;
        private String deviceId;
        private String ipAddress;
    }
}
