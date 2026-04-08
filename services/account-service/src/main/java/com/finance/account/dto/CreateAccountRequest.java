package com.finance.account.dto;

import com.finance.account.domain.Account;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateAccountRequest {

    @NotNull(message = "Account type is required")
    private Account.AccountType accountType;

    @NotBlank(message = "Full name is required")
    @Size(max = 100)
    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^(\\+84|0)[0-9]{9}$", message = "Invalid Vietnamese phone number")
    private String phone;

    private String currency = "VND";
}
