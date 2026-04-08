package com.finance.account.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountCreatedEvent {
    private String eventId;
    private String eventType = "account.created";
    private String eventVersion = "1.0";
    private LocalDateTime timestamp;
    private String traceId;
    private Payload payload;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Payload {
        private UUID accountId;
        private UUID userId;
        private String accountNumber;
        private String accountType;
        private String fullName;
        private String email;
        private String phone;
    }
}
