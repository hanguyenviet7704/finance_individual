# Hướng dẫn Triển khai Finance Platform trên DigitalOcean (qua GitHub Student)

Nếu bạn đã có quyền lợi **GitHub Student Developer Pack**, bạn sẽ được cấp **$200 Credit** sử dụng trên nền tảng Cloud của DigitalOcean. DigitalOcean (hay gọi tắt là DO) là một trong những nền tảng cung cấp VPS (được gọi là **Droplet**) dễ cấu hình và chạy mượt nhất cho dân Developer. Khác với Azure, hệ thống của DO không bị PTIT quản lý policy, do đó bạn có toàn quyền Admin (Root) tạo máy chủ.

***Lưu ý nhỏ ban đầu:** Dù có $200 từ Github, DigitalOcean vẫn yêu cầu bạn thực hiện **Xác minh chủ thể (Verification)** bằng cách nạp $5 qua PayPal (số tiền này cộng thẳng vào tài khoản của bạn để tiêu) HOẶC nhập 1 thẻ Visa/Mastercard (Debit cũng được, họ sẽ trừ 1$ rồi hoàn lại ngay lập tức) để chống tạo tài khoản ảo.*

---

## Bước 1: Kích hoạt Credit $200 trên DigitalOcean
1. Truy cập vào trang [GitHub Student Developer Pack - DigitalOcean](https://education.github.com/pack/offers). Cuộn tìm logo con cá đuối (DigitalOcean).
2. Lấy cái mã Code khuyến mãi (hoặc click vào link có sẵn).
3. Đăng ký tài khoản DigitalOcean mới tinh bằng link đó.
4. Tiến hành rào cản Payment Verify (Bằng thẻ hoặc nạp $5 PayPal).
5. Bạn nhìn trên góc phải màn hình của DigitalOcean thấy chữ **"$200 Credit"** là đã thành công!

---

## Bước 2: Tạo Droplet (Máy chủ ảo)
1. Ở màn hình Dashboard của DigitalOcean, bấm nút xanh **Create** (trên cùng góc phải) -> Chọn **Droplets**.
2. **Cấu hình Droplet:**
   - **Region (Vùng)**: Chọn `Singapore` (để kết nối về VN nhanh nhất).
   - **Image (HĐH)**: Chọn `Ubuntu` (khuyên dùng bản 22.04 LTS hoặc 24.04).
   - **Size (Độ lớn)**: Chọn dòng `Basic` -> Kéo xuống chọn gói **Premium Intel / Regular** có cấu hình **4GB RAM - 2 CPU** (Giá khoảng 24$/tháng) hoặc **8GB RAM - 4 CPU** (Giá 48$/tháng). (*Hãy chọn gói bự để chạy 15+ container cho mượt, vì đằng nào mình cũng xài free từ $200 tín dụng, sau khi bảo vệ đồ án xong xóa đi là xong.*).
   - **Authentication**: Nhấn vào tab `Password` và gõ một mật khẩu thật mạnh (Hãy nhớ mật khẩu này). Tên Root User mặc định luôn là `root`.
   - Bấm **Create Droplet**.
3. Đợi khoảng 1 phút, con Máy chủ sẽ chạy xong. Copy dòng **IPv4 Address** (Ví dụ: `167.x.x.x`).

---

## Bước 3: Cài đặt Docker và Chạy Đồ Án
1. Bật Terminal (Powershell) trên máy cá nhân lên và gõ lệnh kết nối:
```bash
ssh root@<IP_CUA_BAN>
# Gõ yes nếu nó lần đầu hỏi fingerprint, sau đó nhập password ở Bước 2.
```

2. Cài đặt toàn bộ công cụ Docker (Nắm dán dòng này Enter phát là xong):
```bash
# Cập nhật OS
apt update && apt upgrade -y

# Cài đặt git, curl
apt install git curl -y

# Cài đặt nhanh Docker bằng Shell chính chủ
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Sinh Docker Compose Plugin (để có thể chạy lệnh docker compose)
mkdir -p ~/.docker/cli-plugins/
curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose
```

3. Kéo Source Code về & Triển khai toàn bộ:
```bash
git clone https://github.com/hanguyenviet7704/finance_individual.git
cd finance_individual

# Kéo cả 15+ con máy gánh Microservices lên (nên đợi nó mất tầm 5-10 phút để tải và start đủ mọi component).
docker compose up -d --build
```

---

## Bước 4: Tận hưởng kết quả
Mọi Port (cổng) trên DigitalOcean đều public một cách cực kỳ rông mở. Không cần cấu hình Network Rule phiền phức như Azure/GCP.
Bạn chỉ cần lấy IP của Droplet đó gõ vào thanh địa chỉ kèm Port:
- **Trang chủ Website:** `http://<IP_CUA_BAN>:3000`
- **Nơi API gọi vào Frontend (ngầm):** `http://<IP_CUA_BAN>:8080/api/v1/...`

Chúc bạn đem bài báo cáo lên hội đồng giám khảo thành công vang dội!
