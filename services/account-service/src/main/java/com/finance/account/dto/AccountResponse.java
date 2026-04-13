package com.finance.account.dto;

import com.finance.account.domain.Account;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Thông tin tài khoản ngân hàng")
public class AccountResponse {
    @Schema(description = "UUID tài khoản", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;
    private UUID userId;
    @Schema(description = "Số tài khoản", example = "1900123456789")
    private String accountNumber;
    private Account.AccountType accountType;
    @Schema(description = "Số dư thực tế (VND)", example = "5000000")
    private BigDecimal balance;
    @Schema(description = "Số dư khả dụng (VND)", example = "4500000")
    private BigDecimal availableBalance;
    private String currency;
    @Schema(description = "Trạng thái tài khoản", example = "ACTIVE")
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
