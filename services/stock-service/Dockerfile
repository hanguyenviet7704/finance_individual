# Build Stage
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
# Download dependencies in offline mode for caching
RUN mvn dependency:go-offline
COPY src ./src
# Build application jar
RUN mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add a non-root group and user
RUN addgroup -S finance && adduser -S finance -G finance
USER finance

# Copy the built JAR from builder
COPY --from=builder /app/target/stock-service-1.0.0.jar app.jar

# Application port
EXPOSE 8088

# Healthcheck config via actutator
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:8088/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
