# Hướng dẫn Triển khai (Deployment) Finance Platform trên Microsoft Azure (Gói Sinh Viên)

Tuyệt vời! Nếu bạn sở hữu email Giáo dục (`@stu.ptit.edu.vn`), **Azure for Students** là lựa chọn xịn sò nhất. Microsoft sẽ cấp ngay **$100 Credit** vào tài khoản mà **KHÔNG CẦN add thẻ Visa/Mastercard**, triệt tiêu hoàn toàn rủi ro bị trừ cọc như Google Cloud.

Với $100 này, hệ thống của bạn (15+ docker containers) sẽ được "bê nguyên xi" lên chạy cực êm trên 1 con Máy Chủ Ảo (Azure Virtual Machine) để chuẩn bị cho buổi bảo vệ đồ án.

---

## Bước 1: Kích hoạt gói Azure cho Sinh Viên
1. Truy cập trang đăng ký chính thức: [Azure for Students](https://azure.microsoft.com/en-us/free/students/).
2. Nhấn nút **Activate Now**.
3. Đăng nhập hoặc tạo tài khoản Microsoft bằng email PTIT của bạn (`xxxxx@stu.ptit.edu.vn`).
4. Điền số điện thoại để xác thực OTP. 
5. Cứ bấm đồng ý, bạn sẽ được tự động chuyển vào **Azure Portal** có sẵn $100 để xài thả ga.

---

## Bước 2: Tạo Máy Chủ Ảo (Virtual Machine) chịu tải nặng
Vì hệ thống chạy 5 Java Apps + 4 MySQL + Kafka + Frontend sẽ tốn rất nhiều RAM, bạn hãy tạo một con Server đủ khoẻ. Đừng lo về giá, nó trừ vào $100 Free kia, và chạy đồ án vài tuần không thể ăn hết được!

1. Tại Azure Portal, ô Search trên cùng tìm chữ **"Virtual machines"** -> Bấm **Create > Azure virtual machine**.
2. **Cấu hình Cơ Bản (Basics):**
   - *Subscription*: Chắc chắn rằng đang chọn `Azure for Students`.
   - *Resource Group*: Bấm `Create new` và đặt tên (Vd: `finance-rg`).
   - *Virtual machine name*: Đặt tên máy (Vd: `finance-server`).
   - *Region*: Nên chọn `Southeast Asia` (Singapore) để Web load về Việt Nam nhanh nhất.
   - *Image*: Chọn **Ubuntu Server 22.04 LTS**.
   - *Size/Cấu hình*: Bấm `See all sizes`, chọn dòng **`Standard_B4ms`** (4 vCPUs, 16GB RAM). Con này chạy là trùm sò nhất cho mức Credit sinh viên.
3. **Cấu hình Đăng nhập (Administrator account):**
   - Loại bảo mật: Để dễ thao tác, bạn nên tick vào `Password`.
   - Username: Nhập tên user bất kỳ (vd: `azureuser`).
   - Password: Đặt mật khẩu đủ mạnh và **phải nhớ kỹ**.
4. **Mở Cổng Mạng (Inbound port rules):**
   - Ở mục *Public inbound ports*, chọn `Allow selected ports`.
   - Tick chọn các cổng: `HTTP (80)`, `HTTPS (443)`, và `SSH (22)`. (Tý nữa vào trong mình sẽ mở thêm port 3000 cho Frontend).
5. Cuối cùng, lướt thẳng xuống cuối màn hình bấm nút xanh **Review + create** -> đợi nó Valid -> Bấm **Create**.

*⏳ Đợi khoảng 2-3 phút, Azure sẽ build xong máy. Bấm nút "Go to resource". Ở màn hình hiện ra, Copy lại địa chỉ IP (chỗ ghi **Public IP address**).*

---

## Bước 3: Cài đặt Môi trường & Chạy Source Code
Bây giờ, mở Terminal (hoặc Powershell) trực tiếp trên máy tính cá nhân của bạn để điều khiển server kia:

**1. Remote vào Server:**
```bash
# Thay IP_CUA_BAN bằng dải số Public IP bạn vừa copy. Vd: 20.30.40.50
ssh azureuser@IP_CUA_BAN
```
*(Gõ chữ `yes` và nhập Password bạn đặt ở Bước 2).*

**2. Cài đặt Docker & Docker Compose lên máy Azure để chay:**
Dán trực tiếp đống lệnh sau vào Terminal của Azure:
```bash
sudo apt update -y
sudo apt install docker.io -y
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
mkdir -p ~/.docker/cli-plugins/
curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose
```

**3. Clone mã nguồn đồ án này & Chạy:**
```bash
git clone https://github.com/hanguyenviet7704/finance_individual.git
cd finance_individual
docker compose up -d --build
```

---

## Bước 4: Mở Cổng Tường Lửa cho Web
Theo mặc định, cổng 3000 (React Web) và cổng 8080 (API Gateway) bị khoá. Trên Web của Azure Portal, bạn làm như sau:
1. Vào mục `Networking` (bên menu cột trái của Virtual Machine).
2. Click **Add inbound port rule**.
3. Tại ô `Destination port ranges`: nhập `3000,8080` (Mở port cho FE và BE).
4. Ô `Priority`: Gõ 100 
5. Bấm **Add**.

🎉 **XONG TRỌN GÓI!** Bây giờ ngay lập tức bạn mở Chrome lên và gõ `http://IP_CUA_BAN:3000` — Bạn đã Deploy thành công đồ án xịn sò siêu bự ra môi trường Internet dưới dạng Cloud VM thực thụ để giảng viên chấm thi! Không thể chê vào đâu được!
