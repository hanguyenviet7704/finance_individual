# Testing Strategy — Finance Platform

This document defines the conventions, tools, and guidelines for writing tests across the entire Finance Microservices project. The goal of testing is to maintain application stability, automatically detect regressions, and achieve a minimum code coverage of > 80%.

---

## 1. Tech Stack & Tools

### Backend (Spring Boot / Java 21)
- **Test Framework**: `JUnit 5` (Jupiter).
- **Mocking**: `Mockito` (Mocking external dependencies like Repositories, Kafka, Redis).
- **API Testing**: `MockMvc` (Testing HTTP Controllers and Endpoints).
- **Integration Testing**: `Testcontainers` (Spinning up real MySQL, Redis, Kafka using Docker during tests).
- **Assertions**: `AssertJ` (Writing fluent and readable assertions).

### Frontend (React / Vite)
- **Test Runner**: `Vitest` (Fast and natively compatible with Vite configuration).
- **Component Testing**: `React Testing Library` (Focusing on actual user behavior and UI/UX testing).

---

## 2. Test Types

The system requires implementing 3 main levels of testing:

### Level 1: Unit Testing
- **Focus**: The smallest unit of business logic within the `Service Layer` and `Controller Layer`.
- **Requirements**:
  - **DO NOT** connect to a real Database or call External APIs.
  - Use `@ExtendWith(MockitoExtension.class)` or `@WebMvcTest`.
  - All external `@Autowired` Beans (like `UserRepository`, `KafkaTemplate`) must be mocked via `@Mock` or `@MockBean`.
- **Performance Expectation**: Extremely fast (< 1 second per class).

### Level 2: Integration Testing
- **Focus**: Ensure the Spring Boot context loads successfully, testing the complete flow from the Controller through the Service to the Repository or Cache, using actual Data persistence mechanisms.
- **Requirements**:
  - Use `@SpringBootTest`.
  - Connect to an in-memory database (like H2), or preferably use `Testcontainers` to create an isolated MySQL instance for testing.
  - Crucial for testing complex Custom Queries (JPA/QueryDSL).

### Level 3: End-to-End Testing / API Testing
- Usually handled by QA/Automation engineers using *Postman* or *Cypress/Playwright*.
- Runs against the fully deployed system (using Docker Compose) tracking end-to-end user workflows.

---

## 3. Convention & Architecture

All test files within the project must follow the **B.D.D (Behavior-Driven Development)** structure:
`Given` - `When` - `Then` (or `Arrange` - `Act` - `Assert`).

**Example:**
```java
@Test
@DisplayName("Should successfully transfer money when balance is sufficient")
void testTransferMoney_Success() {
    // 1. GIVEN (Initialize Mock Data & Conditions)
    Account sender = new Account(1000L);
    Account receiver = new Account(0L);
    when(accountRepository.findById("A")).thenReturn(Optional.of(sender));

    // 2. WHEN (Execute the logic under test)
    paymentService.transfer("A", "B", 200L);

    // 3. THEN (Verify Output & State)
    assertEquals(800L, sender.getBalance());
    verify(kafkaTemplate, times(1)).send(anyString(), any());
}
```

---

## 4. Specialized Testing (Kafka, Redis, Security)

**1. Testing API Security (`@WithMockUser`)**  
With `WebMvcTest`, all requests pass through default Spring Security filters. Use `@WithMockUser(roles = "ADMIN")` directly above the `@Test` method to bypass JWT Validation for testing Role-Based Access Control (RBAC) endpoints.

**2. Testing Kafka Events**  
In Unit Tests, verify if an Event was dispatched using Mockito:
`verify(kafkaTemplate).send("TOPIC_NAME", expectedMessage);`

**3. Test Repository & Caching**
Use the `@DataJpaTest` annotation to independently test Database queries. The system will auto-configure an in-memory database and automatically roll back transactions after every `@Test` method execution.

---

## 5. Directory Structure
Test source code sits in the `src/test/java/com/finance/[module]/` folder, mirroring the `src/main/java` structure.
Example:
```
stock-service/src/test/java/com/finance/stock/
├── controller/
│   └── StockControllerTest.java    # WebMvcTest
├── service/
│   └── StockServiceTest.java       # Unit tests using Mockito
└── repository/
    └── StockRepositoryTest.java    # DataJpaTest for queries
```
