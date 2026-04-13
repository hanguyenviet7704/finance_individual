package com.finance.audit.controller;

import com.finance.audit.domain.AuditLog;
import com.finance.audit.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
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

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "API tra cứu log kiểm toán bất biến. Ghi lại toàn bộ hành động trong hệ thống để tuân thủ pháp lý. Chỉ đọc — không thể sửa hoặc xóa.")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

    private final AuditService auditService;

    @Operation(summary = "Tất cả audit logs", description = "Lấy toàn bộ log kiểm toán phân trang. Yêu cầu quyền ADMIN.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAllLogs(
            @PageableDefault(size = 20, sort = "timestamp") Pageable pageable) {
        return ResponseEntity.ok(auditService.getAllLogs(pageable));
    }

    @Operation(summary = "Logs theo actor", description = "Lấy tất cả hành động của một người dùng hoặc hệ thống cụ thể (actorId = userId hoặc 'system').")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping("/actor/{actorId}")
    public ResponseEntity<Page<AuditLog>> getLogsForActor(
            @Parameter(description = "UUID người thực hiện hoặc 'system'", example = "550e8400-e29b-41d4-a716-446655440000")
            @PathVariable String actorId,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(auditService.getLogsForActor(actorId, pageable));
    }

    @Operation(summary = "Logs theo resource", description = "Lấy lịch sử thay đổi của một tài nguyên cụ thể (tài khoản, giao dịch, khoản vay...).")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<Page<AuditLog>> getLogsForResource(
            @Parameter(description = "UUID của resource (transactionId, accountId, loanId...)")
            @PathVariable String resourceId,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(auditService.getLogsForResource(resourceId, pageable));
    }

    @Operation(summary = "Logs theo service và thời gian", description = "Lấy logs của một microservice cụ thể trong khoảng thời gian. Dùng để điều tra sự cố.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping("/service/{serviceName}")
    public ResponseEntity<Page<AuditLog>> getLogsByService(
            @Parameter(description = "Tên service", example = "payment-service") @PathVariable String serviceName,
            @Parameter(description = "Từ thời điểm (ISO 8601)", example = "2026-04-01T00:00:00")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Đến thời điểm (ISO 8601)", example = "2026-04-30T23:59:59")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(auditService.getLogsByService(serviceName, from, to, pageable));
    }
}
