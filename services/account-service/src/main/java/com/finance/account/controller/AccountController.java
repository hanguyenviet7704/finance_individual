package com.finance.account.controller;

import com.finance.account.dto.AccountResponse;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.account.dto.UpdateLimitRequest;
import com.finance.account.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<Page<AccountResponse>> getAllAccounts(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(accountService.getAllAccounts(pageable));
    }

    // Header X-User-ID is injected by API Gateway after JWT verification
    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @RequestHeader("X-User-ID") UUID userId,
            @Valid @RequestBody CreateAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(accountService.createAccount(userId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccount(@PathVariable UUID id) {
        return ResponseEntity.ok(accountService.getAccount(id));
    }

    @GetMapping("/me")
    public ResponseEntity<AccountResponse> getMyAccount(
            @RequestHeader("X-User-ID") UUID userId) {
        return ResponseEntity.ok(accountService.getAccountByUserId(userId));
    }

    @GetMapping("/{id}/balance")
    public ResponseEntity<Map<String, BigDecimal>> getBalance(@PathVariable UUID id) {
        BigDecimal balance = accountService.getBalance(id);
        return ResponseEntity.ok(Map.of("balance", balance));
    }

    @PutMapping("/{id}/limits")
    public ResponseEntity<AccountResponse> updateLimits(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLimitRequest request) {
        return ResponseEntity.ok(accountService.updateLimits(id, request));
    }

    @PostMapping("/{id}/freeze")
    public ResponseEntity<AccountResponse> freezeAccount(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "Manual freeze") String reason) {
        return ResponseEntity.ok(accountService.freezeAccount(id, reason));
    }

    @PostMapping("/{id}/unfreeze")
    public ResponseEntity<AccountResponse> unfreezeAccount(@PathVariable UUID id) {
        return ResponseEntity.ok(accountService.unfreezeAccount(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> closeAccount(@PathVariable UUID id) {
        accountService.closeAccount(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
