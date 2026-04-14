# Prompt: Generate a Dockerfile

Use this prompt to create an optimized Dockerfile for a new Java Spring Boot service or React frontend within the Finance project.

---

## Prompt

```
Generate a production-ready Dockerfile for a [Java Spring Boot 3 / React Vite] application.

Service location: [SERVICE_PATH, e.g., services/notification-service]
Service name: [SERVICE_NAME]
Port: [PORT, e.g., 8085]

Requirements for Java services:
1. Multi-stage build using Maven and JRE
2. Builder stage: `maven:3.9-eclipse-temurin-21-alpine`
3. Runtime stage: `eclipse-temurin:21-jre-alpine`
4. Use Maven Dependency Go Offline step for caching dependencies!
5. Add a non-root user (`finance`) and run the JAR as this user.
6. Set WORKDIR to `/app`.
7. Expose the correct application port.
8. Set up a HEALTHCHECK using the Spring Boot Actuator endpoint (`/actuator/health`).

Requirements for React Frontend:
1. Multi-stage build using Node and Nginx
2. Builder stage: `node:20-alpine` (npm run build)
3. Runtime stage: `nginx:1.25-alpine`
4. Copy `dist/` to Nginx HTML folder.

Optimize for:
- Small image size (Alpine)
- Fast build times (Maven dependency caching layers)
- Security (non-root)
```

---

## Example

```
Generate a production-ready Dockerfile for a Java/Spring Boot 3 application.

Service location: services/audit-service/
Service Name: audit-service
Port: 8087
```
