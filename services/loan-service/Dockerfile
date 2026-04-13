FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build
COPY pom.xml ./pom.xml
COPY services/eureka-server/pom.xml services/eureka-server/pom.xml
COPY gateway/pom.xml gateway/pom.xml
COPY services/account-service/pom.xml services/account-service/pom.xml
COPY services/payment-service/pom.xml services/payment-service/pom.xml
COPY services/fraud-service/pom.xml services/fraud-service/pom.xml
COPY services/loan-service/pom.xml services/loan-service/pom.xml
COPY services/notification-service/pom.xml services/notification-service/pom.xml
COPY services/report-service/pom.xml services/report-service/pom.xml
COPY services/audit-service/pom.xml services/audit-service/pom.xml
RUN mvn -pl services/loan-service dependency:go-offline -q
COPY services/loan-service/src services/loan-service/src
RUN mvn -pl services/loan-service package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S finance && adduser -S finance -G finance
WORKDIR /app
COPY --from=builder /build/services/loan-service/target/loan-service-1.0.0.jar app.jar
USER finance
EXPOSE 8084
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
