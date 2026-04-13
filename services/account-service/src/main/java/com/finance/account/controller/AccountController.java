package com.finance.account.controller;

import com.finance.account.dto.AccountResponse;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.account.dto.UpdateLimitRequest;
import com.finance.account.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Account Management", description = "API quản lý tài khoản ngân hàng")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {

    private final AccountService accountService;

    @Operation(summary = "Lấy danh sách tài khoản", description = "Trả về danh sách tất cả tài khoản có phân trang. Yêu cầu quyền ADMIN.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực", content = @Content),
        @ApiResponse(responseCode = "403", description = "Không có quyền", content = @Content)
    })
    @GetMapping
    public ResponseEntity<Page<AccountResponse>> getAllAccounts(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(accountService.getAllAccounts(pageable));
    }

    @Operation(summary = "Tạo tài khoản mới", description = "Tạo tài khoản ngân hàng mới cho người dùng. userId được lấy từ JWT token qua header X-User-ID do API Gateway inject.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Tạo tài khoản thành công",
            content = @Content(schema = @Schema(implementation = AccountResponse.class))),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ", content = @Content),
        @ApiResponse(responseCode = "401", description = "Chưa xác thực", content = @Content)
    })
    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @Parameter(hidden = true) @RequestHeader("X-User-ID") UUID userId,
            @Valid @RequestBody CreateAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(accountService.createAccount(userId, request));
    }

    @Operation(summary = "Xem chi tiết tài khoản", description = "Lấy thông tin chi tiết của một tài khoản theo ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công",
            content = @Content(schema = @Schema(implementation = AccountResponse.class))),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy tài khoản", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccount(
            @Parameter(description = "UUID của tài khoản", example = "550e8400-e29b-41d4-a716-446655440000")
            @PathVariable UUID id) {
        return ResponseEntity.ok(accountService.getAccount(id));
    }

    @Operation(summary = "Xem tài khoản của tôi", description = "Lấy thông tin tài khoản của người dùng đang đăng nhập.")
    @ApiResponse(responseCode = "200", description = "Thành công",
        content = @Content(schema = @Schema(implementation = AccountResponse.class)))
    @GetMapping("/me")
    public ResponseEntity<AccountResponse> getMyAccount(
            @Parameter(hidden = true) @RequestHeader("X-User-ID") UUID userId) {
        return ResponseEntity.ok(accountService.getAccountByUserId(userId));
    }

    @Operation(summary = "Xem chi tiết tài khoản theo số tài khoản", description = "Lấy thông tin chi tiết của một tài khoản bằng số tài khoản (accountNumber).")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công",
            content = @Content(schema = @Schema(implementation = AccountResponse.class))),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy tài khoản", content = @Content)
    })
    @GetMapping("/by-number/{accountNumber}")
    public ResponseEntity<AccountResponse> getAccountByNumber(
            @Parameter(description = "Số tài khoản", example = "FIN1234567890123")
            @PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getAccountByNumber(accountNumber));
    }

    @Operation(summary = "Kiểm tra số dư", description = "Lấy số dư hiện tại của tài khoản.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công — trả về {\"balance\": 1000000}"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy tài khoản", content = @Content)
    })
    @GetMapping("/{id}/balance")
    public ResponseEntity<Map<String, BigDecimal>> getBalance(
            @Parameter(description = "UUID của tài khoản") @PathVariable UUID id) {
        BigDecimal balance = accountService.getBalance(id);
        return ResponseEntity.ok(Map.of("balance", balance));
    }

    @Operation(summary = "Cập nhật hạn mức giao dịch", description = "Thay đổi hạn mức chuyển tiền trong ngày. Tối thiểu 100,000 VND.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
        @ApiResponse(responseCode = "400", description = "Hạn mức không hợp lệ", content = @Content)
    })
    @PutMapping("/{id}/limits")
    public ResponseEntity<AccountResponse> updateLimits(
            @Parameter(description = "UUID của tài khoản") @PathVariable UUID id,
            @Valid @RequestBody UpdateLimitRequest request) {
        return ResponseEntity.ok(accountService.updateLimits(id, request));
    }

    @Operation(summary = "Đóng băng tài khoản", description = "Tạm dừng mọi giao dịch trên tài khoản. Thường dùng khi phát hiện gian lận. Yêu cầu quyền ADMIN.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Đóng băng thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy tài khoản", content = @Content)
    })
    @PostMapping("/{id}/freeze")
    public ResponseEntity<AccountResponse> freezeAccount(
            @Parameter(description = "UUID của tài khoản") @PathVariable UUID id,
            @Parameter(description = "Lý do đóng băng", example = "Phát hiện giao dịch đáng ngờ")
            @RequestParam(defaultValue = "Manual freeze") String reason) {
        return ResponseEntity.ok(accountService.freezeAccount(id, reason));
    }

    @Operation(summary = "Mở đóng băng tài khoản", description = "Khôi phục hoạt động bình thường sau khi đóng băng. Yêu cầu quyền ADMIN.")
    @PostMapping("/{id}/unfreeze")
    public ResponseEntity<AccountResponse> unfreezeAccount(
            @Parameter(description = "UUID của tài khoản") @PathVariable UUID id) {
        return ResponseEntity.ok(accountService.unfreezeAccount(id));
    }

    @Operation(summary = "Đóng tài khoản", description = "Đóng vĩnh viễn tài khoản. Không thể hoàn tác. Yêu cầu quyền ADMIN.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Đóng tài khoản thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy tài khoản", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> closeAccount(
            @Parameter(description = "UUID của tài khoản") @PathVariable UUID id) {
        accountService.closeAccount(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Health check", description = "Kiểm tra trạng thái hoạt động của service.")
    @ApiResponse(responseCode = "200", description = "{\"status\": \"ok\"}")
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
