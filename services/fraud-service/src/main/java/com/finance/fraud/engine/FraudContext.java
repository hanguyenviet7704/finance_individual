package com.finance.fraud.engine;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class FraudContext {
    private UUID transactionId;
    private UUID userId;
    private UUID fromAccountId;
    private UUID toAccountId;
    private BigDecimal amount;
    private String ipAddress;
    private String deviceId;
    private int hourOfDay;

    // Feature store từ Redis
    private BigDecimal userAvgAmountLast30Days;
    private int transactionCountLast1Hour;
    private int transactionCountLast24Hours;
    private boolean isNewDevice;
    private boolean isNewBeneficiary;
    private boolean isBeneficiaryBlacklisted;
}
