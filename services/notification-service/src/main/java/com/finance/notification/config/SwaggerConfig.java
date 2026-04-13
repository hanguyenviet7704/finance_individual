package com.finance.notification.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(
    info = @Info(
        title = "Notification Service API",
        version = "1.0.0",
        description = "API quản lý thông báo: xem lịch sử thông báo SMS, Email, Push theo sự kiện Kafka (payment.completed, fraud.detected, account.created).",
        contact = @Contact(name = "Finance System", email = "admin@finance.com")
    ),
    servers = {
        @Server(url = "http://localhost:8085", description = "Local Development"),
        @Server(url = "http://localhost:8080/notification-service", description = "Via API Gateway")
    }
)
@Configuration
public class SwaggerConfig {
}
