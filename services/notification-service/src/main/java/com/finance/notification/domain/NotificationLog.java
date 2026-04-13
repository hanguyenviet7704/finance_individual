package com.finance.notification.domain;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "notification_logs")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationLog {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String transactionId;

    private NotificationType type;       // EMAIL, SMS, PUSH

    private String channel;              // payment.completed, fraud.detected, ...

    private String recipient;            // email or phone

    private String subject;

    private String body;

    private NotificationStatus status;

    private String errorMessage;

    private int retryCount = 0;

    @CreatedDate
    private LocalDateTime createdAt;

    private LocalDateTime sentAt;

    public enum NotificationType   { EMAIL, SMS, PUSH }
    public enum NotificationStatus { PENDING, SENT, FAILED, RETRY }
}
