FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build
COPY pom.xml ./pom.xml
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S finance && adduser -S finance -G finance
WORKDIR /app
COPY --from=builder /build/target/eureka-server-1.0.0.jar app.jar
USER finance
EXPOSE 8761
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:+UseG1GC", "-jar", "app.jar"]
