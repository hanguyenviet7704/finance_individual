#!/bin/bash
# =============================================================================
# deploy-gke.sh — Script deploy Finance Platform lên Google Kubernetes Engine
# Chạy script này trên máy cá nhân của bạn
# Yêu cầu: gcloud CLI đã cài, docker, kubectl
# =============================================================================

set -e   # Dừng ngay nếu có lỗi

# ---- CẤU HÌNH — Bạn chỉ cần sửa 2 dòng này ----
PROJECT_ID="YOUR_GCP_PROJECT_ID"        # Paste Project ID từ GCP Console vào đây
CLUSTER_ZONE="asia-southeast1-a"        # Có thể đổi sang us-central1-a nếu cần
# -----------------------------------------------

CLUSTER_NAME="finance-cluster"
REGISTRY="gcr.io/$PROJECT_ID"

echo "==> [1/6] Đăng nhập GCP & cấu hình dự án"
gcloud auth login
gcloud config set project $PROJECT_ID
gcloud auth configure-docker

echo "==> [2/6] Tạo GKE Cluster (Standard, 2 nodes e2-standard-4)"
gcloud container clusters create $CLUSTER_NAME \
  --zone=$CLUSTER_ZONE \
  --num-nodes=2 \
  --machine-type=e2-standard-4 \
  --disk-size=50GB \
  --enable-autoscaling --min-nodes=1 --max-nodes=4

echo "==> [3/6] Lấy credentials kubectl"
gcloud container clusters get-credentials $CLUSTER_NAME --zone=$CLUSTER_ZONE

echo "==> [4/6] Build & Push tất cả Docker Images lên Google Container Registry"

SERVICES=(
  "eureka-server:services/eureka-server"
  "api-gateway:gateway"
  "account-service:services/account-service"
  "payment-service:services/payment-service"
  "fraud-service:services/fraud-service"
  "loan-service:services/loan-service"
  "notification-service:services/notification-service"
  "report-service:services/report-service"
  "audit-service:services/audit-service"
  "stock-service:services/stock-service"
  "frontend:frontend"
)

for entry in "${SERVICES[@]}"; do
  SERVICE_NAME="${entry%%:*}"
  BUILD_CONTEXT="${entry##*:}"
  IMAGE="$REGISTRY/finance-$SERVICE_NAME:latest"
  echo "  Building $SERVICE_NAME from ./$BUILD_CONTEXT ..."
  docker build -t "$IMAGE" "./$BUILD_CONTEXT"
  docker push "$IMAGE"
done

echo "==> [5/6] Apply tất cả Kubernetes Manifests"
# Cập nhật image tag trong manifest trước khi apply
sed -i "s|finance-eureka-server:latest|$REGISTRY/finance-eureka-server:latest|g"       k8s/05-eureka-gateway.yaml
sed -i "s|finance-api-gateway:latest|$REGISTRY/finance-api-gateway:latest|g"           k8s/05-eureka-gateway.yaml
sed -i "s|finance-account-service:latest|$REGISTRY/finance-account-service:latest|g"   k8s/06-services.yaml
sed -i "s|finance-payment-service:latest|$REGISTRY/finance-payment-service:latest|g"   k8s/06-services.yaml
sed -i "s|finance-fraud-service:latest|$REGISTRY/finance-fraud-service:latest|g"       k8s/06-services.yaml
sed -i "s|finance-loan-service:latest|$REGISTRY/finance-loan-service:latest|g"         k8s/06-services.yaml
sed -i "s|finance-notification-service:latest|$REGISTRY/finance-notification-service:latest|g" k8s/06-services.yaml
sed -i "s|finance-report-service:latest|$REGISTRY/finance-report-service:latest|g"     k8s/06-services.yaml
sed -i "s|finance-audit-service:latest|$REGISTRY/finance-audit-service:latest|g"       k8s/06-services.yaml
sed -i "s|finance-stock-service:latest|$REGISTRY/finance-stock-service:latest|g"       k8s/06-services.yaml
sed -i "s|finance-frontend:latest|$REGISTRY/finance-frontend:latest|g"                 k8s/07-frontend.yaml

kubectl apply -f k8s/

echo "==> [6/6] Đang chờ External IP của Frontend & Gateway..."
echo "    (Có thể mất 2-3 phút để GCP cấp IP)"
kubectl get svc -n finance --watch &
WATCH_PID=$!
sleep 60
kill $WATCH_PID 2>/dev/null || true

echo ""
echo "=============================================="
echo " DEPLOY HOÀN TẤT!"
echo " Chạy lệnh dưới để lấy IP truy cập:"
echo " kubectl get svc -n finance"
echo "=============================================="
