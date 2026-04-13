# Notification Service

Gửi thông báo theo sự kiện (event-driven) cho người dùng qua các kênh Email, SMS và OTP. Service không expose business API — hoạt động hoàn toàn bằng cách lắng nghe Kafka events.

---

## Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Framework | Spring Boot 3.2 |
| Ngôn ngữ | Java 21 |
| Database | MongoDB 7.0 (`notification_db`) |
| Message Broker | Apache Kafka |
| Email | JavaMail (SMTP) |
| Service Discovery | Eureka Client |
| Build | Maven |

---

## Port

| Môi trường | Địa chỉ |
|------------|---------|
| Qua API Gateway | `http://localhost:8080` |
| Trực tiếp (dev) | `http://localhost:8085` |
| Nội bộ Docker | `http://notification-service:8085` |

---

## Endpoints (REST — tra cứu lịch sử thông báo)

| Method | Path | Mô tả | Auth |
|--------|------|-------|------|
| `GET` | `/api/v1/notifications/user/{userId}` | Thông báo của người dùng (phân trang) | JWT |
| `GET` | `/api/v1/notifications/{id}` | Chi tiết một thông báo | JWT |
| `GET` | `/api/v1/notifications/status/{status}` | Thông báo theo trạng thái | JWT |
| `GET` | `/api/v1/notifications/channel/{channel}` | Thông báo theo kênh Kafka | JWT |
| `GET` | `/api/v1/notifications/failed` | Thông báo thất bại / cần retry | JWT + ADMIN |
| `GET` | `/health` | Health check | Không |

### Response mẫu

```json
{
  "id": "mongo-objectid...",
  "userId": "user-uuid...",
  "transactionId": "txn-uuid...",
  "type": "SMS",
  "channel": "payment.completed",
  "recipient": "0901234567",
  "subject": "Xác nhận giao dịch",
  "body": "Giao dịch 5,000,000 VND thành công. Mã GD: TXN-2026-001234.",
  "status": "SENT",
  "retryCount": 0,
  "createdAt": "2026-04-12T10:30:01",
  "sentAt": "2026-04-12T10:30:02"
}
```

---

## Kafka Events (Subscribe)

| Topic | Hành động | Kênh thông báo |
|-------|-----------|----------------|
| `payment.completed` | Gửi SMS xác nhận giao dịch thành công | SMS |
| `fraud.detected` | Cảnh báo gian lận đến người dùng | SMS + PUSH |
| `account.created` | Email chào mừng tài khoản mới | EMAIL |
| `notification.otp.required` | Gửi mã OTP 6 chữ số qua SMS | SMS |

---

## Template thông báo mẫu

| Sự kiện | Kênh | Nội dung mẫu |
|---------|------|--------------|
| `payment.completed` | SMS | "Giao dịch {amount} VND thành công. Mã GD: {referenceNo}. Số dư: {balance} VND." |
| `notification.otp.required` | SMS | "Mã OTP của bạn là: {otp}. Hiệu lực 5 phút. Không chia sẻ mã này." |
| `account.created` | Email | "Chào mừng {fullName}! Tài khoản {accountNumber} đã được tạo thành công." |
| `fraud.detected` | SMS | "CẢNH BÁO: Giao dịch {amount} VND bị từ chối do nghi ngờ gian lận. Liên hệ hỗ trợ nếu cần." |

---

## Database Schema (MongoDB)

**Collection `notification_logs`:**

| Field | Type | Mô tả |
|-------|------|-------|
| `_id` | ObjectId | MongoDB ID |
| `userId` | String | ID người nhận |
| `transactionId` | String | ID giao dịch liên quan |
| `type` | Enum | EMAIL / SMS / PUSH |
| `channel` | String | Tên Kafka topic nguồn |
| `recipient` | String | Email hoặc số điện thoại |
| `subject` | String | Tiêu đề thông báo |
| `body` | String | Nội dung thông báo |
| `status` | Enum | PENDING / SENT / FAILED / RETRY |
| `errorMessage` | String | Lý do thất bại (nếu có) |
| `retryCount` | Integer | Số lần đã retry |
| `createdAt` | DateTime | Thời điểm nhận event |
| `sentAt` | DateTime | Thời điểm gửi thành công |

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
| `MAIL_HOST` | SMTP server | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | Email gửi | — |
| `MAIL_PASSWORD` | App password | — |

---

## Retry Logic

Khi gửi thất bại, service tự động retry theo cơ chế:
- Lần 1: retry sau 1 phút
- Lần 2: retry sau 5 phút
- Lần 3: retry sau 30 phút
- Quá 3 lần: đánh dấu `FAILED`, cần can thiệp thủ công
