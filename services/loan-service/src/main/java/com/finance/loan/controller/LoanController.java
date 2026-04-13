package com.finance.loan.controller;

import com.finance.loan.dto.ApplyLoanRequest;
import com.finance.loan.dto.LoanResponse;
import com.finance.loan.service.CreditScoreService;
import com.finance.loan.service.LoanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
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
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
@Tag(name = "Loan Management", description = "API quản lý vay vốn: nộp đơn, thẩm định tín dụng, duyệt, giải ngân")
@SecurityRequirement(name = "bearerAuth")
public class LoanController {

    private final LoanService loanService;
    private final CreditScoreService creditScoreService;

    @Operation(
        summary = "Nộp đơn vay vốn",
        description = "Tạo đơn xin vay mới. Hệ thống tự động tính điểm tín dụng và chuyển trạng thái PENDING → UNDER_REVIEW."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Nộp đơn thành công",
            content = @Content(schema = @Schema(implementation = LoanResponse.class))),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ", content = @Content),
        @ApiResponse(responseCode = "422", description = "Điểm tín dụng quá thấp", content = @Content)
    })
    @PostMapping("/apply")
    public ResponseEntity<LoanResponse> applyLoan(
            @Parameter(hidden = true) @RequestHeader("X-User-ID") UUID userId,
            @Parameter(description = "UUID tài khoản ngân hàng dùng để giải ngân", required = true) @RequestParam UUID accountId,
            @Valid @RequestBody ApplyLoanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(loanService.applyLoan(userId, accountId, request));
    }

    @Operation(summary = "Xem chi tiết khoản vay", description = "Lấy thông tin đầy đủ của khoản vay bao gồm lịch trả nợ và trạng thái giấy tờ.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy khoản vay", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<LoanResponse> getLoan(
            @Parameter(description = "UUID của khoản vay") @PathVariable UUID id) {
        return ResponseEntity.ok(loanService.getLoan(id));
    }

    @Operation(summary = "Danh sách khoản vay của tôi", description = "Lấy tất cả khoản vay của người dùng đang đăng nhập, phân trang.")
    @GetMapping
    public ResponseEntity<Page<LoanResponse>> getUserLoans(
            @Parameter(hidden = true) @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(loanService.getUserLoans(userId, pageable));
    }

    @Operation(
        summary = "Duyệt khoản vay",
        description = "Nhân viên tín dụng duyệt khoản vay với số tiền và lãi suất thực tế. Trạng thái chuyển UNDER_REVIEW → APPROVED."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Duyệt thành công"),
        @ApiResponse(responseCode = "409", description = "Trạng thái không hợp lệ để duyệt", content = @Content)
    })
    @PutMapping("/{id}/approve")
    public ResponseEntity<LoanResponse> approveLoan(
            @Parameter(description = "UUID của khoản vay") @PathVariable UUID id,
            @Parameter(hidden = true) @RequestHeader("X-User-ID") UUID officerId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                content = @Content(examples = @ExampleObject(
                    value = "{\"approvedAmount\": 50000000, \"interestRate\": 8.5}"))
            )
            @RequestBody Map<String, Object> body) {
        BigDecimal approvedAmount = new BigDecimal(body.get("approvedAmount").toString());
        BigDecimal interestRate   = new BigDecimal(body.get("interestRate").toString());
        return ResponseEntity.ok(loanService.approveLoan(id, officerId, approvedAmount, interestRate));
    }

    @Operation(summary = "Từ chối khoản vay", description = "Từ chối đơn vay với lý do cụ thể. Trạng thái chuyển UNDER_REVIEW → REJECTED.")
    @PutMapping("/{id}/reject")
    public ResponseEntity<LoanResponse> rejectLoan(
            @Parameter(description = "UUID của khoản vay") @PathVariable UUID id,
            @Parameter(hidden = true) @RequestHeader("X-User-ID") UUID officerId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                content = @Content(examples = @ExampleObject(value = "{\"reason\": \"Thu nhập không đủ điều kiện\"}"))
            )
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(loanService.rejectLoan(id, officerId, body.get("reason")));
    }

    @Operation(summary = "Xem điểm tín dụng", description = "Tính và trả về điểm tín dụng của người dùng (0-100). Dựa trên: số dư tài khoản, lịch sử giao dịch, lịch sử gian lận, kỷ luật trả nợ.")
    @GetMapping("/score/{userId}")
    public ResponseEntity<Map<String, Object>> getCreditScore(
            @Parameter(description = "UUID của người dùng") @PathVariable UUID userId) {
        int score = creditScoreService.calculateScore(userId);
        return ResponseEntity.ok(Map.of("userId", userId, "creditScore", score));
    }
}
