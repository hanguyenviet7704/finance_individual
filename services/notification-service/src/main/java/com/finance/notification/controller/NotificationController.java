package com.finance.notification.controller;

import com.finance.notification.domain.NotificationLog;
import com.finance.notification.repository.NotificationLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(
    name = "Notification Management",
    description = "API xem lịch sử thông báo. Service này hoạt động event-driven qua Kafka — các thông báo được gửi tự động khi có sự kiện payment.completed, fraud.detected, account.created."
)
public class NotificationController {

    private final NotificationLogRepository notificationLogRepository;

    @Operation(
        summary = "Lịch sử thông báo của user",
        description = "Lấy tất cả thông báo đã gửi cho một user cụ thể (email, SMS, push). Phân trang theo thời gian gửi gần nhất."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công",
            content = @Content(schema = @Schema(implementation = Page.class))),
        @ApiResponse(responseCode = "400", description = "userId không hợp lệ", content = @Content)
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<NotificationLog>> getByUser(
            @Parameter(description = "ID của người dùng") @PathVariable String userId,
            @PageableDefault(size = 20, sort = "sentAt") Pageable pageable) {
        return ResponseEntity.ok(notificationLogRepository.findByUserId(userId, pageable));
    }

    @Operation(
        summary = "Lịch sử thông báo theo giao dịch",
        description = "Lấy tất cả thông báo liên quan đến một giao dịch cụ thể (có thể có nhiều: SMS + Push + Email)."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy giao dịch", content = @Content)
    })
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<List<NotificationLog>> getByTransaction(
            @Parameter(description = "ID của giao dịch") @PathVariable String transactionId) {
        return ResponseEntity.ok(notificationLogRepository.findByTransactionId(transactionId));
    }

    @Operation(
        summary = "Thống kê thông báo theo trạng thái",
        description = "Lấy danh sách thông báo theo trạng thái (PENDING, SENT, FAILED, RETRY). Dùng để monitor tỉ lệ gửi thành công."
    )
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<NotificationLog>> getByStatus(
            @Parameter(description = "Trạng thái: PENDING | SENT | FAILED | RETRY")
            @PathVariable NotificationLog.NotificationStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(notificationLogRepository.findByStatus(status, pageable));
    }

    @Operation(
        summary = "Thông báo theo kênh sự kiện",
        description = "Lấy danh sách thông báo theo kênh Kafka: payment.completed | fraud.detected | account.created | notification.otp.required"
    )
    @GetMapping("/channel/{channel}")
    public ResponseEntity<Page<NotificationLog>> getByChannel(
            @Parameter(description = "Tên kênh Kafka event") @PathVariable String channel,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(notificationLogRepository.findByChannel(channel, pageable));
    }

    @Operation(
        summary = "Xem chi tiết thông báo",
        description = "Lấy nội dung đầy đủ của một thông báo cụ thể theo ID MongoDB."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<NotificationLog> getById(
            @Parameter(description = "MongoDB ID của thông báo") @PathVariable String id) {
        return notificationLogRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @Operation(
        summary = "Thông báo thất bại cần retry",
        description = "Lấy danh sách thông báo có trạng thái FAILED hoặc RETRY để xử lý lại thủ công. Giới hạn số lần retry = 3."
    )
    @GetMapping("/failed")
    public ResponseEntity<List<NotificationLog>> getFailedNotifications() {
        return ResponseEntity.ok(notificationLogRepository.findByStatusIn(
            List.of(NotificationLog.NotificationStatus.FAILED, NotificationLog.NotificationStatus.RETRY)
        ));
    }
}
