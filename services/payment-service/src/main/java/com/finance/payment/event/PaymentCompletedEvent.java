package com.finance.payment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentCompletedEvent {
    private String eventId;
    private String eventType = "payment.completed";
    private LocalDateTime timestamp;
    private Payload payload;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Payload {
        private UUID transactionId;
        private UUID fromAccountId;
        private UUID toAccountId;
        private BigDecimal amount;
        private String referenceNo;
        private String category;
        private String type;
    }
}
