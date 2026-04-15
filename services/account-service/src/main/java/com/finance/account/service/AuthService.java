package com.finance.account.service;

import com.finance.account.domain.Account;
import com.finance.account.dto.RegisterRequest;
import com.finance.account.exception.AccountException;
import com.finance.account.repository.AccountRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:900000}")   // 15 minutes
    private long jwtExpirationMs;

    @Transactional
    public Map<String, String> register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AccountException("Mật khẩu xác nhận không khớp",
                HttpStatus.BAD_REQUEST, "PASSWORD_MISMATCH");
        }

        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new AccountException("Email đã được sử dụng",
                HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS");
        }

        if (accountRepository.existsByPhone(request.getPhone())) {
            throw new AccountException("Số điện thoại đã được sử dụng",
                HttpStatus.CONFLICT, "PHONE_ALREADY_EXISTS");
        }

        String accountNumber = generateAccountNumber();
        String passwordHash = passwordEncoder.encode(request.getPassword());
        UUID userId = UUID.randomUUID();

        Account account = Account.builder()
            .userId(userId)
            .accountNumber(accountNumber)
            .accountType(request.getAccountType())
            .fullName(request.getFullName())
            .email(request.getEmail())
            .phone(request.getPhone())
            .currency("VND")
            .status(Account.AccountStatus.ACTIVE)
            .kycStatus(Account.KycStatus.PENDING)
            .role("CUSTOMER")
            .passwordHash(passwordHash)
            .build();

        account = accountRepository.save(account);
        log.info("New account registered: {} email={}", account.getAccountNumber(), request.getEmail());

        try {
            kafkaTemplate.send("account.created", account.getId().toString(),
                Map.of(
                    "eventType", "account.created",
                    "accountId", account.getId().toString(),
                    "userId", userId.toString(),
                    "accountNumber", accountNumber,
                    "fullName", request.getFullName(),
                    "email", request.getEmail()
                ));
        } catch (Exception e) {
            log.warn("Failed to publish account.created event (non-critical): {}", e.getMessage());
        }

        String accessToken = generateToken(account);
        String refreshToken = UUID.randomUUID().toString();

        return Map.of(
            "access_token", accessToken,
            "refresh_token", refreshToken,
            "token_type", "Bearer",
            "expires_in", String.valueOf(jwtExpirationMs / 1000),
            "account_number", accountNumber
        );
    }

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

    private String generateAccountNumber() {
        String prefix = "FIN";
        String digits = String.format("%013d", (long) (Math.random() * 1_000_000_000_0000L));
        String candidate = prefix + digits;
        while (accountRepository.existsByAccountNumber(candidate)) {
            digits = String.format("%013d", (long) (Math.random() * 1_000_000_000_0000L));
            candidate = prefix + digits;
        }
        return candidate;
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
