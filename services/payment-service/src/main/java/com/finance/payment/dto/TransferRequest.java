package com.finance.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Schema(description = "Request chuyển tiền")
public class TransferRequest {

    @NotNull(message = "Source account is required")
    @Schema(description = "UUID tài khoản nguồn", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID fromAccountId;

    @NotNull(message = "Destination account is required")
    @Schema(description = "UUID tài khoản đích", example = "660e8400-e29b-41d4-a716-446655440111")
    private UUID toAccountId;

    @NotNull
    @DecimalMin(value = "1000", message = "Minimum transfer amount is 1,000 VND")
    @Schema(description = "Số tiền chuyển (VND)", example = "5000000", minimum = "1000")
    private BigDecimal amount;

    @Schema(description = "Nội dung chuyển khoản", example = "Thanh toán tiền nhà tháng 4")
    private String description;

    @Schema(description = "Phân loại chi tiêu (tùy chọn)", example = "Ăn uống")
    private String category;

    @Schema(description = "ID thiết bị (dùng cho fraud detection)", example = "device-abc-123")
    private String deviceId;

    // Header Idempotency-Key được lấy từ HTTP header, không phải body
}
