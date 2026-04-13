# Fraud Service

Phát hiện và phân tích gian lận cho các giao dịch tài chính theo thời gian thực. Service hoạt động hoàn toàn bất đồng bộ qua Kafka — nhận sự kiện `payment.created`, phân tích bằng rule engine, và trả kết quả qua `fraud.result`.

---

## Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Framework | Spring Boot 3.2 |
| Ngôn ngữ | Java 21 |
| Database | MySQL 8.0 (`fraud_db`) |
| Feature Store | Redis 7.2 |
| Message Broker | Apache Kafka |
| Service Discovery | Eureka Client |
| Build | Maven |

---

## Port

| Môi trường | Địa chỉ |
|------------|---------|
| Qua API Gateway | `http://localhost:8080` |
| Trực tiếp (dev) | `http://localhost:8083` |
| Nội bộ Docker | `http://fraud-service:8083` |

---

## Endpoints (REST — tra cứu lịch sử)

| Method | Path | Mô tả | Auth |
|--------|------|-------|------|
| `GET` | `/api/v1/fraud/history` | Toàn bộ lịch sử phân tích (phân trang) | JWT + ADMIN |
| `GET` | `/api/v1/fraud/history/user/{userId}` | Lịch sử gian lận theo người dùng | JWT |
| `GET` | `/api/v1/fraud/history/{transactionId}` | Kết quả phân tích theo giao dịch | JWT |
| `GET` | `/health` | Health check | Không |

### Response mẫu — Lịch sử gian lận

```json
{
  "id": "abc123...",
  "transactionId": "txn-uuid...",
  "userId": "user-uuid...",
  "amount": 120000000.00,
  "ruleScore": 60.00,
  "totalScore": 60.00,
  "decision": "REVIEW",
  "triggeredRules": ["large_amount", "new_device"],
  "ipAddress": "192.168.1.100",
  "deviceId": "DEVICE-ABC-12345",
  "createdAt": "2026-04-12T10:30:00"
}
```

---

## Rule Engine

Service chấm điểm giao dịch theo 8 rule độc lập. Tổng điểm quyết định kết quả:

| Rule | Điểm | Điều kiện vi phạm |
|------|------|-------------------|
| `abnormal_amount` | 30 | Số tiền > 3× trung bình 30 ngày gần nhất |
| `unusual_hour` | 20 | Thực hiện lúc 1h–4h sáng |
| `velocity_check_1h` | 35 | > 10 giao dịch trong 1 giờ qua |
| `velocity_check_24h` | 20 | > 30 giao dịch trong 24 giờ qua |
| `new_device` | 25 | Thiết bị chưa từng dùng trước đây |
| `new_beneficiary_high_amount` | 20 | Người nhận mới + số tiền > 10 triệu VND |
| `blacklisted_account` | 100 | Tài khoản nhận nằm trong danh sách đen |
| `large_amount` | 30 | Số tiền > 100 triệu VND |

**Quyết định theo tổng điểm:**
- ≥ 80 → **BLOCK** (từ chối giao dịch)
- 40–79 → **REVIEW** (yêu cầu xác nhận OTP)
- < 40 → **ALLOW** (thông qua ngay)

---

## Database Schema

**Bảng `fraud_history`** (MySQL `fraud_db`):

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | Primary key |
| `transaction_id` | UUID | ID giao dịch được phân tích |
| `user_id` | UUID | ID người dùng |
| `amount` | DECIMAL(18,2) | Số tiền giao dịch |
| `rule_score` | DECIMAL(5,2) | Tổng điểm cộng dồn từ các rule vi phạm (có thể > 100 nếu nhiều rule kích hoạt) |
| `total_score` | DECIMAL(5,2) | Điểm cuối cùng sau khi cap tối đa 100 — dùng để ra quyết định ALLOW/REVIEW/BLOCK |
| `decision` | ENUM | ALLOW / REVIEW / BLOCK |
| `triggered_rules` | TEXT | JSON array: ["rule1", "rule2"] |
| `ip_address` | VARCHAR(45) | IP thực hiện giao dịch |
| `device_id` | VARCHAR(255) | Thiết bị thực hiện |
| `created_at` | DATETIME | Thời điểm phân tích |

---

## Redis Feature Store

Dữ liệu thống kê được lưu Redis để tính điểm real-time:

| Key Pattern | TTL | Nội dung |
|-------------|-----|----------|
| `fraud:tx_count:{userId}:1h` | 1 giờ | Số giao dịch trong 1 giờ qua |
| `fraud:tx_count:{userId}:24h` | 24 giờ | Số giao dịch trong 24 giờ qua |
| `fraud:amount_avg:{userId}:30d` | 30 ngày | Trung bình số tiền 30 ngày |
| `fraud:devices:{userId}` | Vĩnh viễn | Set các device ID đã biết |
| `fraud:beneficiaries:{userId}` | Vĩnh viễn | Set các tài khoản nhận đã biết |
| `fraud:blacklist` | Vĩnh viễn | Set tài khoản bị blacklist |

---

## Kafka Events

### Subscribe (Consume)

| Topic | Hành động |
|-------|-----------|
| `payment.created` | Nhận thông tin giao dịch → chạy rule engine → lưu kết quả |

### Publish (Produce)

| Topic | Trigger | Payload chính |
|-------|---------|---------------|
| `fraud.result` | Mọi giao dịch | transactionId, decision, fraudScore, triggeredRules |
| `fraud.detected` | Khi decision = BLOCK | userId, transactionId, reason, triggeredRules |

---

## Luồng xử lý

```
Consume: payment.created
  → Lấy FraudContext từ Redis (tx count, avg amount, devices)
  → Chạy 8 rule song song
  → Tính tổng điểm
  → Lưu FraudHistory vào MySQL
  → Cập nhật Redis: tăng counter, thêm device mới
  → Publish: fraud.result
  → Nếu BLOCK: Publish: fraud.detected
```

---

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `MYSQL_HOST` | Host MySQL | `mysql-fraud` |
| `DB_USERNAME` | Username DB | `root` |
| `DB_PASSWORD` | Password DB | `root` |
| `REDIS_HOST` | Host Redis | `finance-redis` |
| `KAFKA_SERVERS` | Kafka bootstrap servers | `finance-kafka:9092` |
| `EUREKA_HOST` | Host Eureka | `eureka-server` |
| `EUREKA_USERNAME` | Username xác thực Eureka | `admin` |
| `EUREKA_PASSWORD` | Password xác thực Eureka | `admin123` |
