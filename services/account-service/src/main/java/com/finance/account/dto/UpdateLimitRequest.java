package com.finance.account.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateLimitRequest {

    @NotNull
    @DecimalMin(value = "100000", message = "Minimum daily limit is 100,000 VND")
    private BigDecimal dailyLimit;
}
