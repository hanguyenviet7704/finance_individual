package com.finance.payment.controller;

import com.finance.payment.dto.TransactionResponse;
import com.finance.payment.dto.TransferRequest;
import com.finance.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "API chuyển khoản và quản lý giao dịch")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "Xem tất cả giao dịch (Admin)", description = "Lấy toàn bộ giao dịch trong hệ thống. Yêu cầu quyền ADMIN.")
    @GetMapping("/admin/all")
    public ResponseEntity<Page<TransactionResponse>> getAllTransactions(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(paymentService.getAllTransactions(pageable));
    }

    @Operation(
        summary = "Chuyển khoản",
        description = """
            Thực hiện lệnh chuyển tiền. Luồng xử lý:
            1. Kiểm tra idempotency (tránh giao dịch trùng)
            2. Nếu số tiền > 50 triệu VND → yêu cầu OTP (trả về 202 Accepted)
            3. Gửi sang Fraud Service phân tích rủi ro
            4. Nếu được chấp thuận → thực hiện chuyển tiền

            **Header bắt buộc:** `Idempotency-Key: {UUID}` — sinh UUID mới cho mỗi lần chuyển tiền.
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Chuyển tiền thành công",
            content = @Content(schema = @Schema(implementation = TransactionResponse.class))),
        @ApiResponse(responseCode = "202", description = "Chờ xác nhận OTP (số tiền > 50 triệu)",
            content = @Content(schema = @Schema(implementation = TransactionResponse.class))),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ hoặc không đủ số dư", content = @Content),
        @ApiResponse(responseCode = "409", description = "Giao dịch trùng lặp (idempotency-key đã dùng)", content = @Content),
        @ApiResponse(responseCode = "422", description = "Giao dịch bị chặn do gian lận", content = @Content)
    })
    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(
            @Parameter(hidden = true) @RequestHeader("X-User-ID") UUID userId,
            @Parameter(description = "UUID duy nhất cho mỗi lần chuyển tiền. Dùng để tránh giao dịch trùng khi retry.", example = "550e8400-e29b-41d4-a716-446655440001", required = true)
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @Valid @RequestBody TransferRequest request,
            HttpServletRequest httpRequest) {
        TransactionResponse response = paymentService.initiateTransfer(
            userId, idempotencyKey, request, httpRequest.getRemoteAddr());
        HttpStatus status = Boolean.TRUE.equals(response.getOtpRequired())
            ? HttpStatus.ACCEPTED : HttpStatus.CREATED;
        return ResponseEntity.status(status).body(response);
    }

    @Operation(summary = "Xem chi tiết giao dịch", description = "Lấy thông tin đầy đủ của một giao dịch theo ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy giao dịch", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> getTransaction(
            @Parameter(description = "UUID của giao dịch") @PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.getTransaction(id));
    }

    @Operation(summary = "Lịch sử giao dịch", description = "Lấy lịch sử giao dịch của một tài khoản, phân trang, sắp xếp theo thời gian giảm dần.")
    @GetMapping("/history")
    public ResponseEntity<Page<TransactionResponse>> getHistory(
            @Parameter(description = "UUID tài khoản cần xem lịch sử") @RequestParam UUID accountId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(paymentService.getHistory(accountId, pageable));
    }

    @Operation(
        summary = "Xác nhận OTP",
        description = "Nhập OTP được gửi qua SMS để xác nhận giao dịch lớn (> 50 triệu VND). OTP hết hạn sau 5 phút."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OTP hợp lệ — giao dịch được xử lý"),
        @ApiResponse(responseCode = "400", description = "OTP sai hoặc đã hết hạn", content = @Content)
    })
    @PostMapping("/{id}/confirm")
    public ResponseEntity<TransactionResponse> confirmOtp(
            @Parameter(description = "UUID của giao dịch") @PathVariable UUID id,
            @Parameter(hidden = true) @RequestHeader("X-User-ID") UUID userId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                content = @Content(examples = @ExampleObject(value = "{\"otp\": \"123456\"}"))
            )
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(paymentService.confirmOtp(id, body.get("otp"), userId));
    }

    @Operation(summary = "Hủy giao dịch", description = "Hủy giao dịch đang ở trạng thái PENDING. Không thể hủy giao dịch đã COMPLETED.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Hủy thành công"),
        @ApiResponse(responseCode = "409", description = "Không thể hủy giao dịch đã hoàn thành", content = @Content)
    })
    @PostMapping("/{id}/cancel")
    public ResponseEntity<TransactionResponse> cancelTransaction(
            @Parameter(description = "UUID của giao dịch") @PathVariable UUID id,
            @Parameter(hidden = true) @RequestHeader("X-User-ID") UUID userId) {
        return ResponseEntity.ok(paymentService.cancelTransaction(id, userId));
    }
}
