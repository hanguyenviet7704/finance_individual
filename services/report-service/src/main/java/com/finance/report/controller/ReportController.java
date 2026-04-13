package com.finance.report.controller;

import com.finance.report.domain.mongo.TransactionReadModel;
import com.finance.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "API báo cáo và sao kê tài khoản. Dữ liệu được build từ Kafka events theo mô hình CQRS Read Model.")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    @Operation(
        summary = "Sao kê tài khoản",
        description = "Lấy lịch sử giao dịch của tài khoản trong khoảng thời gian. Mỗi giao dịch chuyển tiền tạo 2 bản ghi: DEBIT (tài khoản nguồn) và CREDIT (tài khoản đích)."
    )
    @ApiResponse(responseCode = "200", description = "Danh sách giao dịch phân trang")
    @GetMapping("/statement")
    public ResponseEntity<Page<TransactionReadModel>> getStatement(
            @Parameter(description = "UUID tài khoản", required = true, example = "550e8400-e29b-41d4-a716-446655440000")
            @RequestParam String accountId,
            @Parameter(description = "Từ ngày (ISO 8601)", example = "2026-04-01T00:00:00")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Đến ngày (ISO 8601)", example = "2026-04-30T23:59:59")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(reportService.getStatement(accountId, from, to, pageable));
    }

    @Operation(
        summary = "Tóm tắt tháng",
        description = "Thống kê giao dịch trong tháng: tổng tiền vào (CREDIT), tổng tiền ra (DEBIT), thay đổi ròng = credit - debit."
    )
    @ApiResponse(responseCode = "200", description = "Trả về {totalCredit, totalDebit, netChange, transactionCount}")
    @GetMapping("/summary/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlySummary(
            @Parameter(description = "UUID tài khoản", required = true) @RequestParam String accountId,
            @Parameter(description = "Năm", example = "2026") @RequestParam int year,
            @Parameter(description = "Tháng (1-12)", example = "4") @RequestParam int month) {
        return ResponseEntity.ok(reportService.getMonthlySummary(accountId, year, month));
    }
}
