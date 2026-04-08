# API Gateway

## Overview

Spring Cloud Gateway serving as the single entry point for all client requests. Handles JWT authentication, rate limiting, circuit breaking, and routes requests to downstream microservices via Eureka service discovery.

## Tech Stack

| Component       | Choice                              |
|-----------------|-------------------------------------|
| Framework       | Spring Cloud Gateway (reactive)     |
| Service Discovery | Spring Cloud Netflix Eureka Client|
| Auth            | JWT (JJWT 0.12.5)                  |
| Rate Limiting   | Redis-based (RequestRateLimiter)    |
| Circuit Breaker | Resilience4j                        |
| Java            | 21 (Eclipse Temurin)               |

## Responsibilities

- **JWT Authentication**: Validates Bearer tokens and injects `X-User-ID`, `X-Account-ID`, `X-User-Role`, `X-User-Email` headers for downstream services
- **Request Routing**: Routes requests to correct services via Eureka load balancing (`lb://service-name`)
- **Rate Limiting**: Redis-backed IP-based rate limiting (60 req/s for accounts, 30 req/s for payments)
- **Circuit Breaking**: Resilience4j circuit breakers with fallback endpoints
- **Request Logging**: Adds `X-Request-ID` to all requests and logs timing
- **CORS**: Global CORS configuration for frontend

## Routing Table

| External Path              | Target Service       | Auth Required |
|----------------------------|----------------------|---------------|
| `POST /api/v1/auth/**`     | account-service      | No            |
| `GET/POST /api/v1/accounts/**` | account-service  | Yes           |
| `GET/POST /api/v1/payments/**` | payment-service  | Yes           |
| `GET/POST /api/v1/loans/**`    | loan-service     | Yes           |
| `GET/POST /api/v1/fraud/**`    | fraud-service    | Yes           |
| `GET/POST /api/v1/reports/**`  | report-service   | Yes           |
| `GET/POST /api/v1/notifications/**` | notification-service | Yes  |
| `GET/POST /api/v1/audit/**`    | audit-service    | Yes           |

## Public Paths (no JWT required)

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`
- `GET /actuator/health`
- `GET /health`

## Fallback Endpoints

When a downstream service is unavailable, circuit breaker redirects to `/fallback/{service}` which returns a `503 SERVICE_UNAVAILABLE` response.

## Running

```bash
# From project root
docker compose up gateway --build
```

## Configuration

Key environment variables:

| Variable           | Default                    | Description                  |
|--------------------|----------------------------|------------------------------|
| `JWT_SECRET`       | finance-secret-key-...     | JWT signing secret (min 256 bits) |
| `REDIS_HOST`       | redis                      | Redis hostname               |
| `REDIS_PORT`       | 6379                       | Redis port                   |
| `EUREKA_USERNAME`  | admin                      | Eureka basic auth username   |
| `EUREKA_PASSWORD`  | admin123                   | Eureka basic auth password   |

## Notes

- Uses Docker Compose service names (not `localhost`) for upstream URLs
- Gateway port: 8080 (external) → 8080 (internal)
- Eureka URL: `http://eureka-server:8761/eureka/`
- Redis URL: `redis:6379`
- Does NOT use `spring-boot-starter-web` (reactive stack only)
