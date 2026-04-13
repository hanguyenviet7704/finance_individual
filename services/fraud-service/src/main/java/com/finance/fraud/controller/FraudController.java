package com.finance.fraud.controller;

import com.finance.fraud.domain.FraudHistory;
import com.finance.fraud.repository.FraudHistoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/fraud")
@RequiredArgsConstructor
@Tag(name = "Fraud Detection", description = "API tra cứu lịch sử phát hiện gian lận. Chỉ đọc — dữ liệu được ghi qua Kafka events từ Payment Service.")
@SecurityRequirement(name = "bearerAuth")
public class FraudController {

    private final FraudHistoryRepository fraudHistoryRepository;

    @Operation(summary = "Tất cả lịch sử gian lận", description = "Lấy toàn bộ lịch sử phân tích rủi ro, sắp xếp theo thời gian mới nhất. Yêu cầu quyền ADMIN.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping("/history")
    public ResponseEntity<Page<FraudHistory>> getHistory(
            @Parameter(description = "Số trang (bắt đầu từ 0)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số bản ghi mỗi trang", example = "20") @RequestParam(defaultValue = "20") int size) {
        Page<FraudHistory> result = fraudHistoryRepository.findAll(
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Lịch sử gian lận theo user", description = "Lấy lịch sử phân tích rủi ro của một người dùng cụ thể. Sắp xếp theo thời gian mới nhất.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy user", content = @Content)
    })
    @GetMapping("/history/user/{userId}")
    public ResponseEntity<Page<FraudHistory>> getByUser(
            @Parameter(description = "UUID của người dùng") @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<FraudHistory> result = fraudHistoryRepository.findByUserId(
            userId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Kết quả phân tích theo giao dịch", description = "Lấy kết quả phân tích rủi ro của một giao dịch cụ thể: điểm rủi ro, các rule đã kích hoạt, quyết định ALLOW/REVIEW/BLOCK.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy phân tích cho giao dịch này", content = @Content)
    })
    @GetMapping("/history/{transactionId}")
    public ResponseEntity<FraudHistory> getByTransaction(
            @Parameter(description = "UUID của giao dịch") @PathVariable UUID transactionId) {
        return fraudHistoryRepository.findByTransactionId(transactionId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
