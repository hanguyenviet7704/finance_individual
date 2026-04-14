# Prompt: Scaffold a New Microservice

Use this prompt to have an AI tool generate a complete microservice scaffold tailored to the Finance project.

---

## Prompt

```
Create a new microservice called [SERVICE_NAME, e.g., limit-service] using Java 21 and Spring Boot 3.

Location: services/[SERVICE_NAME]/

Requirements:
1. Standard Spring Boot project structure (`src/main/java/com/finance/[service]/...`)
2. Dockerfile using the project's standard multi-stage build (maven -> jre-alpine).
3. `pom.xml` including dependencies:
   - Spring Web, Spring Boot Actuator, Spring Data JPA/MongoDB, Lombok
   - Spring Cloud Netflix Eureka Client
   - Spring Kafka (if event-driven)
4. Application Configuration (`application.yml`):
   - Port: [PORT]
   - Application Name: [SERVICE_NAME]
   - Eureka Client URL: `http://eureka-server:8761/eureka/`
   - Database connection using environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
5. Basic CRUD endpoints for [ENTITY_NAME]:
   - GET /api/v1/[ENTITY_PLURAL] — list all
   - GET /api/v1/[ENTITY_PLURAL]/{id} — get by ID
   - POST /api/v1/[ENTITY_PLURAL] — create
   - PUT /api/v1/[ENTITY_PLURAL]/{id} — update
   - DELETE /api/v1/[ENTITY_PLURAL]/{id} — delete
6. Global Exception Handler and DTO validation.
7. Swagger / OpenAPI dependencies setup.
8. Update root `docker-compose.yml` to include this service and its database.
9. Service `readme.md` with setup instructions.
```

---

## Example Usage

Replace placeholders:
- `[SERVICE_NAME]` → `limit-service`
- `[PORT]` → `8088`
- `[ENTITY_NAME]` → `TransactionLimit`
- `[ENTITY_PLURAL]` → `limits`
```
