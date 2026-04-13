package com.finance.notification.domain;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.Map;

@Document(collection = "notification_templates")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationTemplate {

    @Id
    private String id;

    @Indexed(unique = true)
    private String eventType;      // "payment.completed", "fraud.detected", ...

    private ChannelTemplate email;
    private ChannelTemplate sms;
    private ChannelTemplate push;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ChannelTemplate {
        private String subject;    // Chỉ email mới có
        private String body;       // Template với {placeholder}
        private boolean enabled;
    }
}
