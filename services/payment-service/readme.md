# Payment Service

Xử lý toàn bộ giao dịch chuyển tiền trong hệ thống Finance — bao gồm tạo lệnh chuyển, kiểm tra gian lận, xác nhận OTP và lưu lịch sử giao dịch.

---

## Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Framework | Spring Boot 3.2 |
| Ngôn ngữ | Java 21 |
| Database | MySQL 8.0 (`payment_db`) |
| Cache / Idempotency | Redis 7.2 |
| Message Broker | Apache Kafka |
| Service Discovery | Eureka Client |
| HTTP Client | OpenFeign + Resilience4j Circuit Breaker |
| Build | Maven |

---

## Port

| Môi trường | Địa chỉ |
|------------|---------|
| Qua API Gateway | `http://localhost:8080` |
| Trực tiếp (dev) | `http://localhost:8082` |
| Nội bộ Docker | `http://payment-service:8082` |

---

## Endpoints

| Method | Path | Mô tả | Auth |
|--------|------|-------|------|
| `POST` | `/api/v1/payments/transfer` | Khởi tạo giao dịch chuyển tiền | JWT |
| `GET` | `/api/v1/payments/{id}` | Chi tiết giao dịch | JWT |
| `GET` | `/api/v1/payments/history` | Lịch sử giao dịch của tài khoản | JWT |
| `POST` | `/api/v1/payments/{id}/confirm` | Xác nhận OTP | JWT |
| `POST` | `/api/v1/payments/{id}/cancel` | Hủy giao dịch | JWT |
| `GET` | `/api/v1/payments/admin/all` | Toàn bộ giao dịch (Admin) | JWT + ADMIN |
| `GET` | `/health` | Health check | Không |

### Request mẫu — Chuyển tiền

```bash
curl -X POST http://localhost:8080/api/v1/payments/transfer \
  -H "Authorization: Bearer <JWT>" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "toAccountId":   "7b9f4e21-1a3c-4d8e-9f2b-5c6d7e8f9a0b",
    "amount": 5000000,
    "description": "Chuyển tiền học phí",
    "deviceId": "DEVICE-ABC-12345"
  }'
```

### Response mẫu — 201 Completed

```json
{
  "id": "abc123...",
  "referenceNo": "TXN-2026-001234567890",
  "fromAccountId": "3fa85f64-...",
  "toAccountId": "7b9f4e21-...",
  "amount": 5000000.00,
  "fee": 0.00,
  "currency": "VND",
  "type": "TRANSFER",
  "status": "COMPLETED",
  "fraudDecision": "ALLOW",
  "otpRequired": false,
  "createdAt": "2026-04-12T10:30:00",
  "completedAt": "2026-04-12T10:30:01"
}
```

### Response mẫu — 202 OTP Required (> 50 triệu VND)

```json
{
  "id": "abc123...",
  "status": "PROCESSING",
  "fraudDecision": "REVIEW",
  "otpRequired": true,
  "createdAt": "2026-04-12T10:30:00",
  "completedAt": null
}
```

---

## Database Schema

**Bảng `transactions`** (MySQL `payment_db`):

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | Primary key |
| `reference_no` | VARCHAR(30) UNIQUE | Mã tham chiếu giao dịch |
| `from_account_id` | UUID | Tài khoản nguồn |
| `to_account_id` | UUID | Tài khoản đích |
| `amount` | DECIMAL(18,2) | Số tiền giao dịch |
| `fee` | DECIMAL(18,2) | Phí giao dịch (default 0) |
| `currency` | VARCHAR(3) | Đơn vị tiền tệ (default VND) |
| `type` | ENUM | TRANSFER / TOPUP / WITHDRAW / PAYMENT / REFUND |
| `status` | ENUM | PENDING / PROCESSING / COMPLETED / FAILED / CANCELLED / REVERSED |
| `fraud_score` | DECIMAL(5,2) | Điểm rủi ro từ Fraud Service |
| `fraud_decision` | ENUM | ALLOW / REVIEW / BLOCK |
| `idempotency_key` | UUID UNIQUE | Chống giao dịch trùng lặp |
| `otp_verified` | BOOLEAN | Đã xác nhận OTP chưa |
| `ip_address` | VARCHAR(45) | IP thực hiện giao dịch |
| `device_id` | VARCHAR(255) | Thiết bị thực hiện |
| `initiated_by` | UUID | ID người khởi tạo |
| `completed_at` | DATETIME | Thời điểm hoàn thành |
| `created_at` | DATETIME | Thời điểm tạo |
| `updated_at` | DATETIME | Thời điểm cập nhật |
| `version` | INT | Optimistic locking |

---

## Kafka Events

### Publish (Produce)

| Topic | Trigger | Payload chính |
|-------|---------|---------------|
| `payment.created` | Giao dịch được khởi tạo | transactionId, fromAccountId, toAccountId, amount, deviceId |
| `payment.completed` | Giao dịch hoàn thành | transactionId, fromAccountId, toAccountId, amount, referenceNo |
| `payment.failed` | Giao dịch thất bại | transactionId, reason |
| `notification.otp.required` | Cần OTP (số tiền lớn) | transactionId, userId, amount |

### Subscribe (Consume)

| Topic | Hành động |
|-------|-----------|
| `fraud.result` | Nhận kết quả phân tích gian lận, cập nhật trạng thái giao dịch |

---

## Luồng xử lý chính

```
POST /transfer
  → Kiểm tra Idempotency-Key (Redis)
  → Gọi Account Service kiểm tra số dư (Feign + Circuit Breaker)
  → Tạo Transaction (PENDING)
  → Publish: payment.created
  → Nhận: fraud.result
       ├── BLOCK  → Transaction FAILED, return 422
       ├── REVIEW → Publish otp.required, return 202 PROCESSING
       └── ALLOW  → Transaction COMPLETED, Publish payment.completed, return 201
```

---

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `MYSQL_HOST` | Host MySQL | `mysql-payment` |
| `DB_USERNAME` | Username DB | `root` |
| `DB_PASSWORD` | Password DB | `root` |
| `REDIS_HOST` | Host Redis | `finance-redis` |
| `KAFKA_SERVERS` | Kafka bootstrap servers | `finance-kafka:9092` |
| `EUREKA_HOST` | Host Eureka | `eureka-server` |
| `EUREKA_USERNAME` | Username xác thực Eureka | `admin` |
| `EUREKA_PASSWORD` | Password xác thực Eureka | `admin123` |
| `ACCOUNT_SERVICE_URL` | URL Account Service | `http://account-service:8081` |

---

## Tính năng đặc biệt

- **Idempotency**: Header `Idempotency-Key` (UUID) bắt buộc — kết quả giao dịch được cache Redis 24h, tránh duplicate khi client retry
- **OTP Flow**: Giao dịch > 50 triệu VND hoặc fraud score REVIEW → gửi OTP qua Notification Service, TTL 5 phút
- **Circuit Breaker**: Khi Account Service không phản hồi, fallback ngay tránh cascade failure
- **Optimistic Locking**: `version` field trên Transaction entity tránh race condition khi cập nhật song song
