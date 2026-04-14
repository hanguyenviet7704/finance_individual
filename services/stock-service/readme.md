# Stock Service (Dịch vụ Chứng khoán)

`stock-service` là một phân hệ mới trong hệ thống **Finance Microservices Platform** chịu trách nhiệm quản lý đầu tư chứng khoán. Module này chia rõ quyền thiết lập giữa Người dùng (Customer) và Quản trị viên (Admin).

---

## 🏗 Kiến trúc (Architecture)
- **Framework**: Spring Boot 3 + Java 21
- **Discovery**: Khai báo tới Eureka Server.
- **Routing**: Nhận lưu lượng qua API Gateway (`/api/v1/stocks/**`).
- **Database**:
  - `MySQL` (port 3311) cho Dữ liệu có cấu trúc và tính nhất quán cao (Giao dịch, Portfolio).
  - `Redis` (port 6380) Server dùng chung hoặc cluster riêng để đệm (Cache) giá cổ phiếu Realtime nhằm giảm tải database.
- **Message Broker**:
  - `Kafka` dùng để điều phối luồng giao dịch (Mô hình Saga). Gửi event qua `payment-service` để trừ/cộng tiền khi mua/bán cổ phiếu.

---

## 👥 Phân quyền chức năng (Role-based Features)

### 1. Dành cho Khách hàng (Customer)
- **Xem Bảng Giá (Market Data)**: Liệt kê danh sách các mã cổ phiếu đang được phép giao dịch kèm giá hiện hành. (Hỗ trợ phân trang, lọc, search).
- **Giao dịch Mua/Bán (Trading)**: 
  - Đặt lệnh mua cổ phiếu (Kiểm tra số dư từ ví).
  - Đặt lệnh bán cổ phiếu (Kiểm tra số lượng cổ phiếu đang nắm giữ).
- **Quản lý Danh mục (Portfolio)**: Xem danh sách cổ phiếu đang nắm giữ, vốn đầu tư, phần trăm lãi/lỗ dựa vào giá thị trường.
- **Lịch sử khớp lệnh (Order History)**: Tra cứu lịch sử các lệnh đã đặt thành công / thất bại.

### 2. Dành cho Quản trị viên (Admin)
- **Quản lý Ticker (Symbol Management)**: Thêm mã cổ phiếu mới, ẩn/hiện mã, cập nhật tên công ty.
- **Đóng/Mở Giao Dịch (Halt/Resume Trading)**: Khóa khẩn cấp chức năng Mua/Bán của một Cổ phiếu cụ thể nếu có biến động, hoặc khóa nguyên sàn.
- **Cấu hình Phí (Fee Configuration)**: Thiết lập mức phần trăm phí thu trên mỗi lệnh mua/bán thành công.
- **Báo cáo Hệ thống (Reporting/Stats)**: Xem rổ thống kê mức độ giao dịch trên toàn sàn (Volume, Số lệnh trong ngày).

---

## 💾 Cấu trúc Cơ sở dữ liệu (Database Schema)

Service này sử dụng JPA (Hibernate) cho MySQL, bao gồm các bảng cốt lõi:

1. **`stocks` (Mã chứng khoán)**
   - `id` (PK), `ticker_symbol` (Unique code: VCB, HPG), `company_name`, `current_price`, `status` (ACTIVE, HALTED), `created_at`, `updated_at`.

2. **`portfolios` (Danh mục người dùng)**
   - `id` (PK), `user_id` (Lấy từ Account Service), `ticker_symbol`, `quantity` (Số lượng hiện có), `average_buy_price` (Giá mua trung bình), `updated_at`.

3. **`stock_orders` (Lệnh giao dịch)**
   - `id` (PK), `user_id`, `ticker_symbol`, `order_type` (BUY, SELL), `quantity`, `price_per_share`, `fee_amount`, `total_amount`, `status` (PENDING, COMPLETED, FAILED), `created_at`.

4. **`system_config` (Cấu hình Admin)**
   - `config_key` (PK), `config_value`, `description`, `updated_by`. (Lưu trữ trạng thái sàn, tỷ lệ phí).

---

## 🔗 Tích hợp hệ thống (Saga/Kafka Integration)

Quy trình Mua cổ phiếu (Buy Flow):
1. **User request** gởi lệnh BUY tới `stock-service` qua Gateway.
2. `stock-service` lưu order là `PENDING` và gửi Kafka event `STOCK_BUY_INITIATED`.
3. `payment-service` tiêu thụ (consume) event, kiểm tra số dư:
   - Nếu đủ: Trừ tiền, gửi event `PAYMENT_DEDUCTED_SUCCESS`.
   - Nếu không đủ: Gửi event `PAYMENT_DEDUCTED_FAILED`.
4. `stock-service` xử lý kết quả:
   - Nếu thành công: Cập nhật order thành `COMPLETED`, cộng số lượng vào `portfolios`.
   - Nếu thất bại: Chuyển order thành `FAILED`, báo lỗi.
5. `audit-service` (Được cấu hình để lắng nghe mọi event) nạp log vào MongoDB.

---

## 🛠 Lộ trình Triển khai (Roadmap)

- [ ] 1. Khởi tạo `stock-service` base project.
- [ ] 2. Update `docker-compose.yml` (add MySQL & Service definitions).
- [ ] 3. Thêm cấu hình Routing vào API Gateway.
- [ ] 4. Phát triển REST API & Entity Mappings.
- [ ] 5. Thiết lập Kafka Event Listeners / Producers để liên kết với Payment.
- [ ] 6. Cập nhật Frontend UI (Stock Dashboard).
