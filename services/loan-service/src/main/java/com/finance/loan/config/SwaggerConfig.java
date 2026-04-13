package com.finance.loan.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Loan Service API",
        version = "1.0.0",
        description = "Quản lý vòng đời khoản vay: nộp đơn, thẩm định tín dụng, duyệt/từ chối, giải ngân, lịch trả nợ.",
        contact = @Contact(name = "Finance Team", email = "dev@finance.com")
    ),
    servers = {
        @Server(url = "http://localhost:8084", description = "Local Development"),
        @Server(url = "http://localhost:8080", description = "Via API Gateway")
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    in = SecuritySchemeIn.HEADER,
    description = "JWT token từ POST /api/v1/auth/login. Định dạng: Bearer {token}"
)
public class SwaggerConfig {}
