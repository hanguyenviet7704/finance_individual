# Report Service

Cung cấp sao kê tài khoản và thống kê giao dịch theo mô hình CQRS — xây dựng Read Model riêng từ Kafka events, tối ưu hoàn toàn cho việc query mà không ảnh hưởng đến Payment Service.

---

## Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Framework | Spring Boot 3.2 |
| Ngôn ngữ | Java 21 |
| Database | MongoDB 7.0 (`report_db`) — CQRS Read Model |
| Message Broker | Apache Kafka |
| Service Discovery | Eureka Client |
| Build | Maven |

---

## Port

| Môi trường | Địa chỉ |
|------------|---------|
| Qua API Gateway | `http://localhost:8080` |
| Trực tiếp (dev) | `http://localhost:8086` |
| Nội bộ Docker | `http://report-service:8086` |

---

## Endpoints

| Method | Path | Mô tả | Auth |
|--------|------|-------|------|
| `GET` | `/api/v1/reports/statement` | Sao kê tài khoản theo khoảng thời gian | JWT |
| `GET` | `/api/v1/reports/summary/monthly` | Thống kê thu/chi theo tháng | JWT |
| `GET` | `/health` | Health check | Không |

### Parameters — Sao kê (`/statement`)

| Param | Bắt buộc | Mô tả |
|-------|----------|-------|
| `accountId` | Có | UUID tài khoản |
| `from` | Có | Thời điểm bắt đầu (ISO 8601) |
| `to` | Có | Thời điểm kết thúc (ISO 8601) |
| `page` | Không | Trang (default: 0) |
| `size` | Không | Kích thước trang (default: 20) |

### Parameters — Thống kê tháng (`/summary/monthly`)

| Param | Bắt buộc | Mô tả |
|-------|----------|-------|
| `accountId` | Có | UUID tài khoản |
| `year` | Có | Năm (e.g. 2026) |
| `month` | Có | Tháng 1–12 |

### Request mẫu

```bash
# Sao kê tháng 4
curl "http://localhost:8080/api/v1/reports/statement?accountId=uuid&from=2026-04-01T00:00:00&to=2026-04-30T23:59:59" \
  -H "Authorization: Bearer <JWT>"

# Thống kê tháng 4/2026
curl "http://localhost:8080/api/v1/reports/summary/monthly?accountId=uuid&year=2026&month=4" \
  -H "Authorization: Bearer <JWT>"
```

### Response mẫu — Sao kê

```json
{
  "content": [
    {
      "transactionId": "txn-uuid...",
      "direction": "DEBIT",
      "referenceNo": "TXN-2026-001234",
      "amount": 5000000.00,
      "currency": "VND",
      "type": "TRANSFER",
      "description": "Chuyển tiền học phí",
      "counterpartyAccountId": "to-account-uuid",
      "transactionDate": "2026-04-12T10:30:00"
    }
  ],
  "totalElements": 15,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

### Response mẫu — Thống kê tháng

```json
{
  "accountId": "account-uuid...",
  "year": 2026,
  "month": 4,
  "totalCredit": 15000000.00,
  "totalDebit": 8500000.00,
  "netChange": 6500000.00,
  "transactionCount": 12
}
```

---

## CQRS Pattern

Service này là **Read Side** trong mô hình CQRS:

```
Payment Service (Write Side)
    │
    │ Kafka: payment.completed
    ▼
Report Service (Read Side)
    │
    │ Tạo 2 bản ghi mỗi giao dịch:
    │  - DEBIT  cho tài khoản nguồn
    │  - CREDIT cho tài khoản đích
    ▼
MongoDB Read Model
    │
    │ Trả kết quả tối ưu
    ▼
API /statement & /summary/monthly
```

Ưu điểm:
- Query siêu nhanh — dữ liệu đã được denormalize sẵn
- Không gây tải lên Payment Service khi báo cáo
- Có thể build nhiều Read Model khác nhau từ cùng một event stream

---

## Database Schema (MongoDB)

**Collection `transaction_read_models`:**

| Field | Type | Mô tả |
|-------|------|-------|
| `_id` | ObjectId | MongoDB ID |
| `transactionId` | String (indexed) | ID giao dịch gốc |
| `accountId` | String (indexed) | ID tài khoản (cả 2 chiều) |
| `direction` | Enum | DEBIT (tiền ra) / CREDIT (tiền vào) |
| `referenceNo` | String | Mã tham chiếu giao dịch |
| `amount` | Decimal | Số tiền |
| `currency` | String | VND |
| `type` | String | TRANSFER / TOPUP / WITHDRAW |
| `status` | String | COMPLETED |
| `description` | String | Nội dung giao dịch |
| `counterpartyAccountId` | String | Tài khoản đối tác |
| `transactionDate` | DateTime (indexed) | Thời điểm giao dịch |
| `createdAt` | DateTime | Thời điểm tạo record |

**Indexes:** `(accountId, transactionDate DESC)` — tối ưu cho query sao kê theo tài khoản và thời gian.

---

## Kafka Events (Subscribe)

| Topic | Hành động |
|-------|-----------|
| `payment.completed` | Tạo 2 bản ghi Read Model (DEBIT + CREDIT) |

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
