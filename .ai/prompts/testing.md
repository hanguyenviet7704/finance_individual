# Prompt: Generate Tests

Use this prompt to create comprehensive tests for a Spring Boot service or endpoint in the Finance project.

---

## Prompt

```
Generate tests for [SERVICE_NAME / CLASS_NAME, e.g. PaymentService.java] using JUnit 5, Mockito, and Spring Boot Test.

Test the following scenarios:
1. Controller Tests (`@WebMvcTest`):
   - GET /api/v1/[ENTITIES] returns a list and 200 OK.
   - GET /api/v1/[ENTITIES]/{id} returns a single item or 404.
   - POST /api/v1/[ENTITIES] creates with valid data, rejects invalid data (@Valid).
2. Service Tests (`@ExtendWith(MockitoExtension.class)`):
   - Happy path: Business logic works, Repository saves data, Kafka publishes event.
   - Exception path: Entity not found, or validation logic throws custom exceptions.
   - Mock all external dependencies (Repositories, KafkaTemplate, WebClient).
3. Integration Tests (Optional, `@SpringBootTest`):
   - Happy path integrating the Repository and Service.

Requirements:
- Given-When-Then test structure.
- Use `assertThrows` for testing exceptions.
- Provide clear, descriptive test method names.
- Aim for >80% code coverage.

Place test files in: `services/[SERVICE_NAME]/src/test/java/com/finance/[service]/`
```

---

## Example Framework Choices

For the Finance Microservices Platform:
- **Unit Testing**: JUnit 5 + AssertJ
- **Mocking**: Mockito
- **API Testing**: MockMvc (Spring Test)
- **Integration Testing**: Testcontainers (for MySQL, Redis, Kafka)
- **Frontend Testing**: Vitest + React Testing Library (for the React App)
```
