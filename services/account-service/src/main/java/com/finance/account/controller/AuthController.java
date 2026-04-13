package com.finance.account.controller;

import com.finance.account.dto.RegisterRequest;
import com.finance.account.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "API đăng nhập và đăng xuất. Không yêu cầu JWT token.")
public class AuthController {

    private final AuthService authService;

    @Operation(
        summary = "Đăng ký tài khoản",
        description = "Tạo tài khoản ngân hàng mới cho khách hàng. Tự động đăng nhập sau khi đăng ký thành công."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Đăng ký thành công — trả về JWT token và số tài khoản",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = "{\"access_token\": \"eyJ...\", \"refresh_token\": \"uuid\", \"account_number\": \"FIN0001234567890\"}")
            )),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ hoặc mật khẩu không khớp", content = @Content),
        @ApiResponse(responseCode = "409", description = "Email hoặc số điện thoại đã tồn tại", content = @Content)
    })
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(authService.register(request));
    }

    @Operation(
        summary = "Đăng nhập",
        description = "Xác thực bằng số tài khoản và mật khẩu. Trả về JWT token (hết hạn sau 15 phút)."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Đăng nhập thành công — trả về JWT token",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = "{\"token\": \"eyJhbGciOiJIUzI1NiJ9...\", \"type\": \"Bearer\"}")
            )),
        @ApiResponse(responseCode = "401", description = "Sai số tài khoản hoặc mật khẩu", content = @Content),
        @ApiResponse(responseCode = "423", description = "Tài khoản bị đóng băng", content = @Content)
    })
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Thông tin đăng nhập",
                content = @Content(
                    mediaType = "application/json",
                    examples = @ExampleObject(value = "{\"account_number\": \"1900123456789\", \"password\": \"MyPassword123!\"}")
                )
            )
            @RequestBody Map<String, String> request) {
        String accountNumber = request.get("account_number");
        String password = request.get("password");
        return ResponseEntity.ok(authService.login(accountNumber, password));
    }

    @Operation(
        summary = "Đăng xuất",
        description = "Đăng xuất khỏi hệ thống. JWT là stateless nên client tự xóa token. Production: token sẽ được đưa vào blacklist Redis."
    )
    @ApiResponse(responseCode = "200", description = "Đăng xuất thành công",
        content = @Content(
            mediaType = "application/json",
            examples = @ExampleObject(value = "{\"message\": \"Logged out successfully\"}")
        ))
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
