# Loan Service

Quản lý vòng đời khoản vay: nộp đơn, tính điểm tín dụng, thẩm định, phê duyệt/từ chối và theo dõi lịch trả nợ. Kết hợp MySQL (dữ liệu có cấu trúc) và MongoDB (hồ sơ vay linh hoạt).

---

## Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Framework | Spring Boot 3.2 |
| Ngôn ngữ | Java 21 |
| Database chính | MySQL 8.0 (`loan_db`) |
| Database tài liệu | MongoDB 7.0 (`loan_db`) |
| Cache / Credit Score | Redis 7.2 |
| Message Broker | Apache Kafka |
| Service Discovery | Eureka Client |
| Build | Maven |

---

## Port

| Môi trường | Địa chỉ |
|------------|---------|
| Qua API Gateway | `http://localhost:8080` |
| Trực tiếp (dev) | `http://localhost:8084` |
| Nội bộ Docker | `http://loan-service:8084` |

---

## Endpoints

| Method | Path | Mô tả | Auth |
|--------|------|-------|------|
| `POST` | `/api/v1/loans/apply` | Nộp đơn đăng ký vay | JWT |
| `GET` | `/api/v1/loans` | Danh sách khoản vay của tôi | JWT |
| `GET` | `/api/v1/loans/{id}` | Chi tiết khoản vay + lịch trả nợ | JWT |
| `PUT` | `/api/v1/loans/{id}/approve` | Phê duyệt khoản vay | JWT + OFFICER |
| `PUT` | `/api/v1/loans/{id}/reject` | Từ chối khoản vay | JWT + OFFICER |
| `GET` | `/api/v1/loans/score/{userId}` | Tính và lấy điểm tín dụng | JWT |
| `GET` | `/health` | Health check | Không |

### Request mẫu — Nộp đơn vay

```bash
curl -X POST http://localhost:8080/api/v1/loans/apply \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "loanType": "PERSONAL",
    "amount": 50000000,
    "termMonths": 24,
    "purpose": "Mua xe máy phục vụ đi lại"
  }'
```

### Response mẫu — 201 Created

```json
{
  "id": "loan-uuid...",
  "loanCode": "LOAN-2026-001234",
  "userId": "user-uuid...",
  "status": "PENDING",
  "loanType": "PERSONAL",
  "requestedAmount": 50000000.00,
  "approvedAmount": null,
  "interestRate": null,
  "termMonths": 24,
  "purpose": "Mua xe máy phục vụ đi lại",
  "creditScore": 680,
  "creditGrade": "B+",
  "repaymentSchedule": [],
  "documents": [],
  "createdAt": "2026-04-12T10:30:00",
  "approvedAt": null
}
```

### Response mẫu — Sau khi phê duyệt (có lịch trả nợ)

```json
{
  "status": "APPROVED",
  "approvedAmount": 50000000.00,
  "interestRate": 10.5,
  "repaymentSchedule": [
    {
      "installmentNo": 1,
      "dueDate": "2026-05-12T00:00:00",
      "principal": 1871066.00,
      "interest": 437500.00,
      "total": 2308566.00,
      "status": "PENDING"
    }
  ]
}
```

---

## Credit Score (Điểm tín dụng)

**Thang điểm: 300–850** (tương tự FICO). Tối thiểu để nộp đơn: **400**. Cache Redis TTL: 24 giờ.

| Thành phần | Trọng số | Mô tả |
|-----------|----------|-------|
| Lịch sử thanh toán | 35% | Tỷ lệ trả đúng hạn |
| Tỷ lệ sử dụng tín dụng | 30% | Tỷ lệ dư nợ / hạn mức |
| Độ dài lịch sử | 15% | Thời gian sử dụng tín dụng |
| Đa dạng giao dịch | 10% | Số loại sản phẩm tín dụng |
| Tra cứu gần đây | 10% | Số lần đăng ký tín dụng mới |

**Phân loại hạng:**

| Điểm | Hạng | Lãi suất tham chiếu |
|------|------|---------------------|
| 750–850 | A+ | 6–8%/năm |
| 700–749 | A | 8–10%/năm |
| 650–699 | B+ | 10–12%/năm |
| 600–649 | B | 12–15%/năm |
| 550–599 | C+ | 15–18%/năm |
| 500–549 | C | 18–22%/năm |
| 400–499 | D | Từ chối / yêu cầu thế chấp |

---

## Công thức tính lịch trả nợ (Annuity Method)

Hệ thống tính theo phương pháp **trả góp đều (annuity)** — mỗi kỳ trả cùng một tổng số tiền, trong đó tỷ lệ gốc tăng dần và lãi giảm dần.

**Công thức kỳ trả hàng tháng:**

```
r  = interestRate / 100 / 12          (lãi suất tháng)
n  = termMonths                        (số kỳ)
P  = approvedAmount                    (số tiền gốc)

Kỳ trả tháng (M) = P × r × (1+r)^n / ((1+r)^n - 1)
```

**Ví dụ:** Vay 50,000,000 VND, lãi 10.5%/năm, 24 tháng
```
r  = 10.5 / 100 / 12 = 0.00875
n  = 24
M  = 50,000,000 × 0.00875 × (1.00875)^24 / ((1.00875)^24 - 1)
M  ≈ 2,308,566 VND/tháng

Kỳ 1:  Lãi = 50,000,000 × 0.00875 = 437,500   Gốc = 2,308,566 - 437,500 = 1,871,066
Kỳ 2:  Lãi = 48,128,934 × 0.00875 = 421,128   Gốc = 2,308,566 - 421,128 = 1,887,438
...
Kỳ 24: Lãi ≈ 20,073                            Gốc ≈ 2,288,493
```

**Tổng lãi phải trả = M × n - P = 2,308,566 × 24 - 50,000,000 = 5,405,584 VND**

---

## Database Schema

### MySQL `loan_db` — Bảng `loans`

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | Primary key |
| `loan_code` | VARCHAR(30) UNIQUE | Mã khoản vay: LOAN-2026-001234 |
| `user_id` | UUID | ID người vay |
| `account_id` | UUID | Tài khoản nhận giải ngân |
| `status` | ENUM | PENDING / UNDER_REVIEW / APPROVED / REJECTED / DISBURSED / ACTIVE / COMPLETED / DEFAULTED |
| `loan_type` | ENUM | PERSONAL / VEHICLE / MORTGAGE / BUSINESS / EDUCATION |
| `requested_amount` | DECIMAL(18,2) | Số tiền đề nghị vay |
| `approved_amount` | DECIMAL(18,2) | Số tiền được duyệt |
| `interest_rate` | DECIMAL(5,2) | Lãi suất hàng năm (%) |
| `term_months` | INT | Thời hạn vay (tháng) |
| `credit_score` | INT | Điểm tín dụng tại thời điểm nộp |
| `credit_grade` | VARCHAR(5) | Hạng tín dụng (A+, A, B+...) |
| `mongo_doc_id` | VARCHAR(50) | Tham chiếu tới document MongoDB |
| `approved_by` | UUID | ID nhân viên phê duyệt |
| `approved_at` | DATETIME | Thời điểm phê duyệt |
| `created_at` | DATETIME | Thời điểm nộp đơn |

### MongoDB `loan_db` — Collection `loan_applications`

```json
{
  "_id": "ObjectId",
  "loanId": "UUID tham chiếu bảng loans",
  "loanCode": "LOAN-2026-001234",
  "creditScore": {
    "score": 680,
    "grade": "B+",
    "calculatedAt": "2026-04-12T10:30:00",
    "factors": { "payment_history": 0.82, "credit_utilization": 0.45 }
  },
  "documents": [
    { "type": "CCCD", "fileId": "...", "status": "VERIFIED" }
  ],
  "reviewHistory": [
    { "reviewedBy": "officer-uuid", "action": "APPROVED", "timestamp": "..." }
  ],
  "repaymentSchedule": [
    { "installmentNo": 1, "dueDate": "...", "principal": 1871066, "interest": 437500, "total": 2308566, "status": "PENDING" }
  ]
}
```

---

## Kafka Events

### Publish (Produce)

| Topic | Trigger | Payload chính |
|-------|---------|---------------|
| `loan.applied` | Đơn vay được nộp | loanId, userId, amount, creditScore |
| `loan.approved` | Khoản vay được phê duyệt | loanId, userId, approvedAmount |

---

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `MYSQL_HOST` | Host MySQL | `mysql-loan` |
| `DB_USERNAME` | Username DB | `root` |
| `DB_PASSWORD` | Password DB | `root` |
| `MONGO_HOST` | Host MongoDB | `finance-mongodb` |
| `MONGO_USERNAME` | Username MongoDB | `admin` |
| `MONGO_PASSWORD` | Password MongoDB | `admin123` |
| `REDIS_HOST` | Host Redis | `finance-redis` |
| `KAFKA_SERVERS` | Kafka bootstrap servers | `finance-kafka:9092` |
| `EUREKA_HOST` | Host Eureka | `eureka-server` |
| `EUREKA_USERNAME` | Username xác thực Eureka | `admin` |
| `EUREKA_PASSWORD` | Password xác thực Eureka | `admin123` |
