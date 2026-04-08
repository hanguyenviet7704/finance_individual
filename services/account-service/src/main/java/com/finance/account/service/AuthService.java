package com.finance.account.service;

import com.finance.account.domain.Account;
import com.finance.account.exception.AccountException;
import com.finance.account.repository.AccountRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:900000}")   // 15 minutes
    private long jwtExpirationMs;

    public Map<String, String> login(String accountNumber, String rawPassword) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new AccountException(
                "Invalid credentials", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));

        if (!passwordEncoder.matches(rawPassword, account.getPasswordHash())) {
            throw new AccountException("Invalid credentials", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }

        String accessToken = generateToken(account);
        String refreshToken = UUID.randomUUID().toString();

        log.info("User logged in: account={}", accountNumber);
        return Map.of(
            "access_token", accessToken,
            "refresh_token", refreshToken,
            "token_type", "Bearer",
            "expires_in", String.valueOf(jwtExpirationMs / 1000)
        );
    }

    private String generateToken(Account account) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
            .subject(account.getId().toString())
            .claim("userId", account.getUserId().toString())
            .claim("email", account.getEmail())
            .claim("roles", account.getRole().toLowerCase())
            .claim("account_number", account.getAccountNumber())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(key)
            .compact();
    }
}
