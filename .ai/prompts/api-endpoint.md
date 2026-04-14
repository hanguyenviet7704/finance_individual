# Prompt: Add a New API Endpoint

Use this prompt to have an AI tool add a new REST API endpoint to an existing Spring Boot service in the Finance platform.

---

## Prompt

```
Add a new API endpoint to the [SERVICE_NAME, e.g., payment-service]:

Method: [HTTP_METHOD]
Path: [ENDPOINT_PATH, e.g. /api/v1/payments/...]
Description: [DESCRIPTION]

Request body (if applicable) - Create a DTO for this:
[REQUEST_SCHEMA]

Response:
- Success: [STATUS_CODE] with [RESPONSE_SCHEMA, wrapped in ApiResponse class if used]
- Error: [ERROR_STATUS_CODE] handled by GlobalExceptionHandler

Requirements:
1. Implement the Controller method in `src/main/java/com/finance/[service]/controller/`
2. Add Business Logic in the Service interface and implementation in `service/`
3. Add input validation using `jakarta.validation.constraints.*` in DTOs.
4. If applicable, publish a Kafka Event for this action.
5. If there is database interaction, update the JPA Repository / MongoDB Repository.
6. Handle edge cases: [EDGE_CASES]
7. Provide the full Java code for the Controller, Service, and DTOs.

The endpoint should follow existing patterns (Spring Boot 3, RESTful principles).
```

---

## Example

```
Add a new API endpoint to payment-service:

Method: POST
Path: /api/v1/payments/transfer
Description: Internal fund transfer between two accounts

Request body:
{
  "from_account": "string",
  "to_account": "string",
  "amount": "BigDecimal (min 1000)"
}

Response:
- Success: 200 OK with { "transaction_id": "uuid", "status": "COMPLETED", "timestamp": "ISO" }
- Error: 400 Bad Request with Validation Errors, or 400 for Insufficient Funds.
```
