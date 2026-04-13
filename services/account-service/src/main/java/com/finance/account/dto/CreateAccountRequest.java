package com.finance.account.dto;

import com.finance.account.domain.Account;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@Schema(description = "Request tạo tài khoản ngân hàng mới")
public class CreateAccountRequest {

    @NotNull(message = "Account type is required")
    @Schema(description = "Loại tài khoản", example = "SAVING", allowableValues = {"SAVING", "CHECKING", "LOAN"})
    private Account.AccountType accountType;

    @NotBlank(message = "Full name is required")
    @Size(max = 100)
    @Schema(description = "Họ và tên đầy đủ", example = "Nguyen Van A")
    private String fullName;

    @Email(message = "Invalid email format")
    @Schema(description = "Địa chỉ email", example = "nguyenvana@gmail.com")
    private String email;

    @Pattern(regexp = "^(\\+84|0)[0-9]{9}$", message = "Invalid Vietnamese phone number")
    @Schema(description = "Số điện thoại Việt Nam", example = "0901234567")
    private String phone;

    @Schema(description = "Đơn vị tiền tệ", example = "VND", defaultValue = "VND")
    private String currency = "VND";
}
