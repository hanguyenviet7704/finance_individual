package com.finance.account.service;

import com.finance.account.domain.Account;
import com.finance.account.dto.AccountResponse;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.account.dto.UpdateLimitRequest;
import com.finance.account.event.AccountCreatedEvent;
import com.finance.account.exception.AccountException;
import com.finance.account.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public AccountResponse createAccount(UUID userId, CreateAccountRequest request) {
        if (accountRepository.existsByUserId(userId)) {
            throw AccountException.alreadyExists(userId.toString());
        }

        Account account = Account.builder()
            .userId(userId)
            .accountNumber(generateAccountNumber())
            .accountType(request.getAccountType())
            .fullName(request.getFullName())
            .email(request.getEmail())
            .phone(request.getPhone())
            .currency(request.getCurrency())
            .status(Account.AccountStatus.ACTIVE)
            .kycStatus(Account.KycStatus.PENDING)
            .build();

        account = accountRepository.save(account);

        // Publish event to Kafka
        AccountCreatedEvent event = AccountCreatedEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .timestamp(LocalDateTime.now())
            .traceId(UUID.randomUUID().toString())
            .payload(AccountCreatedEvent.Payload.builder()
                .accountId(account.getId())
                .userId(account.getUserId())
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType().name())
                .fullName(account.getFullName())
                .email(account.getEmail())
                .phone(account.getPhone())
                .build())
            .build();

        kafkaTemplate.send("account.created", account.getId().toString(), event);
        log.info("Account created: {} for user: {}", account.getAccountNumber(), userId);

        return toResponse(account);
    }

    @Transactional(readOnly = true)
    public Page<AccountResponse> getAllAccounts(Pageable pageable) {
        return accountRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccount(UUID accountId) {
        return accountRepository.findById(accountId)
            .map(this::toResponse)
            .orElseThrow(() -> AccountException.notFound(accountId.toString()));
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccountByUserId(UUID userId) {
        return accountRepository.findByUserId(userId)
            .map(this::toResponse)
            .orElseThrow(() -> AccountException.notFound("userId=" + userId));
    }

    @Transactional(readOnly = true)
    public BigDecimal getBalance(UUID accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> AccountException.notFound(accountId.toString()));
        return account.getAvailableBalance();
    }

    @Transactional
    public AccountResponse updateLimits(UUID accountId, UpdateLimitRequest request) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> AccountException.notFound(accountId.toString()));
        account.setDailyLimit(request.getDailyLimit());
        return toResponse(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse freezeAccount(UUID accountId, String reason) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> AccountException.notFound(accountId.toString()));

        if (account.getStatus() == Account.AccountStatus.CLOSED) {
            throw new IllegalStateException("Cannot freeze a closed account");
        }

        account.setStatus(Account.AccountStatus.FROZEN);
        account = accountRepository.save(account);
        log.info("Account frozen: {} reason: {}", accountId, reason);

        kafkaTemplate.send("account.frozen", accountId.toString(),
            new Object() {
                public final String eventType = "account.frozen";
                public final UUID id = accountId;
                public final String r = reason;
            });

        return toResponse(account);
    }

    @Transactional
    public AccountResponse unfreezeAccount(UUID accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> AccountException.notFound(accountId.toString()));

        if (account.getStatus() != Account.AccountStatus.FROZEN) {
            throw new IllegalStateException("Account is not frozen");
        }

        account.setStatus(Account.AccountStatus.ACTIVE);
        return toResponse(accountRepository.save(account));
    }

    @Transactional
    public void closeAccount(UUID accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> AccountException.notFound(accountId.toString()));

        if (account.getBalance().compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException("Cannot close account with remaining balance");
        }

        account.setStatus(Account.AccountStatus.CLOSED);
        accountRepository.save(account);
    }

    private String generateAccountNumber() {
        String prefix = "FIN";
        String digits = String.format("%013d", (long)(Math.random() * 1_000_000_000_0000L));
        String candidate = prefix + digits;
        // Retry if duplicate
        while (accountRepository.existsByAccountNumber(candidate)) {
            digits = String.format("%013d", (long)(Math.random() * 1_000_000_000_0000L));
            candidate = prefix + digits;
        }
        return candidate;
    }

    private AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
            .id(account.getId())
            .userId(account.getUserId())
            .accountNumber(account.getAccountNumber())
            .accountType(account.getAccountType())
            .balance(account.getBalance())
            .availableBalance(account.getAvailableBalance())
            .currency(account.getCurrency())
            .status(account.getStatus())
            .dailyLimit(account.getDailyLimit())
            .dailyUsed(account.getDailyUsed())
            .kycStatus(account.getKycStatus())
            .fullName(account.getFullName())
            .email(account.getEmail())
            .phone(account.getPhone())
            .createdAt(account.getCreatedAt())
            .updatedAt(account.getUpdatedAt())
            .build();
    }
}
