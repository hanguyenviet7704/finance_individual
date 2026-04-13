package com.finance.payment.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@FeignClient(name = "account-service", fallback = AccountClientFallback.class)
public interface AccountClient {

    @GetMapping("/api/v1/accounts/{id}/balance")
    Map<String, BigDecimal> getBalance(@PathVariable UUID id);

    @PostMapping("/api/v1/accounts/{id}/freeze")
    Map<String, Object> freezeAccount(@PathVariable UUID id,
                                      @RequestParam String reason);
}
