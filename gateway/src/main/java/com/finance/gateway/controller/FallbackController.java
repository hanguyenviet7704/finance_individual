package com.finance.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/account")
    @PostMapping("/account")
    public Mono<ResponseEntity<Map<String, String>>> accountFallback() {
        return fallbackResponse("account-service");
    }

    @GetMapping("/payment")
    @PostMapping("/payment")
    public Mono<ResponseEntity<Map<String, String>>> paymentFallback() {
        return fallbackResponse("payment-service");
    }

    @GetMapping("/loan")
    @PostMapping("/loan")
    public Mono<ResponseEntity<Map<String, String>>> loanFallback() {
        return fallbackResponse("loan-service");
    }

    @GetMapping("/fraud")
    @PostMapping("/fraud")
    public Mono<ResponseEntity<Map<String, String>>> fraudFallback() {
        return fallbackResponse("fraud-service");
    }

    @GetMapping("/report")
    @PostMapping("/report")
    public Mono<ResponseEntity<Map<String, String>>> reportFallback() {
        return fallbackResponse("report-service");
    }

    @GetMapping("/notification")
    @PostMapping("/notification")
    public Mono<ResponseEntity<Map<String, String>>> notificationFallback() {
        return fallbackResponse("notification-service");
    }

    @GetMapping("/audit")
    @PostMapping("/audit")
    public Mono<ResponseEntity<Map<String, String>>> auditFallback() {
        return fallbackResponse("audit-service");
    }

    @GetMapping("/auth")
    @PostMapping("/auth")
    public Mono<ResponseEntity<Map<String, String>>> authFallback() {
        return fallbackResponse("auth-service");
    }

    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, String>>> health() {
        return Mono.just(ResponseEntity.ok(Map.of("status", "ok")));
    }

    private Mono<ResponseEntity<Map<String, String>>> fallbackResponse(String serviceName) {
        return Mono.just(ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "status", "error",
                "message", serviceName + " is currently unavailable. Please try again later.",
                "code", "SERVICE_UNAVAILABLE"
            )));
    }
}
