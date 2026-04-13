package com.finance.notification.service;

import com.finance.notification.domain.NotificationLog;
import com.finance.notification.domain.NotificationTemplate;
import com.finance.notification.repository.NotificationLogRepository;
import com.finance.notification.repository.NotificationTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationLogRepository notificationLogRepository;
    private final NotificationTemplateRepository templateRepository;
    private final JavaMailSender mailSender;

    @KafkaListener(topics = "payment.completed", groupId = "notification-service-payment")
    public void handlePaymentCompleted(Map<String, Object> event) {
        try {
            Map<String, Object> payload = (Map<String, Object>) event.get("payload");
            if (payload == null) return;

            String transactionId = (String) payload.get("transactionId");
            String amount        = payload.get("amount").toString();
            String referenceNo   = (String) payload.get("referenceNo");

            log.info("Sending notification for completed payment: {}", transactionId);

            NotificationTemplate template = templateRepository.findByEventType("payment.completed")
                .orElse(getDefaultPaymentTemplate());

            String body = renderTemplate(template.getSms().getBody(), Map.of(
                "amount", amount,
                "referenceNo", referenceNo
            ));

            NotificationLog logEntry = NotificationLog.builder()
                .transactionId(transactionId)
                .type(NotificationLog.NotificationType.SMS)
                .channel("payment.completed")
                .body(body)
                .status(NotificationLog.NotificationStatus.SENT)
                .sentAt(LocalDateTime.now())
                .build();

            notificationLogRepository.save(logEntry);
            log.info("SMS notification logged for tx: {}", transactionId);

        } catch (Exception e) {
            log.error("Error processing payment.completed notification: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "fraud.detected", groupId = "notification-service-fraud")
    public void handleFraudDetected(Map<String, Object> event) {
        try {
            String userId        = (String) event.get("userId");
            String transactionId = (String) event.get("transactionId");

            log.warn("Sending fraud alert notification for user: {}", userId);

            NotificationLog logEntry = NotificationLog.builder()
                .userId(userId)
                .transactionId(transactionId)
                .type(NotificationLog.NotificationType.SMS)
                .channel("fraud.detected")
                .body("CANH BAO: Giao dich dang ngo phat hien. Tai khoan tam thoi bi khoa. Goi 1800-xxxx.")
                .status(NotificationLog.NotificationStatus.SENT)
                .sentAt(LocalDateTime.now())
                .build();

            notificationLogRepository.save(logEntry);

            // Push notification
            NotificationLog pushLog = NotificationLog.builder()
                .userId(userId)
                .transactionId(transactionId)
                .type(NotificationLog.NotificationType.PUSH)
                .channel("fraud.detected")
                .subject("Canh bao bao mat!")
                .body("Phat hien hoat dong bat thuong tren tai khoan cua ban.")
                .status(NotificationLog.NotificationStatus.SENT)
                .sentAt(LocalDateTime.now())
                .build();

            notificationLogRepository.save(pushLog);

        } catch (Exception e) {
            log.error("Error processing fraud notification: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "account.created", groupId = "notification-service-account")
    public void handleAccountCreated(Map<String, Object> event) {
        try {
            Map<String, Object> payload = (Map<String, Object>) event.get("payload");
            if (payload == null) return;

            String email     = (String) payload.get("email");
            String fullName  = (String) payload.get("fullName");
            String accountNo = (String) payload.get("accountNumber");

            if (email != null && !email.isEmpty()) {
                sendEmail(email,
                    "Chao mung ban den voi Finance System",
                    "Xin chao " + fullName + ", tai khoan " + accountNo + " da duoc tao thanh cong.");
            }

        } catch (Exception e) {
            log.error("Error processing account.created notification: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "notification.otp.required", groupId = "notification-service-otp")
    public void handleOtpRequired(Map<String, Object> event) {
        String transactionId = (String) event.get("transactionId");
        String userId        = (String) event.get("userId");
        log.info("OTP required notification for tx: {} user: {}", transactionId, userId);
        // Trong thực tế gửi SMS qua Twilio/VIETTEL
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);

            NotificationLog logEntry = NotificationLog.builder()
                .type(NotificationLog.NotificationType.EMAIL)
                .recipient(to)
                .subject(subject)
                .body(body)
                .status(NotificationLog.NotificationStatus.SENT)
                .sentAt(LocalDateTime.now())
                .build();
            notificationLogRepository.save(logEntry);

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String renderTemplate(String template, Map<String, String> variables) {
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{" + entry.getKey() + "}", entry.getValue());
        }
        return result;
    }

    private NotificationTemplate getDefaultPaymentTemplate() {
        return NotificationTemplate.builder()
            .eventType("payment.completed")
            .sms(NotificationTemplate.ChannelTemplate.builder()
                .body("Giao dich {amount} VND - Ma: {referenceNo} thanh cong.")
                .enabled(true)
                .build())
            .build();
    }
}
