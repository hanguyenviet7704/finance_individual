# Audit Service

Ghi nhật ký kiểm toán bất biến (append-only) cho toàn bộ các sự kiện quan trọng trong hệ thống Finance. Phục vụ mục đích tuân thủ pháp lý, điều tra sự cố và truy vết hoạt động người dùng.

---

## Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Framework | Spring Boot 3.2 |
| Ngôn ngữ | Java 21 |
| Database | MongoDB 7.0 (`audit_db`) — Append-only |
| Message Broker | Apache Kafka |
| Service Discovery | Eureka Client |
| Build | Maven |

---

## Port

| Môi trường | Địa chỉ |
|------------|---------|
| Qua API Gateway | `http://localhost:8080` |
| Trực tiếp (dev) | `http://localhost:8087` |
| Nội bộ Docker | `http://audit-service:8087` |

---

## Endpoints

| Method | Path | Mô tả | Auth |
|--------|------|-------|------|
| `GET` | `/api/v1/audit` | Toàn bộ audit log (phân trang, mới nhất trước) | JWT + ADMIN |
| `GET` | `/api/v1/audit/actor/{actorId}` | Log theo actor (user UUID hoặc "system") | JWT + ADMIN |
| `GET` | `/api/v1/audit/resource/{resourceId}` | Lịch sử thay đổi của một tài nguyên | JWT + ADMIN |
| `GET` | `/api/v1/audit/service/{serviceName}` | Log theo service trong khoảng thời gian | JWT + ADMIN |
| `GET` | `/health` | Health check | Không |

### Parameters — Theo service (`/service/{serviceName}`)

| Param | Bắt buộc | Mô tả |
|-------|----------|-------|
| `serviceName` | Có | Tên service: payment-service, fraud-service... |
| `from` | Có | Thời điểm bắt đầu (ISO 8601) |
| `to` | Có | Thời điểm kết thúc (ISO 8601) |
| `page` | Không | Trang (default: 0) |

### Response mẫu

```json
{
  "content": [
    {
      "id": "mongo-objectid...",
      "timestamp": "2026-04-12T10:30:00",
      "serviceName": "payment-service",
      "action": "PAYMENT_COMPLETED",
      "actorId": "user-uuid...",
      "actorType": "USER",
      "resourceId": "txn-uuid...",
      "resourceType": "TRANSACTION",
      "oldValue": "{\"status\":\"PROCESSING\"}",
      "newValue": "{\"status\":\"COMPLETED\"}",
      "ipAddress": "192.168.1.100",
      "traceId": "abc-trace-123",
      "result": "SUCCESS"
    }
  ],
  "totalElements": 1250,
  "totalPages": 63
}
```

---

## Kafka Events (Subscribe)

Service lắng nghe toàn bộ sự kiện từ hệ thống:

| Topic | Action ghi log | ResourceType |
|-------|---------------|-------------|
| `payment.created` | PAYMENT_INITIATED | TRANSACTION |
| `payment.completed` | PAYMENT_COMPLETED | TRANSACTION |
| `payment.failed` | PAYMENT_FAILED | TRANSACTION |
| `fraud.detected` | FRAUD_DETECTED | TRANSACTION |
| `account.created` | ACCOUNT_CREATED | ACCOUNT |
| `account.frozen` | ACCOUNT_FROZEN | ACCOUNT |
| `loan.applied` | LOAN_APPLIED | LOAN |
| `loan.approved` | LOAN_APPROVED | LOAN |

---

## Database Schema (MongoDB)

**Collection `audit_logs`** — **Chỉ INSERT, không UPDATE, không DELETE:**

| Field | Type | Mô tả |
|-------|------|-------|
| `_id` | ObjectId | MongoDB ID |
| `timestamp` | DateTime (indexed) | Thời điểm sự kiện xảy ra |
| `serviceName` | String (indexed) | Service phát sinh sự kiện |
| `action` | String | PAYMENT_COMPLETED / ACCOUNT_FROZEN... |
| `actorId` | String (indexed) | UUID người dùng hoặc "system" |
| `actorType` | Enum | USER / SYSTEM / ADMIN |
| `resourceId` | String (indexed) | UUID của đối tượng bị tác động |
| `resourceType` | Enum | TRANSACTION / ACCOUNT / LOAN |
| `oldValue` | String | JSON trạng thái trước khi thay đổi |
| `newValue` | String | JSON trạng thái sau khi thay đổi |
| `ipAddress` | String | IP thực hiện hành động |
| `userAgent` | String | Trình duyệt / thiết bị |
| `traceId` | String | OpenTelemetry trace ID |
| `result` | String | SUCCESS / FAILURE |
| `errorMessage` | String | Thông báo lỗi nếu FAILURE |
| `createdAt` | DateTime | Thời điểm ghi log |

**Compound Indexes:**
- `(serviceName, timestamp DESC)` — tra cứu theo service trong khoảng thời gian
- `(actorId, timestamp DESC)` — tra cứu lịch sử hoạt động người dùng
- `(resourceId, timestamp DESC)` — tra cứu lịch sử thay đổi của một tài nguyên

---

## Nguyên tắc Bất biến (Immutability)

> **TUYỆT ĐỐI KHÔNG** thêm UPDATE hoặc DELETE vào service này.

- Mọi bản ghi chỉ được INSERT một lần — không bao giờ sửa đổi
- Đảm bảo tính toàn vẹn của audit trail cho mục đích pháp lý
- MongoDB `_id` được MongoDB tự sinh — không tái sử dụng
- Nếu cần "sửa" log: thêm bản ghi mới với action = "CORRECTION"

---

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `MONGO_HOST` | Host MongoDB | `finance-mongodb` |
| `MONGO_USERNAME` | Username MongoDB | `admin` |
| `MONGO_PASSWORD` | Password MongoDB | `admin123` |
| `KAFKA_SERVERS` | Kafka bootstrap servers | `finance-kafka:9092` |
| `EUREKA_HOST` | Host Eureka | `eureka-server` |
| `EUREKA_USERNAME` | Username xác thực Eureka | `admin` |
| `EUREKA_PASSWORD` | Password xác thực Eureka | `admin123` |
