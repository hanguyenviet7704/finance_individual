package com.finance.payment.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class AccountClientFallback implements AccountClient {

    @Override
    public Map<String, BigDecimal> getBalance(UUID id) {
        log.warn("AccountClient fallback: getBalance for {}", id);
        return Map.of("balance", BigDecimal.ZERO);
    }

    @Override
    public Map<String, Object> freezeAccount(UUID id, String reason) {
        log.warn("AccountClient fallback: freezeAccount for {}", id);
        return Map.of("status", "fallback");
    }
}
