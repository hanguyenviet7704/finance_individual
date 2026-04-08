# Account Service

## Overview

Account Service manages user accounts, KYC (Know Your Customer) documents, JWT-based authentication, and all account-level operations (freeze, unfreeze, balance, limits) for the Finance platform.

## Tech Stack

| Component       | Choice                              |
|-----------------|-------------------------------------|
| Framework       | Spring Boot 3.2 + Spring Data JPA   |
| Database        | MySQL 8.0 (via Flyway migrations)   |
| Cache           | Redis (token operations)            |
| Messaging       | Apache Kafka (account events)       |
| Security        | Spring Security + BCrypt            |
| Auth            | JWT (JJWT 0.12.5)                  |
| Service Discovery | Eureka Client                     |
| Java            | 21 (Eclipse Temurin)               |

## Endpoints

| Method | Path                          | Auth | Description                      |
|--------|-------------------------------|------|----------------------------------|
| POST   | `/api/v1/auth/login`          | No   | Login, returns JWT               |
| POST   | `/api/v1/auth/logout`         | Yes  | Logout (client discards token)   |
| GET    | `/api/v1/accounts`            | Yes  | List all accounts (paginated)    |
| POST   | `/api/v1/accounts`            | Yes  | Create account for current user  |
| GET    | `/api/v1/accounts/{id}`       | Yes  | Get account by ID                |
| GET    | `/api/v1/accounts/me`         | Yes  | Get current user's account       |
| GET    | `/api/v1/accounts/{id}/balance` | Yes | Get account balance            |
| PUT    | `/api/v1/accounts/{id}/limits`  | Yes | Update daily transaction limit  |
| POST   | `/api/v1/accounts/{id}/freeze`  | Yes | Freeze account                  |
| POST   | `/api/v1/accounts/{id}/unfreeze`| Yes | Unfreeze account               |
| DELETE | `/api/v1/accounts/{id}`       | Yes  | Close account                    |
| GET    | `/health`                     | No   | Health check → `{"status":"ok"}` |

Full OpenAPI spec: [`docs/api-specs/account-service.yaml`](../../docs/api-specs/account-service.yaml)

## Configuration

Key environment variables:

| Variable               | Default                      | Description                     |
|------------------------|------------------------------|---------------------------------|
| `MYSQL_HOST`           | mysql-account                | MySQL hostname                  |
| `MYSQL_ACCOUNT_DB`     | account_db                   | Database name                   |
| `MYSQL_ROOT_PASSWORD`  | root                         | MySQL root password             |
| `REDIS_HOST`           | redis                        | Redis hostname                  |
| `KAFKA_BOOTSTRAP_SERVERS` | kafka:9092              | Kafka brokers                   |
| `EUREKA_USERNAME`      | admin                        | Eureka auth username            |
| `EUREKA_PASSWORD`      | admin123                     | Eureka auth password            |
| `JWT_SECRET`           | finance-secret-key-...       | JWT secret (min 256 bits)       |
| `JWT_EXPIRATION`       | 900000                       | Token expiry (ms), default 15min|

## Database Migrations (Flyway)

| Migration | Description                      |
|-----------|----------------------------------|
| V1        | Create accounts, kyc_documents tables |
| V2        | Add role column to accounts      |
| V3        | Add password_hash column         |

## Kafka Events Published

| Topic            | Event                | Trigger                  |
|------------------|----------------------|--------------------------|
| `account.created`| `AccountCreatedEvent`| New account registered   |
| `account.frozen` | (inline event)       | Account frozen           |

## Running

```bash
# From project root
docker compose up account-service --build
```

## Verify

```bash
# Health check
curl http://localhost:8081/health
# → {"status":"ok"}

# Login (demo account)
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account_number":"FIN0000000000001","password":"password123"}'
```

## Security Notes

- JWT is issued by this service and validated by the API Gateway
- The gateway injects `X-User-ID` into downstream requests — this service trusts that header
- Passwords are hashed with BCrypt (strength 12)
- Service port: 8081
