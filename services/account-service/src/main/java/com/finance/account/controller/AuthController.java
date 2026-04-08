package com.finance.account.controller;

import com.finance.account.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @RequestBody Map<String, String> request) {
        String accountNumber = request.get("account_number");
        String password = request.get("password");
        return ResponseEntity.ok(authService.login(accountNumber, password));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        // JWT is stateless — client clears token locally
        // In production: add token to blacklist in Redis
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
