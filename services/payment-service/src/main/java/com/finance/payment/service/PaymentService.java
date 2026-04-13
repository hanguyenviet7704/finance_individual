package com.finance.payment.service;

import com.finance.payment.domain.Transaction;
import com.finance.payment.dto.TransactionResponse;
import com.finance.payment.dto.TransferRequest;
import com.finance.payment.event.PaymentCreatedEvent;
import com.finance.payment.event.PaymentCompletedEvent;
import com.finance.payment.exception.PaymentException;
import com.finance.payment.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final TransactionRepository transactionRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String IDEMPOTENCY_PREFIX = "idem:";
    private static final String OTP_PREFIX = "otp:";
    private static final BigDecimal MFA_THRESHOLD = new BigDecimal("50000000"); // 50 triệu VND

    @Transactional
    public TransactionResponse initiateTransfer(UUID userId, UUID idempotencyKey,
                                                TransferRequest request, String ipAddress) {
        // 1. Kiểm tra Idempotency — tránh double charge khi client retry
        String idemRedisKey = IDEMPOTENCY_PREFIX + idempotencyKey;
        Object cached = redisTemplate.opsForValue().get(idemRedisKey);
        if (cached != null) {
            log.info("Idempotency hit for key: {}", idempotencyKey);
            UUID cachedTxId = UUID.fromString(cached.toString());
            return transactionRepository.findById(cachedTxId)
                .map(this::toResponse)
                .orElseThrow();
        }

        // 2. Tạo Transaction record
        Transaction tx = Transaction.builder()
            .referenceNo(generateReferenceNo())
            .fromAccountId(request.getFromAccountId())
            .toAccountId(request.getToAccountId())
            .amount(request.getAmount())
            .type(Transaction.TransactionType.TRANSFER)
            .status(Transaction.TransactionStatus.PENDING)
            .description(request.getDescription())
            .category(request.getCategory())
            .idempotencyKey(idempotencyKey)
            .initiatedBy(userId)
            .ipAddress(ipAddress)
            .deviceId(request.getDeviceId())
            .build();

        tx = transactionRepository.save(tx);

        // 3. Lưu idempotency key vào Redis (TTL 24h)
        redisTemplate.opsForValue().set(idemRedisKey, tx.getId().toString(), Duration.ofHours(24));

        // 4. Kiểm tra MFA threshold (> 50 triệu VND)
        boolean mfaRequired = request.getAmount().compareTo(MFA_THRESHOLD) > 0;
        if (mfaRequired) {
            // Tạo OTP 6 số, lưu Redis TTL 5 phút
            String otp = String.format("%06d", (int)(Math.random() * 1_000_000));
            redisTemplate.opsForValue().set(OTP_PREFIX + tx.getId(), otp, Duration.ofMinutes(5));

            // Publish event yêu cầu gửi OTP
            kafkaTemplate.send("notification.otp.required", tx.getId().toString(),
                Map.of("transactionId", tx.getId(), "userId", userId, "amount", request.getAmount()));

            log.info("MFA required for transaction: {} amount: {}", tx.getId(), request.getAmount());
        }

        // 5. Publish PaymentCreatedEvent → Fraud Service sẽ process async
        PaymentCreatedEvent event = PaymentCreatedEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .timestamp(LocalDateTime.now())
            .traceId(UUID.randomUUID().toString())
            .payload(PaymentCreatedEvent.Payload.builder()
                .transactionId(tx.getId())
                .fromAccountId(request.getFromAccountId())
                .toAccountId(request.getToAccountId())
                .amount(request.getAmount())
                .type(tx.getType().name())
                .initiatedBy(userId)
                .deviceId(request.getDeviceId())
                .ipAddress(ipAddress)
                .build())
            .build();

        kafkaTemplate.send("payment.created", tx.getId().toString(), event);

        TransactionResponse response = toResponse(tx);
        response.setOtpRequired(mfaRequired);
        return response;
    }

    @Transactional
    public TransactionResponse confirmOtp(UUID transactionId, String otp, UUID userId) {
        Transaction tx = transactionRepository.findById(transactionId)
            .orElseThrow(() -> PaymentException.notFound(transactionId.toString()));

        String storedOtp = (String) redisTemplate.opsForValue().get(OTP_PREFIX + transactionId);
        if (storedOtp == null) {
            throw new PaymentException("OTP expired", org.springframework.http.HttpStatus.GONE, "OTP_EXPIRED");
        }
        if (!storedOtp.equals(otp)) {
            throw new PaymentException("Invalid OTP", org.springframework.http.HttpStatus.BAD_REQUEST, "INVALID_OTP");
        }

        tx.setOtpVerified(true);
        tx = transactionRepository.save(tx);
        redisTemplate.delete(OTP_PREFIX + transactionId);

        // Tiếp tục xử lý giao dịch
        kafkaTemplate.send("payment.otp.verified", transactionId.toString(),
            Map.of("transactionId", transactionId));

        log.info("OTP verified for transaction: {}", transactionId);
        return toResponse(tx);
    }

    @Transactional
    public TransactionResponse cancelTransaction(UUID transactionId, UUID userId) {
        Transaction tx = transactionRepository.findById(transactionId)
            .orElseThrow(() -> PaymentException.notFound(transactionId.toString()));

        if (tx.getStatus() != Transaction.TransactionStatus.PENDING) {
            throw new PaymentException("Cannot cancel non-pending transaction",
                org.springframework.http.HttpStatus.CONFLICT, "INVALID_STATE");
        }

        tx.setStatus(Transaction.TransactionStatus.CANCELLED);
        return toResponse(transactionRepository.save(tx));
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(UUID transactionId) {
        return transactionRepository.findById(transactionId)
            .map(this::toResponse)
            .orElseThrow(() -> PaymentException.notFound(transactionId.toString()));
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getHistory(UUID accountId, Pageable pageable) {
        return transactionRepository.findByAccountId(accountId, pageable)
            .map(this::toResponse);
    }

    // Kafka Consumer: nhận kết quả từ Fraud Service
    @KafkaListener(topics = "fraud.result", groupId = "payment-service")
    @Transactional
    public void handleFraudResult(Map<String, Object> event) {
        String transactionId = (String) event.get("transactionId");
        String decision = (String) event.get("decision");
        Object fraudScoreObj = event.get("fraudScore");
        Double fraudScore = fraudScoreObj instanceof Number ? ((Number) fraudScoreObj).doubleValue() : null;

        Transaction tx = transactionRepository.findById(UUID.fromString(transactionId))
            .orElse(null);
        if (tx == null) return;

        tx.setFraudScore(fraudScore != null ? BigDecimal.valueOf(fraudScore) : null);
        tx.setFraudDecision(Transaction.FraudDecision.valueOf(decision));

        if ("BLOCK".equals(decision)) {
            tx.setStatus(Transaction.TransactionStatus.FAILED);
            log.warn("Transaction BLOCKED by fraud: {}", transactionId);
        } else if ("ALLOW".equals(decision) && (tx.getOtpVerified() || tx.getAmount().compareTo(MFA_THRESHOLD) <= 0)) {
            processPayment(tx);
        }

        transactionRepository.save(tx);
    }

    // Kafka Consumer: nhận event khi OTP đã verify
    @KafkaListener(topics = "payment.otp.verified", groupId = "payment-service-otp")
    @Transactional
    public void handleOtpVerified(Map<String, Object> event) {
        UUID transactionId = UUID.fromString((String) event.get("transactionId"));
        Transaction tx = transactionRepository.findById(transactionId).orElse(null);
        if (tx != null && tx.getFraudDecision() == Transaction.FraudDecision.ALLOW) {
            processPayment(tx);
            transactionRepository.save(tx);
        }
    }

    private void processPayment(Transaction tx) {
        tx.setStatus(Transaction.TransactionStatus.COMPLETED);
        tx.setCompletedAt(LocalDateTime.now());

        // Publish completed event → Notification, Report, Audit consume
        PaymentCompletedEvent completedEvent = PaymentCompletedEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .timestamp(LocalDateTime.now())
            .payload(PaymentCompletedEvent.Payload.builder()
                .transactionId(tx.getId())
                .fromAccountId(tx.getFromAccountId())
                .toAccountId(tx.getToAccountId())
                .amount(tx.getAmount())
                .referenceNo(tx.getReferenceNo())
                .category(tx.getCategory())
                .type(tx.getType().name())
                .build())
            .build();

        kafkaTemplate.send("payment.completed", tx.getId().toString(), completedEvent);
        log.info("Payment completed: {} ref: {}", tx.getId(), tx.getReferenceNo());
    }

    private String generateReferenceNo() {
        return "TXN" + System.currentTimeMillis() + String.format("%04d", (int)(Math.random() * 10000));
    }

    private TransactionResponse toResponse(Transaction tx) {
        return TransactionResponse.builder()
            .id(tx.getId())
            .referenceNo(tx.getReferenceNo())
            .fromAccountId(tx.getFromAccountId())
            .toAccountId(tx.getToAccountId())
            .amount(tx.getAmount())
            .fee(tx.getFee())
            .currency(tx.getCurrency())
            .type(tx.getType())
            .status(tx.getStatus())
            .description(tx.getDescription())
            .category(tx.getCategory())
            .fraudDecision(tx.getFraudDecision())
            .createdAt(tx.getCreatedAt())
            .completedAt(tx.getCompletedAt())
            .build();
    }
}
