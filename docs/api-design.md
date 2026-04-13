# API Design — Finance Microservices Platform

Tài liệu tổng hợp toàn bộ API của hệ thống Finance. Tất cả request đều đi qua **API Gateway** tại `http://localhost:8080`.

---

## Quy ước chung

### Authentication

Tất cả endpoint (trừ `/api/v1/auth/**` và `/health`) yêu cầu header:

```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

JWT được phát hành bởi Account Service, có hiệu lực **15 phút**. Sau khi hết hạn, dùng refresh token để lấy JWT mới.

### Headers Gateway inject

API Gateway tự động inject các header sau vào mọi request đã xác thực:

| Header | Giá trị | Mô tả |
|--------|---------|-------|
| `X-User-ID` | UUID | ID người dùng từ JWT claims |
| `X-Account-ID` | UUID | ID tài khoản chính |
| `X-User-Role` | USER / ADMIN / OFFICER | Phân quyền |
| `X-User-Email` | Email | Email người dùng |
| `X-Request-ID` | UUID | Request tracing ID |

### Format phản hồi lỗi

```json
{
  "code": "ERROR_CODE",
  "message": "Mô tả lỗi thân thiện người dùng",
  "details": {},
  "timestamp": "2026-04-12T10:30:00"
}
```

### Phân trang (Pagination)

```json
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 5,
  "size": 20,
  "number": 0
}
```

Query params: `?page=0&size=20&sort=createdAt,desc`

---

## 1. Account Service — `/api/v1/auth` & `/api/v1/accounts`

### 1.1 Đăng nhập

```
POST /api/v1/auth/login
```

**Request:**
```json
{
  "account_number": "FIN0000000000001",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "token_type": "Bearer",
  "expires_in": "900"
}
```

**Lỗi:** `401 INVALID_CREDENTIALS`, `403 ACCOUNT_FROZEN`

---

### 1.2 Đăng xuất

```
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

**Response 200:** `{ "message": "Logged out successfully" }`

---

### 1.3 Tạo tài khoản

```
POST /api/v1/accounts
Authorization: Bearer <token>
```

**Request:**
```json
{
  "accountType": "SAVING",
  "fullName": "Nguyen Van A",
  "email": "nguyenvana@email.com",
  "phone": "0901234567",
  "currency": "VND"
}
```

**Response 201:** `AccountResponse`

**Lỗi:** `400 VALIDATION_ERROR`, `409 ACCOUNT_ALREADY_EXISTS`

---

### 1.4 Lấy tài khoản của tôi

```
GET /api/v1/accounts/me
Authorization: Bearer <token>
```

**Response 200:** `AccountResponse`

```json
{
  "id": "uuid...",
  "userId": "uuid...",
  "accountNumber": "FIN0000000000001",
  "accountType": "SAVING",
  "balance": 1500000.00,
  "availableBalance": 1500000.00,
  "currency": "VND",
  "status": "ACTIVE",
  "dailyLimit": 50000000.00,
  "dailyUsed": 0.00,
  "kycStatus": "VERIFIED",
  "fullName": "Nguyen Van A",
  "email": "nguyenvana@email.com",
  "phone": "0901234567",
  "createdAt": "2026-04-12T10:00:00",
  "updatedAt": "2026-04-12T10:00:00"
}
```

---

### 1.5 Lấy số dư

```
GET /api/v1/accounts/{id}/balance
Authorization: Bearer <token>
```

**Response 200:** `{ "balance": 1500000.00 }`

---

### 1.6 Cập nhật hạn mức giao dịch

```
PUT /api/v1/accounts/{id}/limits
Authorization: Bearer <token>
```

**Request:** `{ "dailyLimit": 10000000.00 }`

**Response 200:** `AccountResponse`

**Lỗi:** `400 LIMIT_TOO_LOW` (tối thiểu 100,000 VND)

---

### 1.7 Đóng băng / Mở tài khoản

```
POST /api/v1/accounts/{id}/freeze?reason=Nghi+ngờ+gian+lận
POST /api/v1/accounts/{id}/unfreeze
Authorization: Bearer <token>
```

**Response 200:** `AccountResponse`

---

### 1.8 Lấy danh sách tài khoản (Admin)

```
GET /api/v1/accounts?page=0&size=20&sort=createdAt,desc
Authorization: Bearer <token>
```

**Response 200:** `PagedAccountResponse`

---

### 1.9 Đóng tài khoản

```
DELETE /api/v1/accounts/{id}
Authorization: Bearer <token>
```

**Response 204:** No Content

**Lỗi:** `422 ACCOUNT_HAS_BALANCE` (phải rút hết tiền trước)

---

## 2. Payment Service — `/api/v1/payments`

### 2.1 Chuyển tiền

```
POST /api/v1/payments/transfer
Authorization: Bearer <token>
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

> Header `Idempotency-Key` **bắt buộc** — dùng UUID ngẫu nhiên cho mỗi lần chuyển.

**Request:**
```json
{
  "fromAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "toAccountId":   "7b9f4e21-1a3c-4d8e-9f2b-5c6d7e8f9a0b",
  "amount": 5000000,
  "description": "Chuyển tiền học phí tháng 4",
  "deviceId": "DEVICE-ABC-12345"
}
```

**Response 201** (Hoàn tất ngay):
```json
{
  "id": "uuid...",
  "referenceNo": "TXN-2026-001234567890",
  "status": "COMPLETED",
  "fraudDecision": "ALLOW",
  "otpRequired": false,
  "amount": 5000000.00,
  "createdAt": "2026-04-12T10:30:00",
  "completedAt": "2026-04-12T10:30:01"
}
```

**Response 202** (Cần OTP — số tiền > 50 triệu hoặc fraud REVIEW):
```json
{
  "id": "uuid...",
  "status": "PROCESSING",
  "fraudDecision": "REVIEW",
  "otpRequired": true,
  "completedAt": null
}
```

**Lỗi:** `400 VALIDATION_ERROR`, `409 DUPLICATE_TRANSACTION`, `422 INSUFFICIENT_BALANCE`, `422 ACCOUNT_FROZEN`, `422 DAILY_LIMIT_EXCEEDED`

---

### 2.2 Xác nhận OTP

```
POST /api/v1/payments/{id}/confirm
Authorization: Bearer <token>
```

**Request:** `{ "otp": "123456" }`

**Response 200:** `TransactionResponse` (status: COMPLETED)

**Lỗi:** `400 INVALID_OTP`, `400 OTP_EXPIRED`, `422 TRANSACTION_NOT_PENDING_OTP`

---

### 2.3 Lịch sử giao dịch

```
GET /api/v1/payments/history?accountId=uuid&page=0&size=20
Authorization: Bearer <token>
```

**Response 200:** `PagedTransactionResponse`

---

### 2.4 Chi tiết giao dịch

```
GET /api/v1/payments/{id}
Authorization: Bearer <token>
```

**Response 200:** `TransactionResponse`

---

### 2.5 Hủy giao dịch

```
POST /api/v1/payments/{id}/cancel
Authorization: Bearer <token>
```

**Response 200:** `TransactionResponse` (status: CANCELLED)

**Lỗi:** `422 CANNOT_CANCEL_COMPLETED`

---

### 2.6 Xem tất cả giao dịch (Admin)

```
GET /api/v1/payments/admin/all?page=0&size=20
Authorization: Bearer <token> (role ADMIN)
```

**Response 200:** `PagedTransactionResponse`

---

## 3. Fraud Service — `/api/v1/fraud`

### 3.1 Lịch sử phân tích gian lận

```
GET /api/v1/fraud/history?page=0&size=20
GET /api/v1/fraud/history/user/{userId}?page=0&size=20
GET /api/v1/fraud/history/{transactionId}
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": "uuid...",
  "transactionId": "uuid...",
  "userId": "uuid...",
  "amount": 120000000.00,
  "totalScore": 60.00,
  "decision": "REVIEW",
  "triggeredRules": ["large_amount", "new_device"],
  "ipAddress": "192.168.1.100",
  "createdAt": "2026-04-12T10:30:00"
}
```

---

## 4. Loan Service — `/api/v1/loans`

### 4.1 Nộp đơn vay

```
POST /api/v1/loans/apply
Authorization: Bearer <token>
```

**Request:**
```json
{
  "loanType": "PERSONAL",
  "amount": 50000000,
  "termMonths": 24,
  "purpose": "Mua xe máy phục vụ đi lại"
}
```

**Response 201:** `LoanResponse`

**Lỗi:** `422 CREDIT_SCORE_INSUFFICIENT` (< 400), `422 ACTIVE_LOAN_EXISTS`

---

### 4.2 Điểm tín dụng

```
GET /api/v1/loans/score/{userId}
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "userId": "uuid...",
  "creditScore": 680,
  "creditGrade": "B+",
  "factors": {
    "payment_history": 0.82,
    "credit_utilization": 0.45,
    "history_length": 0.60
  },
  "calculatedAt": "2026-04-12T10:00:00"
}
```

---

### 4.3 Danh sách khoản vay

```
GET /api/v1/loans?page=0&size=20
Authorization: Bearer <token>
```

**Response 200:** `PagedLoanResponse`

---

### 4.4 Chi tiết khoản vay

```
GET /api/v1/loans/{id}
Authorization: Bearer <token>
```

**Response 200:** `LoanResponse` (bao gồm repaymentSchedule và documents)

---

### 4.5 Phê duyệt / Từ chối (Officer)

```
PUT /api/v1/loans/{id}/approve
Authorization: Bearer <token> (role OFFICER/ADMIN)
```

**Request:**
```json
{
  "approvedAmount": 50000000,
  "interestRate": 10.5,
  "note": "Đủ điều kiện — phê duyệt 50 triệu"
}
```

```
PUT /api/v1/loans/{id}/reject
```

**Request:** `{ "reason": "Điểm tín dụng không đủ" }`

---

## 5. Notification Service — `/api/v1/notifications`

### 5.1 Thông báo của người dùng

```
GET /api/v1/notifications/user/{userId}?page=0&size=20
Authorization: Bearer <token>
```

**Response 200:** `PagedNotificationResponse`

---

### 5.2 Chi tiết thông báo

```
GET /api/v1/notifications/{id}
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": "mongo-id...",
  "userId": "uuid...",
  "type": "SMS",
  "channel": "payment.completed",
  "recipient": "0901234567",
  "body": "Giao dịch 5,000,000 VND thành công. Mã GD: TXN-2026-001234.",
  "status": "SENT",
  "sentAt": "2026-04-12T10:30:02"
}
```

---

## 6. Report Service — `/api/v1/reports`

### 6.1 Sao kê tài khoản

```
GET /api/v1/reports/statement?accountId=uuid&from=2026-04-01T00:00:00&to=2026-04-30T23:59:59&page=0&size=20
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "content": [
    {
      "transactionId": "uuid...",
      "direction": "DEBIT",
      "referenceNo": "TXN-2026-001234",
      "amount": 5000000.00,
      "currency": "VND",
      "type": "TRANSFER",
      "description": "Chuyển tiền học phí tháng 4",
      "counterpartyAccountId": "uuid...",
      "transactionDate": "2026-04-12T10:30:00"
    }
  ],
  "totalElements": 15,
  "totalPages": 1
}
```

---

### 6.2 Thống kê tháng

```
GET /api/v1/reports/summary/monthly?accountId=uuid&year=2026&month=4
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "accountId": "uuid...",
  "year": 2026,
  "month": 4,
  "totalCredit": 15000000.00,
  "totalDebit": 8500000.00,
  "netChange": 6500000.00,
  "transactionCount": 12
}
```

---

## 7. Audit Service — `/api/v1/audit`

### 7.1 Tra cứu Audit Log

```
GET /api/v1/audit?page=0&size=20
GET /api/v1/audit/actor/{actorId}?page=0&size=20
GET /api/v1/audit/resource/{resourceId}?page=0&size=20
GET /api/v1/audit/service/{serviceName}?from=...&to=...&page=0&size=20
Authorization: Bearer <token> (role ADMIN)
```

**Response 200:**
```json
{
  "content": [
    {
      "id": "mongo-id...",
      "timestamp": "2026-04-12T10:30:00",
      "serviceName": "payment-service",
      "action": "PAYMENT_COMPLETED",
      "actorId": "user-uuid...",
      "actorType": "USER",
      "resourceId": "txn-uuid...",
      "resourceType": "TRANSACTION",
      "result": "SUCCESS"
    }
  ]
}
```

---

## 8. Health Checks

Tất cả service đều có endpoint health check không yêu cầu authentication:

```bash
curl http://localhost:8080/health          # API Gateway
curl http://localhost:8081/health          # Account Service
curl http://localhost:8082/health          # Payment Service
curl http://localhost:8083/health          # Fraud Service
curl http://localhost:8084/health          # Loan Service
curl http://localhost:8085/health          # Notification Service
curl http://localhost:8086/health          # Report Service
curl http://localhost:8087/health          # Audit Service
curl http://localhost:8761/actuator/health # Eureka Server
```

**Response:** `{ "status": "ok" }`

---

## 9. Kafka Event Contracts

### PaymentCreatedEvent

```json
{
  "eventId": "uuid",
  "eventType": "payment.created",
  "eventVersion": "1.0",
  "timestamp": "2026-04-12T10:30:00",
  "traceId": "trace-uuid",
  "payload": {
    "transactionId": "uuid",
    "fromAccountId": "uuid",
    "toAccountId": "uuid",
    "amount": 5000000.00,
    "currency": "VND",
    "type": "TRANSFER",
    "initiatedBy": "uuid",
    "deviceId": "DEVICE-ABC",
    "ipAddress": "192.168.1.100"
  }
}
```

### PaymentCompletedEvent

```json
{
  "eventId": "uuid",
  "eventType": "payment.completed",
  "timestamp": "2026-04-12T10:30:01",
  "payload": {
    "transactionId": "uuid",
    "fromAccountId": "uuid",
    "toAccountId": "uuid",
    "amount": 5000000.00,
    "referenceNo": "TXN-2026-001234"
  }
}
```

### FraudResultEvent

```json
{
  "eventId": "uuid",
  "eventType": "fraud.result",
  "timestamp": "2026-04-12T10:30:00",
  "payload": {
    "transactionId": "uuid",
    "decision": "ALLOW",
    "fraudScore": 15.00,
    "triggeredRules": []
  }
}
```

---

## 10. Mã lỗi chuẩn

| HTTP | Code | Mô tả |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | Dữ liệu đầu vào không hợp lệ |
| 400 | `INVALID_OTP` | Mã OTP sai |
| 400 | `OTP_EXPIRED` | Mã OTP hết hạn (> 5 phút) |
| 401 | `INVALID_CREDENTIALS` | Sai số tài khoản hoặc mật khẩu |
| 401 | `INVALID_TOKEN` | JWT không hợp lệ hoặc hết hạn |
| 403 | `ACCOUNT_FROZEN` | Tài khoản đang bị đóng băng |
| 403 | `FORBIDDEN` | Không có quyền truy cập |
| 404 | `ACCOUNT_NOT_FOUND` | Không tìm thấy tài khoản |
| 404 | `TRANSACTION_NOT_FOUND` | Không tìm thấy giao dịch |
| 404 | `LOAN_NOT_FOUND` | Không tìm thấy khoản vay |
| 409 | `ACCOUNT_ALREADY_EXISTS` | Tài khoản đã tồn tại |
| 409 | `DUPLICATE_TRANSACTION` | Idempotency-Key đã được dùng |
| 429 | `RATE_LIMIT_EXCEEDED` | Vượt quá giới hạn request |
| 422 | `INSUFFICIENT_BALANCE` | Số dư không đủ |
| 422 | `DAILY_LIMIT_EXCEEDED` | Vượt hạn mức giao dịch ngày |
| 422 | `CREDIT_SCORE_INSUFFICIENT` | Điểm tín dụng không đủ (< 400) |
| 422 | `ACTIVE_LOAN_EXISTS` | Đã có khoản vay đang xử lý |
| 422 | `ACCOUNT_HAS_BALANCE` | Không thể đóng tài khoản còn số dư |
| 503 | `SERVICE_UNAVAILABLE` | Service đang không khả dụng (circuit open) |
