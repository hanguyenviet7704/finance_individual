package com.finance.stock.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/stocks")
public class StockController {

    // Lấy bảng giá thị trường
    @GetMapping
    public ResponseEntity<?> getMarketData() {
        return ResponseEntity.ok(Map.of(
            "content", List.of(
                Map.of("tickerSymbol", "VCB", "companyName", "Vietcombank", "currentPrice", 95500.00, "status", "ACTIVE"),
                Map.of("tickerSymbol", "HPG", "companyName", "Hoa Phat Group", "currentPrice", 28000.00, "status", "ACTIVE")
            ),
            "totalElements", 2,
            "totalPages", 1
        ));
    }

    // Đặt lệnh (Mua/Bán)
    @PostMapping("/orders")
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> orderRequest) {
        return ResponseEntity.status(201).body(Map.of(
            "orderId", "mock_order_uuid",
            "tickerSymbol", orderRequest.get("tickerSymbol"),
            "orderType", orderRequest.get("orderType"),
            "status", "PENDING",
            "message", "Order placed and is pending processing."
        ));
    }

    // Xem danh mục tài sản (Portfolio)
    @GetMapping("/portfolios/me")
    public ResponseEntity<?> getMyPortfolio() {
        return ResponseEntity.ok(List.of(
                Map.of("tickerSymbol", "HPG", "quantity", 1000, "averageBuyPrice", 27000.00)
        ));
    }
}
