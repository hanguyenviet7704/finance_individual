// ==================== AUTH ====================
export interface LoginRequest {
  account_number: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  accountType: 'SAVING' | 'CHECKING'
}

export interface RegisterResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: string
  account_number: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: string
}

export interface User {
  id: string
  userId: string
  email: string
  roles: string[]
  account_number: string
}

// ==================== ACCOUNT ====================
export type AccountType   = 'SAVING' | 'CHECKING' | 'LOAN'
export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED'
export type KycStatus     = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'

export interface Account {
  id: string
  userId: string
  accountNumber: string
  accountType: AccountType
  balance: number
  availableBalance: number
  currency: string
  status: AccountStatus
  dailyLimit: number
  dailyUsed: number
  kycStatus: KycStatus
  fullName: string
  email: string
  phone: string
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  accountType: AccountType
  fullName: string
  email: string
  phone: string
  currency?: string
}

// ==================== TRANSACTION ====================
export type TransactionType   = 'TRANSFER' | 'TOPUP' | 'WITHDRAW' | 'PAYMENT' | 'REFUND'
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REVERSED'
export type FraudDecision     = 'ALLOW' | 'REVIEW' | 'BLOCK'

export interface Transaction {
  id: string
  referenceNo: string
  fromAccountId: string
  toAccountId: string
  amount: number
  fee: number
  currency: string
  type: TransactionType
  status: TransactionStatus
  description: string
  category?: string
  fraudDecision: FraudDecision | null
  otpRequired: boolean
  createdAt: string
  completedAt: string | null
}

export interface TransferRequest {
  fromAccountId: string
  toAccountId: string
  amount: number
  description?: string
  category?: string
  deviceId?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// ==================== LOAN ====================
export type LoanType   = 'PERSONAL' | 'VEHICLE' | 'MORTGAGE' | 'BUSINESS' | 'EDUCATION'
export type LoanStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED'

export interface RepaymentInstallment {
  installmentNo: number
  dueDate: string
  principal: number
  interest: number
  total: number
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  paidAt: string | null
}

export interface LoanDocument {
  type: string
  fileId: string
  fileName: string
  status: string
  rejectionReason: string | null
}

export interface Loan {
  id: string
  loanCode: string
  userId: string
  status: LoanStatus
  loanType: LoanType
  requestedAmount: number
  approvedAmount: number | null
  interestRate: number | null
  termMonths: number
  purpose: string
  creditScore: number
  creditGrade: string
  repaymentSchedule: RepaymentInstallment[] | null
  documents: LoanDocument[] | null
  createdAt: string
  approvedAt: string | null
}

export interface ApplyLoanRequest {
  loanType: LoanType
  amount: number
  termMonths: number
  purpose?: string
}

// ==================== REPORT ====================
export interface StatementEntry {
  id: string
  transactionId: string
  accountId: string
  direction: 'DEBIT' | 'CREDIT'
  referenceNo: string
  amount: number
  currency: string
  type: string
  category?: string
  status: string
  description: string
  transactionDate: string
}

export interface MonthlySummary {
  accountId: string
  year: number
  month: number
  totalDebit: number
  totalCredit: number
  netChange: number
  transactionCount: number
}

// ==================== AUDIT ====================
export interface AuditLog {
  id: string
  timestamp: string
  serviceName: string
  action: string
  actorId: string
  actorType: string
  resourceId: string
  resourceType: string
  result: string
  traceId: string
}

// ==================== FRAUD ====================
export interface FraudHistory {
  id: string
  transactionId: string
  userId: string
  amount: number
  totalScore: number
  decision: FraudDecision
  triggeredRules: string[]
  ipAddress: string
  createdAt: string
}
