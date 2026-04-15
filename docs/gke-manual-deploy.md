# Hướng dẫn Deploy GKE Thủ Công (Không dùng Script)

Tài liệu này hướng dẫn bạn từng lệnh một, copy-paste thủ công vào Terminal để triển khai Finance Platform lên **Google Kubernetes Engine (GKE)**.

---

## Yêu Cầu Cài Đặt Trước

Cài tất cả công cụ này trên máy cá nhân của bạn trước:

| Công cụ | Link |
|---|---|
| **gcloud CLI** | https://cloud.google.com/sdk/docs/install |
| **kubectl** | `gcloud components install kubectl` |
| **Docker Desktop** | https://www.docker.com/products/docker-desktop |

---

## Phần 1: Chuẩn bị GCP

### Bước 1 — Đăng nhập GCP
```bash
gcloud auth login
gcloud auth configure-docker
```

### Bước 2 — Chọn Project
```bash
# Thay finance-493401 bằng Project ID thật của bạn (thấy trên GCP Console)
gcloud config set project finance-493401
```

### Bước 3 — Bật các APIs cần thiết
```bash
gcloud services enable container.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

---

## Phần 2: Tạo GKE Cluster

### Bước 4 — Tạo Cluster
```bash
gcloud container clusters create finance-cluster \
  --zone=asia-southeast1-a \
  --num-nodes=2 \
  --machine-type=e2-standard-4 \
  --disk-size=50GB
```
> ⏳ Lệnh này mất khoảng **5-7 phút**. Đợi nó chạy xong mới làm bước tiếp!

### Bước 5 — Kết nối kubectl tới Cluster vừa tạo
```bash
gcloud container clusters get-credentials finance-cluster \
  --zone=asia-southeast1-a
```

### Bước 6 — Kiểm tra kết nối
```bash
kubectl get nodes
# Phải thấy 2 Node đang ở trạng thái "Ready"
```

---

## Phần 3: Build & Push Docker Images

> Phải build từng image một và push lên **Google Container Registry (GCR)**.
> Thay `finance-493401` bằng Project ID thật của bạn trong **ALL** lệnh dưới đây.

```bash
# Di chuyển vào thư mục gốc của dự án
cd C:\TaiLieu\TaiLieuPTIT\TaiLieuKy2Nam4\MonPTPMThayHung\finace\Finance
```

### Build & Push từng Service:

**Eureka Server:**
```bash
docker build -t gcr.io/finance-493401/finance-eureka-server:latest ./services/eureka-server
docker push gcr.io/finance-493401/finance-eureka-server:latest
```

**API Gateway:**
```bash
docker build -t gcr.io/finance-493401/finance-api-gateway:latest ./gateway
docker push gcr.io/finance-493401/finance-api-gateway:latest
```

**Account Service:**
```bash
docker build -t gcr.io/finance-493401/finance-account-service:latest ./services/account-service
docker push gcr.io/finance-493401/finance-account-service:latest
```

**Payment Service:**
```bash
docker build -t gcr.io/finance-493401/finance-payment-service:latest ./services/payment-service
docker push gcr.io/finance-493401/finance-payment-service:latest
```

**Fraud Service:**
```bash
docker build -t gcr.io/finance-493401/finance-fraud-service:latest ./services/fraud-service
docker push gcr.io/finance-493401/finance-fraud-service:latest
```

**Loan Service:**
```bash
docker build -t gcr.io/finance-493401/finance-loan-service:latest ./services/loan-service
docker push gcr.io/finance-493401/finance-loan-service:latest
```

**Notification Service:**
```bash
docker build -t gcr.io/finance-493401/finance-notification-service:latest ./services/notification-service
docker push gcr.io/finance-493401/finance-notification-service:latest
```

**Report Service:**
```bash
docker build -t gcr.io/finance-493401/finance-report-service:latest ./services/report-service
docker push gcr.io/finance-493401/finance-report-service:latest
```

**Audit Service:**
```bash
docker build -t gcr.io/finance-493401/finance-audit-service:latest ./services/audit-service
docker push gcr.io/finance-493401/finance-audit-service:latest
```

**Stock Service:**
```bash
docker build -t gcr.io/finance-493401/finance-stock-service:latest ./services/stock-service
docker push gcr.io/finance-493401/finance-stock-service:latest
```

**Frontend:**
```bash
docker build -t gcr.io/finance-493401/finance-frontend:latest ./frontend
docker push gcr.io/finance-493401/finance-frontend:latest
```

---

## Phần 4: Cập nhật Image trong file K8s

Sau khi push xong, bạn cần update tên image trong các file yaml. Mở file `k8s/05-eureka-gateway.yaml` và `k8s/06-services.yaml`, `k8s/07-frontend.yaml`.

Thay tất cả dòng `image: finance-xxx:latest` thành `image: gcr.io/finance-493401/finance-xxx:latest`.

Ví dụ:
```yaml
# Trước
image: finance-account-service:latest

# Sau
image: gcr.io/finance-493401/finance-account-service:latest
```

---

## Phần 5: Apply Manifests lên Kubernetes

Apply **theo đúng thứ tự** từng file một:

### Bước 7 — Tạo Namespace
```bash
kubectl apply -f k8s/00-namespace.yaml
```

### Bước 8 — Tạo ConfigMap và Secrets
```bash
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml
```

### Bước 9 — Triển khai Databases (MySQL, Mongo, Redis, Kafka)
```bash
kubectl apply -f k8s/03-mysql.yaml
kubectl apply -f k8s/04-infra.yaml
```

> ⏳ Đợi databases khởi động (~2 phút):
```bash
kubectl get pods -n finance --watch
# Ctrl+C khi thấy tất cả READY
```

### Bước 10 — Triển khai Eureka và API Gateway
```bash
kubectl apply -f k8s/05-eureka-gateway.yaml
```

### Bước 11 — Triển khai tất cả Microservices
```bash
kubectl apply -f k8s/06-services.yaml
```

### Bước 12 — Triển khai Frontend
```bash
kubectl apply -f k8s/07-frontend.yaml
```

---

## Phần 6: Kiểm tra & Truy cập

### Xem trạng thái tất cả Pods
```bash
kubectl get pods -n finance
# Tất cả phải ở trạng thái Running
```

### Lấy External IP để truy cập
```bash
kubectl get svc -n finance
# Tìm EXTERNAL-IP của "frontend" và "api-gateway"
# Chờ vài phút nếu còn thấy <pending>
```

### Truy cập ứng dụng
- **Frontend:** `http://<EXTERNAL-IP-của-frontend>`
- **API:** `http://<EXTERNAL-IP-của-api-gateway>/api/v1/...`

---

## Debug Khi Có Lỗi

```bash
# Xem log của 1 pod cụ thể
kubectl logs -n finance <tên-pod> --tail=100

# Xem chi tiết tại sao pod bị lỗi
kubectl describe pod -n finance <tên-pod>

# Xem tất cả events trong namespace
kubectl get events -n finance --sort-by='.lastTimestamp'

# Liệt kê tên pod đang chạy
kubectl get pods -n finance
```
