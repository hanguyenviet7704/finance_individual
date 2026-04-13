package com.finance.payment.dto;

import com.finance.payment.domain.Transaction;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin giao dịch")
public class TransactionResponse {
    private UUID id;
    @Schema(description = "Mã giao dịch duy nhất", example = "TXN-20260408-ABC123")
    private String referenceNo;
    private UUID fromAccountId;
    private UUID toAccountId;
    private BigDecimal amount;
    private BigDecimal fee;
    private String currency;
    private Transaction.TransactionType type;
    @Schema(description = "Trạng thái giao dịch")
    private Transaction.TransactionStatus status;
    private String description;
    @Schema(description = "Phân loại chi tiêu")
    private String category;
    @Schema(description = "Kết quả phân tích gian lận")
    private Transaction.FraudDecision fraudDecision;
    @Schema(description = "Có cần xác nhận OTP không (khi số tiền > 50 triệu)")
    private Boolean otpRequired;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    public static TransactionResponse pending(UUID id, String referenceNo) {
        return TransactionResponse.builder()
            .id(id)
            .referenceNo(referenceNo)
            .status(Transaction.TransactionStatus.PENDING)
            .build();
    }
}
