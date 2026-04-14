# Prompt: Debug an Issue

Use this prompt when you encounter a bug or error in the Finance Microservices Platform.

---

## Prompt

```
I'm encountering an issue in the Finance Microservices project:

**Service**: [account-service / payment-service / frontend / etc.]
**Error message**: [ERROR_MESSAGE_FROM_LOGS]
**When it happens**: [TRIGGER_DESCRIPTION, e.g., "When logging in via gateway"]
**Expected behavior**: [EXPECTED]
**Actual behavior**: [ACTUAL]

Environment:
- Language/Framework: [e.g., Java 21 / Spring Boot 3 OR React / TypeScript]
- Running via: docker compose up -d --build
- OS: [OS]

Relevant logs (from Spring Boot or Vite):
```text
[PASTE LOGS HERE]
```

Please:
1. Analyze the error trace and identify the root cause (check if it's a Kafka serialization issue, Eureka discovery issue, or Spring JPA error).
2. Suggest a fix with exact code changes.
3. Explain why this happened to help me learn.
4. Suggest how to prevent similar issues.
```

---

## Common Debug Commands for Finance Project

```bash
# View logs for a specific Spring Boot service (e.g. payment-service)
docker compose logs payment-service

# Follow logs in real-time
docker compose logs -f payment-service

# Check running containers (eureka-server, api-gateway, etc)
docker compose ps

# Check Eureka server health & registered services
curl http://localhost:8761/actuator/health

# Access API gateway routes
curl -X GET http://localhost:8080/api/v1/accounts/health

# Enter a running container
docker compose exec payment-service sh

# Rebuild a specific service after changing Java code
docker compose up -d --build payment-service
```
