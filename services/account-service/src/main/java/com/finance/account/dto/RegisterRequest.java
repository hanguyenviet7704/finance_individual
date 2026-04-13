package com.finance.account.dto;

import com.finance.account.domain.Account;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@Schema(description = "Request đăng ký tài khoản ngân hàng mới")
public class RegisterRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    @Schema(description = "Họ và tên đầy đủ", example = "Nguyen Van A")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Schema(description = "Địa chỉ email", example = "nguyenvana@gmail.com")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(\\+84|0)[0-9]{9}$", message = "Số điện thoại Việt Nam không hợp lệ")
    @Schema(description = "Số điện thoại Việt Nam", example = "0901234567")
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "Mật khẩu ít nhất 8 ký tự")
    @Schema(description = "Mật khẩu (tối thiểu 8 ký tự)", example = "MyPass123!")
    private String password;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    @Schema(description = "Xác nhận mật khẩu")
    private String confirmPassword;

    @NotNull(message = "Loại tài khoản không được để trống")
    @Schema(description = "Loại tài khoản", example = "SAVING", allowableValues = {"SAVING", "CHECKING"})
    private Account.AccountType accountType;
}
