# Hướng dẫn Triển khai (Deployment) Finance Platform trên Google Cloud Platform (GCP)

Hệ thống Finance Microservices của bạn hiện tại đang đóng gói toàn bộ qua `docker-compose` (bao gồm 8+ Services, 4x MySQL, MongoDB, Redis, Kafka, Zookeeper, API Gateway, và Frontend React). Dựa trên kiến trúc này, bạn có 3 lựa chọn triển khai từ cấu hình cơ bản nhất (Lift-and-Shift) đến đám mây tối ưu (Cloud-Native).

---

## Lựa chọn 1: Máy chủ ảo VM (Google Compute Engine - GCE)
*Lựa chọn này bê nguyên xi môi trường Local của bạn đưa lên Cloud.*

- **Độ khó**: Thấp (Dễ nhất).
- **Chi phí**: Tương đối (Trả theo giờ bật máy).
- **Cách thực hiện**:
  1. Tạo 1 **Compute Engine VM Instance** (khuyên dùng cấu hình `e2-standard-4` hoặc `e2-standard-8` (4-8 vCPU, 16-32GB RAM) vì hệ thống bạn rất nặng với nhiều database).
  2. Chọn HDH: **Ubuntu 22.04 / 24.04**.
  3. Mở Firewall (VPC Network) cho phép Ingress các port `80`, `443`, và port `3000` (hoặc `8080`).
  4. SSH vào VM, cài đặt `Docker` và `Git`.
  5. Clone source code dự án về và chạy lệnh: `docker compose up -d --build`.
- **Phù hợp cho**: Đồ án môn học, thử nghiệm UAT, cần demo gấp cho phía Giảng Viên / Đối tác.

---

## Lựa chọn 2: Kiến trúc Hiện đại (Cloud Run + Managed Databases)
*Lựa chọn này phân rẽ Database và Source code ra riêng, tự động gia giảm tài nguyên (Scale to 0) khi không có request.*

- **Độ khó**: Trung bình
- **Chi phí**: Tối ưu (Đặc biệt cho backend).
- **Cách thực hiện**:
  1. **[Tầng Dữ liệu]**
     - Dùng **Google Cloud SQL** để host chung các DB MySQL (`account`, `loan`, `stock`, `fraud`, `payment`).
     - Dùng **Google Memorystore** cho Caching Redis.
     - Dùng **MongoDB Atlas** (chọn cụm trên rãnh GCP) cho các Document Datastore.
  2. **[Tầng Messaging]**
     - Thuê 1 VM e2-micro chạy riêng Kafka, hoặc dùng dịch vụ *Confluent Cloud*.
  3. **[Tầng Ứng dụng]**
     - Setup **Google Artifact Registry** giữ Image Docker cho 8 Services.
     - Deploy từng Image lên **Google Cloud Run**. Khi đó API Gateway hay Frontend sẽ được cấp 1 tên miền `https` riêng biệt tự động (`finance-gateway-xxx.run.app`).
- **Phù hợp cho**: Production thực tế, hệ thống ít dùng về đêm sẽ tự tối ưu phí.

---

## Lựa chọn 3: Tự động hoá hoàn toàn (Google Kubernetes Engine - GKE)
*Lựa chọn này dành cho các đội phát triển chuyên nghiệp, đáp ứng tải lớn nhất.*

- **Độ khó**: Rất cao.
- **Chi phí**: Cao.
- **Cách thực hiện**:
  1. Yêu cầu viết lại toàn bộ `docker-compose.yml` thành các file **Kubernetes Manifests** (Deployment, Service, Ingress, PersistentVolume, StatefulSet cho DB).
  2. Tạo 1 Cluster **GKE Autopilot**.
  3. Apply các file yaml vào Cụm để Kubernetes tự điều phối 15+ containers của bạn sang nhiều Node máy chủ khác nhau nhằm tránh quá tải cục bộ.
- **Phù hợp cho**: Bảo vệ đồ án mang tính chuyên môn Cloud nâng cao, Hệ thống Doanh nghiệp lớn.

---

## 💡 Đề xuất bắt đầu:
Chặng đường suôn sẻ nhất là đi từ **GCE (Virtual Machine)** trước. Mọi thứ đã có sẵn `docker-compose` hoạt động hoàn hảo nên bạn sẽ lên sóng nền tảng này trong vòng chưa tới 15 phút.
