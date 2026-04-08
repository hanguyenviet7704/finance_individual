package com.finance.account.dto;

import com.finance.account.domain.Account;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AccountResponse {
    private UUID id;
    private UUID userId;
    private String accountNumber;
    private Account.AccountType accountType;
    private BigDecimal balance;
    private BigDecimal availableBalance;
    private String currency;
    private Account.AccountStatus status;
    private BigDecimal dailyLimit;
    private BigDecimal dailyUsed;
    private Account.KycStatus kycStatus;
    private String fullName;
    private String email;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
