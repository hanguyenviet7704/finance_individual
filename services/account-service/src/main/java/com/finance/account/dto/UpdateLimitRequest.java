package com.finance.account.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "Request cập nhật hạn mức giao dịch ngày")
public class UpdateLimitRequest {

    @NotNull
    @DecimalMin(value = "100000", message = "Minimum daily limit is 100,000 VND")
    @Schema(description = "Hạn mức chuyển tiền tối đa trong ngày (VND)", example = "50000000", minimum = "100000")
    private BigDecimal dailyLimit;
}
