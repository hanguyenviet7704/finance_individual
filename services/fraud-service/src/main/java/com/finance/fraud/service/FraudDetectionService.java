package com.finance.fraud.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.fraud.domain.FraudHistory;
import com.finance.fraud.engine.FraudContext;
import com.finance.fraud.engine.RuleEngine;
import com.finance.fraud.repository.FraudHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudDetectionService {

    private final RuleEngine ruleEngine;
    private final FraudHistoryRepository fraudHistoryRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // Redis key patterns
    private static final String TX_COUNT_1H   = "fraud:tx_count:%s:1h";
    private static final String TX_COUNT_24H  = "fraud:tx_count:%s:24h";
    private static final String AMT_AVG_30D   = "fraud:amount_avg:%s:30d";
    private static final String KNOWN_DEVICES = "fraud:devices:%s";
    private static final String BLACKLIST     = "fraud:blacklist";

    @KafkaListener(topics = "payment.created", groupId = "fraud-service")
    @Transactional
    public void analyzeTransaction(Map<String, Object> rawEvent) {
        try {
            Map<String, Object> payload = (Map<String, Object>) rawEvent.get("payload");
            if (payload == null) return;

            UUID transactionId = UUID.fromString((String) payload.get("transactionId"));
            UUID userId        = UUID.fromString((String) payload.get("initiatedBy"));
            UUID fromAccountId = UUID.fromString((String) payload.get("fromAccountId"));
            UUID toAccountId   = UUID.fromString((String) payload.get("toAccountId"));
            BigDecimal amount  = new BigDecimal(payload.get("amount").toString());
            String deviceId    = (String) payload.getOrDefault("deviceId", "");
            String ipAddress   = (String) payload.getOrDefault("ipAddress", "");

            log.info("Analyzing transaction: {} amount: {}", transactionId, amount);

            // Build context với feature store từ Redis
            FraudContext context = FraudContext.builder()
                .transactionId(transactionId)
                .userId(userId)
                .fromAccountId(fromAccountId)
                .toAccountId(toAccountId)
                .amount(amount)
                .deviceId(deviceId)
                .ipAddress(ipAddress)
                .hourOfDay(LocalDateTime.now().getHour())
                .userAvgAmountLast30Days(getAvgAmount(userId))
                .transactionCountLast1Hour(getTxCount1h(userId))
                .transactionCountLast24Hours(getTxCount24h(userId))
                .isNewDevice(isNewDevice(userId, deviceId))
                .isNewBeneficiary(isNewBeneficiary(userId, toAccountId))
                .isBeneficiaryBlacklisted(isBlacklisted(toAccountId))
                .build();

            // Tầng 1: Rule Engine
            RuleEngine.RuleResult ruleResult = ruleEngine.evaluate(context);

            // Tầng 2: Kết luận dựa trên rule score
            FraudHistory.FraudDecision decision = makeDecision(ruleResult.score());

            // Lưu lịch sử fraud
            FraudHistory history = FraudHistory.builder()
                .transactionId(transactionId)
                .userId(userId)
                .amount(amount)
                .ruleScore(BigDecimal.valueOf(ruleResult.score()))
                .totalScore(BigDecimal.valueOf(ruleResult.score()))
                .decision(decision)
                .triggeredRules(objectMapper.writeValueAsString(ruleResult.triggeredRules()))
                .ipAddress(ipAddress)
                .deviceId(deviceId)
                .build();
            fraudHistoryRepository.save(history);

            // Cập nhật feature store
            updateFeatureStore(userId, toAccountId, deviceId, amount);

            // Publish kết quả về Payment Service
            kafkaTemplate.send("fraud.result", transactionId.toString(), Map.of(
                "transactionId", transactionId.toString(),
                "decision", decision.name(),
                "fraudScore", ruleResult.score(),
                "triggeredRules", ruleResult.triggeredRules()
            ));

            // Nếu BLOCK → publish fraud.detected để Account Service khóa tài khoản
            if (decision == FraudHistory.FraudDecision.BLOCK) {
                kafkaTemplate.send("fraud.detected", userId.toString(), Map.of(
                    "userId", userId.toString(),
                    "transactionId", transactionId.toString(),
                    "reason", "High fraud score: " + ruleResult.score()
                ));
                log.warn("FRAUD DETECTED: tx={} user={} score={}", transactionId, userId, ruleResult.score());
            }

        } catch (Exception e) {
            log.error("Error analyzing transaction: {}", e.getMessage(), e);
        }
    }

    private FraudHistory.FraudDecision makeDecision(int ruleScore) {
        if (ruleScore >= 80) return FraudHistory.FraudDecision.BLOCK;
        if (ruleScore >= 40) return FraudHistory.FraudDecision.REVIEW;
        return FraudHistory.FraudDecision.ALLOW;
    }

    private BigDecimal getAvgAmount(UUID userId) {
        Object val = redisTemplate.opsForValue().get(String.format(AMT_AVG_30D, userId));
        return val != null ? new BigDecimal(val.toString()) : new BigDecimal("5000000");
    }

    private int getTxCount1h(UUID userId) {
        Object val = redisTemplate.opsForValue().get(String.format(TX_COUNT_1H, userId));
        return val != null ? Integer.parseInt(val.toString()) : 0;
    }

    private int getTxCount24h(UUID userId) {
        Object val = redisTemplate.opsForValue().get(String.format(TX_COUNT_24H, userId));
        return val != null ? Integer.parseInt(val.toString()) : 0;
    }

    private boolean isNewDevice(UUID userId, String deviceId) {
        if (deviceId == null || deviceId.isEmpty()) return false;
        return !Boolean.TRUE.equals(redisTemplate.opsForSet()
            .isMember(String.format(KNOWN_DEVICES, userId), deviceId));
    }

    private boolean isNewBeneficiary(UUID userId, UUID toAccountId) {
        String key = "fraud:beneficiaries:" + userId;
        return !Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(key, toAccountId.toString()));
    }

    private boolean isBlacklisted(UUID accountId) {
        return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(BLACKLIST, accountId.toString()));
    }

    private void updateFeatureStore(UUID userId, UUID toAccountId, String deviceId, BigDecimal amount) {
        // Tăng tx count
        String key1h = String.format(TX_COUNT_1H, userId);
        redisTemplate.opsForValue().increment(key1h);
        redisTemplate.expire(key1h, Duration.ofHours(1));

        String key24h = String.format(TX_COUNT_24H, userId);
        redisTemplate.opsForValue().increment(key24h);
        redisTemplate.expire(key24h, Duration.ofHours(24));

        // Lưu device đã biết
        if (deviceId != null && !deviceId.isEmpty()) {
            redisTemplate.opsForSet().add(String.format(KNOWN_DEVICES, userId), deviceId);
            redisTemplate.expire(String.format(KNOWN_DEVICES, userId), Duration.ofDays(90));
        }

        // Lưu beneficiary đã biết
        String benKey = "fraud:beneficiaries:" + userId;
        redisTemplate.opsForSet().add(benKey, toAccountId.toString());
        redisTemplate.expire(benKey, Duration.ofDays(90));
    }
}
