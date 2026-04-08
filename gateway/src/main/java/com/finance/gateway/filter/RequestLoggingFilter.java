package com.finance.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Slf4j
@Component
public class RequestLoggingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String requestId = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();

        // Add X-Request-ID to request
        exchange = exchange.mutate()
            .request(exchange.getRequest().mutate()
                .header("X-Request-ID", requestId)
                .build())
            .build();

        log.info("[{}] --> {} {}", requestId,
            exchange.getRequest().getMethod(),
            exchange.getRequest().getURI().getPath());

        ServerWebExchange finalExchange = exchange;
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            long duration = System.currentTimeMillis() - startTime;
            log.info("[{}] <-- {} {}ms", requestId,
                finalExchange.getResponse().getStatusCode(), duration);
        }));
    }

    @Override
    public int getOrder() {
        return -2; // Run before JwtAuthenticationFilter
    }
}
