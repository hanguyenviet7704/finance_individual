package com.finance.loan.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreditScoreService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String CREDIT_SCORE_KEY = "credit_score:%s";

    /**
     * Tính credit score theo các yếu tố:
     * - payment_history:       35% — lịch sử trả đúng hạn
     * - credit_utilization:    30% — tỷ lệ sử dụng hạn mức
     * - history_length:        15% — thời gian có tài khoản
     * - transaction_diversity: 10% — đa dạng loại giao dịch
     * - recent_inquiries:      10% — số lần tra cứu tín dụng
     */
    public int calculateScore(UUID userId) {
        // Kiểm tra cache trước (TTL 24h)
        String cacheKey = String.format(CREDIT_SCORE_KEY, userId);
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return Integer.parseInt(cached.toString());
        }

        // Trong thực tế, lấy data từ các services khác qua Feign/Kafka
        // Đây là demo với giá trị mô phỏng
        double paymentHistory      = 0.85;  // 85% trả đúng hạn
        double creditUtilization   = 0.40;  // Sử dụng 40% hạn mức (càng thấp càng tốt → inverted)
        double historyLength       = 0.70;  // Tài khoản 2 năm
        double transactionDiversity = 0.60; // Đa dạng giao dịch
        double recentInquiries     = 0.90;  // Ít tra cứu gần đây

        double weights[] = {0.35, 0.30, 0.15, 0.10, 0.10};
        double scores[]  = {
            paymentHistory,
            1.0 - creditUtilization,    // Inverted: thấp hơn = tốt hơn
            historyLength,
            transactionDiversity,
            recentInquiries
        };

        double finalScore = 0;
        for (int i = 0; i < weights.length; i++) {
            finalScore += scores[i] * weights[i];
        }

        // Scale 300–850 (như FICO score)
        int scaledScore = (int)(300 + finalScore * 550);

        // Cache 24h
        redisTemplate.opsForValue().set(cacheKey, String.valueOf(scaledScore), Duration.ofHours(24));

        log.info("Credit score calculated for user {}: {}", userId, scaledScore);
        return scaledScore;
    }
}
