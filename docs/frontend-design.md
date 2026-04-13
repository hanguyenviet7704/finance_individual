# Frontend Design — Finance Web Application

Tài liệu mô tả thiết kế và kiến trúc của ứng dụng web React cho hệ thống Finance.

---

## Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Framework | React 18.3 + TypeScript |
| Build tool | Vite |
| Styling | TailwindCSS |
| State management | Zustand + localStorage persistence |
| Data fetching | Axios + TanStack React Query |
| Routing | React Router DOM |
| Form | React Hook Form + Zod validation |
| Charts | Recharts |
| UI Primitives | Radix UI (Dialog, Dropdown, Select, Tabs, Avatar) |
| Icons | Lucide React |
| Utilities | date-fns, clsx, tailwind-merge, react-hot-toast, react-number-format |
| Deployment | Nginx (serve static files + reverse proxy) |
| Port | 3000 |

---

## Cấu trúc thư mục

```
frontend/src/
├── api/                        # Lớp giao tiếp API
│   ├── axios.ts                # Axios instance đã cấu hình
│   ├── authApi.ts              # Endpoints xác thực
│   ├── accountApi.ts           # Endpoints tài khoản
│   ├── paymentApi.ts           # Endpoints giao dịch
│   ├── loanApi.ts              # Endpoints khoản vay
│   └── reportApi.ts            # Endpoints báo cáo
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       # Layout wrapper chính
│   │   ├── ProtectedRoute.tsx  # Route bảo vệ — kiểm tra auth
│   │   └── Sidebar.tsx         # Thanh điều hướng bên trái
│   └── ui/                     # Thư viện UI tái sử dụng
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Select.tsx
│
├── pages/                      # Các trang
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── AccountPage.tsx
│   ├── PaymentPage.tsx
│   ├── LoanPage.tsx
│   ├── ReportPage.tsx
│   └── admin/
│       ├── AdminAccountsPage.tsx
│       ├── AdminTransactionsPage.tsx
│       ├── AuditPage.tsx
│       └── FraudPage.tsx
│
├── store/
│   └── authStore.ts            # Zustand store xác thực
│
├── types/
│   └── index.ts                # TypeScript type definitions
│
├── utils/                      # Hàm tiện ích
├── App.tsx                     # Root component + Router config
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

---

## Routing

```
/                   → Redirect → /dashboard (nếu đã đăng nhập) hoặc /login
/login              → LoginPage (public)
/dashboard          → DashboardPage (protected)
/account            → AccountPage (protected)
/payment            → PaymentPage (protected)
/loan               → LoanPage (protected)
/report             → ReportPage (protected)
/admin/accounts     → AdminAccountsPage (protected + ADMIN)
/admin/transactions → AdminTransactionsPage (protected + ADMIN)
/admin/audit        → AuditPage (protected + ADMIN)
/admin/fraud        → FraudPage (protected + ADMIN)
```

**ProtectedRoute** kiểm tra `authStore.isAuthenticated`. Nếu chưa đăng nhập → redirect `/login`.

---

## Các trang (Pages)

### 1. LoginPage

**Mục đích:** Đăng nhập bằng số tài khoản + mật khẩu.

**Tính năng:**
- Form đăng nhập với React Hook Form + Zod validation
- Hiển thị demo credentials để tiện test
- Lưu JWT token vào Zustand store (persist localStorage)
- Redirect sang `/dashboard` sau khi đăng nhập thành công

**Fields:**
- `account_number` — số tài khoản (FIN + 13 chữ số)
- `password` — mật khẩu

---

### 2. DashboardPage

**Mục đích:** Tổng quan tài khoản và hoạt động gần đây.

**Tính năng:**
- Hiển thị số dư tài khoản (balance, available balance)
- Thống kê thu/chi tháng hiện tại (totalCredit, totalDebit, netChange)
- Biểu đồ cột (bar chart) giao dịch theo tháng — dùng Recharts
- Danh sách giao dịch gần nhất (5 giao dịch)
- Quick actions: Chuyển tiền, Vay vốn, Xem báo cáo

**Data fetching:**
- `GET /api/v1/accounts/me`
- `GET /api/v1/reports/summary/monthly`
- `GET /api/v1/payments/history?accountId=...&size=5`

---

### 3. AccountPage

**Mục đích:** Xem và quản lý thông tin tài khoản.

**Tính năng:**
- Hiển thị đầy đủ thông tin tài khoản (số tài khoản, loại, số dư, trạng thái KYC)
- Cập nhật hạn mức giao dịch hàng ngày
- Đóng băng / Mở đóng băng tài khoản (chỉ Admin)
- Trạng thái KYC với badge màu

**Data fetching:**
- `GET /api/v1/accounts/me`
- `PUT /api/v1/accounts/{id}/limits`
- `POST /api/v1/accounts/{id}/freeze`
- `POST /api/v1/accounts/{id}/unfreeze`

---

### 4. PaymentPage

**Mục đích:** Thực hiện và theo dõi giao dịch chuyển tiền.

**Tính năng:**
- Form chuyển tiền với validation (số tiền tối thiểu 1,000 VND, UUID hợp lệ)
- Auto-generate `Idempotency-Key` (UUID) mỗi lần submit form
- Modal xác nhận OTP khi giao dịch trả về 202
- Lịch sử giao dịch phân trang với filter theo trạng thái
- Badge màu theo TransactionStatus và FraudDecision
- Format số tiền theo locale VN (react-number-format)

**Data fetching:**
- `POST /api/v1/payments/transfer`
- `POST /api/v1/payments/{id}/confirm` (OTP)
- `GET /api/v1/payments/history`

---

### 5. LoanPage

**Mục đích:** Đăng ký vay và theo dõi khoản vay.

**Tính năng:**
- Hiển thị điểm tín dụng dạng gauge (vòng tròn) với màu theo hạng
- Form đăng ký vay (loại vay, số tiền, thời hạn, mục đích)
- Danh sách khoản vay hiện tại với badge trạng thái
- Modal xem lịch trả nợ chi tiết (accordion từng kỳ)
- Hiển thị tài liệu đính kèm hồ sơ vay

**Data fetching:**
- `GET /api/v1/loans/score/{userId}`
- `GET /api/v1/loans`
- `POST /api/v1/loans/apply`
- `GET /api/v1/loans/{id}` (chi tiết + lịch trả nợ)

---

### 6. ReportPage

**Mục đích:** Xem sao kê và báo cáo tài chính.

**Tính năng:**
- Bộ lọc theo khoảng thời gian (date range picker)
- Sao kê giao dịch phân trang với badge DEBIT/CREDIT
- Biểu đồ tròn (pie chart) tỷ lệ thu/chi
- Biểu đồ cột thu chi theo ngày trong tháng
- Thống kê tháng: tổng thu, tổng chi, chênh lệch
- Nút export CSV

**Data fetching:**
- `GET /api/v1/reports/statement`
- `GET /api/v1/reports/summary/monthly`

---

### 7. AdminAccountsPage (Admin)

**Mục đích:** Quản lý tất cả tài khoản trong hệ thống.

**Tính năng:**
- Bảng danh sách tài khoản với phân trang và search
- Filter theo trạng thái (ACTIVE / FROZEN / CLOSED)
- Nút Freeze / Unfreeze từng tài khoản
- Xem chi tiết tài khoản trong modal

**Data fetching:**
- `GET /api/v1/accounts`
- `POST /api/v1/accounts/{id}/freeze`
- `POST /api/v1/accounts/{id}/unfreeze`

---

### 8. AdminTransactionsPage (Admin)

**Mục đích:** Giám sát toàn bộ giao dịch.

**Tính năng:**
- Bảng tất cả giao dịch phân trang
- Filter theo status (COMPLETED / FAILED / PROCESSING...)
- Filter theo fraud decision (ALLOW / REVIEW / BLOCK)
- Hiển thị fraud score với màu cảnh báo

**Data fetching:**
- `GET /api/v1/payments/admin/all`

---

### 9. AuditPage (Admin)

**Mục đích:** Tra cứu nhật ký kiểm toán hệ thống.

**Tính năng:**
- Bảng audit log phân trang (mới nhất trước)
- Filter theo service (payment-service, fraud-service...)
- Search theo actorId hoặc resourceId
- Hiển thị oldValue / newValue dạng JSON formatted

**Data fetching:**
- `GET /api/v1/audit`
- `GET /api/v1/audit/service/{serviceName}`

---

### 10. FraudPage (Admin)

**Mục đích:** Xem kết quả phân tích gian lận.

**Tính năng:**
- Bảng fraud history phân trang
- Hiển thị fraud score với thanh tiến trình màu
- Badge quyết định: ALLOW (xanh) / REVIEW (vàng) / BLOCK (đỏ)
- Danh sách triggered rules dạng chip
- Lọc theo decision

**Data fetching:**
- `GET /api/v1/fraud/history`

---

## State Management (Zustand)

### authStore

```typescript
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  user: {
    id: string
    email: string
    roles: string[]
    account_number: string
  } | null

  setTokens(accessToken: string, refreshToken: string): void
  logout(): void
}
```

**Persistence:** Zustand persist middleware → `localStorage` key: `auth-storage`

**JWT Decoding:** `setTokens()` tự động decode JWT payload để lấy user info (id, email, roles, account_number) mà không cần gọi API thêm.

---

## API Layer (Axios)

### axios.ts — Instance chính

```typescript
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000
})

// Request interceptor
api.interceptors.request.use(config => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  // Auto-generate Idempotency-Key cho payment transfer
  if (config.url?.includes('/payments/transfer') && config.method === 'post') {
    config.headers['Idempotency-Key'] = crypto.randomUUID()
  }
  return config
})

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### API Clients

| File | Methods |
|------|---------|
| `authApi.ts` | `login(req)`, `logout()` |
| `accountApi.ts` | `getMyAccount()`, `getAccount(id)`, `getBalance(id)`, `createAccount(req)`, `updateLimits(id, req)`, `freezeAccount(id, reason)`, `unfreezeAccount(id)` |
| `paymentApi.ts` | `transfer(req)`, `getTransaction(id)`, `getHistory(accountId, page)`, `confirmOtp(id, otp)`, `cancelTransaction(id)` |
| `loanApi.ts` | `applyLoan(req)`, `getLoan(id)`, `getMyLoans(page)`, `getCreditScore(userId)` |
| `reportApi.ts` | `getStatement(accountId, from, to, page)`, `getMonthlySummary(accountId, year, month)` |

---

## Type Definitions

### Enums chính

```typescript
enum AccountType { SAVING = 'SAVING', CHECKING = 'CHECKING', LOAN = 'LOAN' }
enum AccountStatus { ACTIVE = 'ACTIVE', FROZEN = 'FROZEN', CLOSED = 'CLOSED' }
enum KycStatus { PENDING, SUBMITTED, VERIFIED, REJECTED }
enum TransactionType { TRANSFER, TOPUP, WITHDRAW, PAYMENT, REFUND }
enum TransactionStatus { PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REVERSED }
enum FraudDecision { ALLOW = 'ALLOW', REVIEW = 'REVIEW', BLOCK = 'BLOCK' }
enum LoanType { PERSONAL, VEHICLE, MORTGAGE, BUSINESS, EDUCATION }
enum LoanStatus { PENDING, UNDER_REVIEW, APPROVED, REJECTED, DISBURSED, ACTIVE, COMPLETED, DEFAULTED }
```

### Interfaces chính

```typescript
interface Account {
  id: string; userId: string; accountNumber: string
  accountType: AccountType; balance: number; availableBalance: number
  currency: string; status: AccountStatus; dailyLimit: number; dailyUsed: number
  kycStatus: KycStatus; fullName: string; email: string; phone: string
  createdAt: string; updatedAt: string
}

interface Transaction {
  id: string; referenceNo: string
  fromAccountId: string; toAccountId: string
  amount: number; fee: number; currency: string
  type: TransactionType; status: TransactionStatus
  description: string; fraudDecision: FraudDecision
  otpRequired: boolean; createdAt: string; completedAt: string | null
}

interface Loan {
  id: string; loanCode: string; userId: string
  status: LoanStatus; loanType: LoanType
  requestedAmount: number; approvedAmount: number | null
  interestRate: number | null; termMonths: number
  creditScore: number; creditGrade: string
  repaymentSchedule: RepaymentInstallment[]
  createdAt: string; approvedAt: string | null
}

interface PageResponse<T> {
  content: T[]; totalElements: number
  totalPages: number; size: number; number: number
}
```

---

## UI Components

### Badge

```tsx
<Badge variant="success">COMPLETED</Badge>
<Badge variant="warning">REVIEW</Badge>
<Badge variant="danger">BLOCK</Badge>
<Badge variant="info">PROCESSING</Badge>
```

Variants: `success` (xanh), `warning` (vàng), `danger` (đỏ), `info` (xanh dương), `default` (xám)

### Button

```tsx
<Button variant="primary" loading={isSubmitting}>Chuyển tiền</Button>
<Button variant="danger" size="sm">Đóng băng</Button>
```

Variants: `primary`, `secondary`, `danger`, `ghost`

### Modal

```tsx
<Modal isOpen={showOtp} title="Xác nhận OTP" onClose={() => setShowOtp(false)}>
  <Input label="Mã OTP" placeholder="6 chữ số" />
  <Button onClick={handleConfirm}>Xác nhận</Button>
</Modal>
```

### Card

```tsx
<Card>
  <Card.Header>Số dư tài khoản</Card.Header>
  <Card.Body>1,500,000 VND</Card.Body>
</Card>
```

---

## Nginx Config (Production)

```nginx
server {
    listen 3000;

    # Serve React static files
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — all routes → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy API calls → API Gateway
    location /api/ {
        proxy_pass http://api-gateway:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Màu sắc & Thiết kế

Hệ thống Finance dùng TailwindCSS với bảng màu nhất quán:

| Ý nghĩa | Màu Tailwind | Hex |
|---------|-------------|-----|
| Primary / Brand | `blue-600` | #2563EB |
| Success / Active | `green-500` | #22C55E |
| Warning / Review | `yellow-500` | #EAB308 |
| Danger / Block | `red-500` | #EF4444 |
| Info / Processing | `sky-500` | #0EA5E9 |
| Neutral / Default | `gray-400` | #9CA3AF |
| Background | `gray-50` | #F9FAFB |
| Sidebar | `gray-900` | #111827 |

---

## Luồng người dùng chính

### Luồng chuyển tiền

```
DashboardPage
  → Click "Chuyển tiền"
  → PaymentPage
  → Điền form (fromAccount, toAccount, amount, description)
  → Submit → POST /payments/transfer
  │
  ├── 201 COMPLETED → Toast "Giao dịch thành công" → Refresh history
  │
  └── 202 PROCESSING → Modal OTP
        → Nhập OTP
        → POST /payments/{id}/confirm
        └── 200 → Toast "Giao dịch thành công"
```

### Luồng đăng ký vay

```
LoanPage
  → Xem Credit Score (gauge)
  → Click "Đăng ký vay"
  → Form (loanType, amount, termMonths, purpose)
  → Submit → POST /loans/apply
  → Toast "Đơn vay đã nộp thành công"
  → Refresh danh sách khoản vay
  → Theo dõi trạng thái: PENDING → UNDER_REVIEW → APPROVED
```

---

## Button → API Mapping (Mỗi nút gọi API nào)

> Xem wireframe màn hình chi tiết tại: [`docs/system-design.md`](system-design.md)

### 1. LoginPage (`/login`)

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| Nút **Đăng nhập** | `onClick` / `onSubmit` form | `/api/v1/auth/login` | `POST` | Body: `{account_number, password}` → lưu tokens vào Zustand store |
| Form submit | `Enter` | `/api/v1/auth/login` | `POST` | Tương tự nút đăng nhập |

---

### 2. DashboardPage (`/dashboard`)

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Page load** | `useEffect` | `/api/v1/accounts/me` | `GET` | Lấy thông tin tài khoản và số dư |
| **Page load** | `useEffect` | `/api/v1/reports/summary/monthly` | `GET` | Params: `accountId, year, month` hiện tại |
| **Page load** | `useEffect` | `/api/v1/payments/history` | `GET` | Params: `accountId, size=5` — 5 giao dịch gần nhất |
| Nút **Chuyển tiền** | `onClick` | — | — | Navigate sang `/payment` |
| Nút **Vay vốn** | `onClick` | — | — | Navigate sang `/loan` |
| Nút **Xem báo cáo** | `onClick` | — | — | Navigate sang `/report` |
| Link **Xem tất cả** (giao dịch) | `onClick` | — | — | Navigate sang `/payment` tab Lịch sử |

---

### 3. AccountPage (`/account`)

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Page load** | `useEffect` | `/api/v1/accounts/me` | `GET` | Hiển thị toàn bộ thông tin tài khoản |
| Nút **Lưu hạn mức** | `onClick` | `/api/v1/accounts/{id}/limits` | `PUT` | Body: `{dailyLimit}` — validate min 100,000 VND |
| Nút **🔒 Đóng băng** | `onClick` | — | — | Mở Modal xác nhận (nhập lý do) |
| Modal → Nút **Xác nhận đóng băng** | `onClick` | `/api/v1/accounts/{id}/freeze` | `POST` | Query: `?reason=...` → refresh trang |
| Nút **🔓 Mở đóng băng** | `onClick` | `/api/v1/accounts/{id}/unfreeze` | `POST` | Confirm dialog → gọi API → refresh |

---

### 4. PaymentPage (`/payment`)

#### Tab: Chuyển tiền

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Tab load** | `useEffect` | `/api/v1/accounts/me` | `GET` | Lấy `fromAccountId` và số dư hiện tại |
| Nút **💸 Chuyển tiền ngay** | `onSubmit` form | `/api/v1/payments/transfer` | `POST` | Header: `Idempotency-Key` (UUID tự sinh); Body: `{fromAccountId, toAccountId, amount, description, deviceId}` |
| → Response `201` | — | — | — | Toast ✅ "Giao dịch thành công" → reset form → refetch history |
| → Response `202` | — | — | — | Mở **Modal OTP** |
| Modal OTP → Nút **Xác nhận** | `onClick` | `/api/v1/payments/{id}/confirm` | `POST` | Body: `{otp}` → Toast ✅ → đóng modal → refetch |
| Modal OTP → Nút **Hủy giao dịch** | `onClick` | `/api/v1/payments/{id}/cancel` | `POST` | Toast ⚠ "Giao dịch đã hủy" → đóng modal |

#### Tab: Lịch sử giao dịch

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Tab load** | `useEffect` | `/api/v1/payments/history` | `GET` | Params: `accountId, page=0, size=20` |
| Dropdown **Filter trạng thái** | `onChange` | `/api/v1/payments/history` | `GET` | Refetch với filter mới |
| Nút **[← Trước] / [Sau →]** | `onClick` | `/api/v1/payments/history` | `GET` | Params: `page` thay đổi |
| Nút **Hủy** (trên từng row) | `onClick` | `/api/v1/payments/{id}/cancel` | `POST` | Chỉ hiện khi status = PENDING/PROCESSING |

---

### 5. LoanPage (`/loan`)

#### Tab: Tổng quan

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Tab load** | `useEffect` | `/api/v1/loans/score/{userId}` | `GET` | `userId` từ Zustand authStore |

#### Tab: Đăng ký vay

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| Nút **🏦 Nộp đơn vay** | `onSubmit` | `/api/v1/loans/apply` | `POST` | Header: `X-Account-ID`; Body: `{loanType, amount, termMonths, purpose}` |
| → Response `201` | — | — | — | Toast ✅ "Đơn vay đã nộp" → chuyển sang tab "Khoản vay của tôi" |
| → Response `422 CREDIT_SCORE_INSUFFICIENT` | — | — | — | Toast ❌ "Điểm tín dụng không đủ (< 400)" |

#### Tab: Khoản vay của tôi

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Tab load** | `useEffect` | `/api/v1/loans` | `GET` | Header: `X-User-ID` từ Gateway |
| Nút **Xem lịch trả nợ →** | `onClick` | `/api/v1/loans/{id}` | `GET` | Lấy full response bao gồm `repaymentSchedule` → mở Modal |

---

### 6. ReportPage (`/report`)

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Page load** | `useEffect` | `/api/v1/reports/summary/monthly` | `GET` | Params: `accountId, year, month` tháng hiện tại |
| Nút **Xem sao kê** | `onClick` | `/api/v1/reports/statement` | `GET` | Params: `accountId, from, to, page=0, size=20` |
| Dropdown **Khoảng thời gian** thay đổi | `onChange` | `/api/v1/reports/summary/monthly` | `GET` | Refetch summary theo tháng mới |
| Nút **[← Trước] / [Sau →]** | `onClick` | `/api/v1/reports/statement` | `GET` | Params: `page` thay đổi |
| Nút **Export CSV ↓** | `onClick` | — | — | Client-side: convert `content` array → file CSV → download |

---

### 7. AdminAccountsPage (`/admin/accounts`)

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Page load** | `useEffect` | `/api/v1/accounts` | `GET` | Params: `page=0, size=20` |
| Input **Tìm kiếm** | `onChange` (debounce 300ms) | `/api/v1/accounts` | `GET` | Params: search query |
| Dropdown **Trạng thái** | `onChange` | `/api/v1/accounts` | `GET` | Refetch với filter status |
| Nút **[← Trước] / [Sau →]** | `onClick` | `/api/v1/accounts` | `GET` | Params: `page` |
| Icon **🔒 Đóng băng** | `onClick` | — | — | Mở Modal xác nhận (nhập lý do) |
| Modal → Nút **Xác nhận** | `onClick` | `/api/v1/accounts/{id}/freeze` | `POST` | Query: `?reason=...` → refetch bảng |
| Icon **🔓 Mở đóng băng** | `onClick` | `/api/v1/accounts/{id}/unfreeze` | `POST` | Confirm dialog → gọi API → refetch |
| Icon **👁 Xem** | `onClick` | `/api/v1/accounts/{id}` | `GET` | Mở Modal chi tiết tài khoản |

---

### 8. AdminTransactionsPage (`/admin/transactions`)

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Page load** | `useEffect` | `/api/v1/payments/admin/all` | `GET` | Params: `page=0, size=20` — yêu cầu role ADMIN |
| Dropdown **Trạng thái** | `onChange` | `/api/v1/payments/admin/all` | `GET` | Refetch với filter status |
| Dropdown **Fraud Decision** | `onChange` | `/api/v1/payments/admin/all` | `GET` | Refetch với filter fraudDecision |
| Nút **[← Trước] / [Sau →]** | `onClick` | `/api/v1/payments/admin/all` | `GET` | Params: `page` |
| Click vào **row giao dịch** | `onClick` | `/api/v1/payments/{id}` | `GET` | Mở Modal chi tiết giao dịch |

---

### 9. AuditPage (`/admin/audit`)

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Page load** | `useEffect` | `/api/v1/audit` | `GET` | Params: `page=0, size=20, sort=timestamp,desc` |
| Dropdown **Service** | `onChange` | `/api/v1/audit/service/{serviceName}` | `GET` | Params: `from, to` (mặc định 24h qua) |
| Input **Actor ID** | `onSearch` | `/api/v1/audit/actor/{actorId}` | `GET` | |
| Input **Resource ID** | `onSearch` | `/api/v1/audit/resource/{resourceId}` | `GET` | |
| Nút **[← Trước] / [Sau →]** | `onClick` | (endpoint hiện tại) | `GET` | Params: `page` |
| Click vào **row log** | `onClick` | — | — | Expand row tại chỗ — hiện oldValue / newValue |

---

### 10. FraudPage (`/admin/fraud`)

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| **Page load** | `useEffect` | `/api/v1/fraud/history` | `GET` | Params: `page=0, size=20` |
| Dropdown **Quyết định** | `onChange` | `/api/v1/fraud/history` | `GET` | Refetch với filter decision |
| Nút **[← Trước] / [Sau →]** | `onClick` | `/api/v1/fraud/history` | `GET` | Params: `page` |
| Click vào **row** | `onClick` | `/api/v1/fraud/history/{transactionId}` | `GET` | Expand chi tiết — hiện từng rule score |

---

### Sidebar & Layout (mọi trang)

| Element | Sự kiện | API Call | Method | Ghi chú |
|---------|---------|----------|--------|---------|
| Nút **Logout** (góc phải) | `onClick` | `/api/v1/auth/logout` | `POST` | Sau đó: clear Zustand store → clear localStorage → redirect `/login` |
| Avatar / Tên user | render | — | — | Đọc từ `authStore.user` (không gọi API) |
