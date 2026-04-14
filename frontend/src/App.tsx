import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout }      from '@/components/layout/AppLayout'
import { LoginPage }           from '@/pages/LoginPage'
import { RegisterPage }        from '@/pages/RegisterPage'
import { DashboardPage }       from '@/pages/DashboardPage'
import { ProfilePage }         from '@/pages/ProfilePage'
import { NotificationsPage }   from '@/pages/NotificationsPage'
import { AccountPage }    from '@/pages/AccountPage'
import { PaymentPage }    from '@/pages/PaymentPage'
import { LoanPage }       from '@/pages/LoanPage'
import { ReportPage }     from '@/pages/ReportPage'
import { FraudPage }             from '@/pages/admin/FraudPage'
import { AuditPage }             from '@/pages/admin/AuditPage'
import { AdminAccountsPage }     from '@/pages/admin/AdminAccountsPage'
import { AdminTransactionsPage } from '@/pages/admin/AdminTransactionsPage'
import { StockPage }             from '@/pages/StockPage'
import { AdminStocksPage }       from '@/pages/admin/AdminStocksPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  60_000,      // 1 phút
      gcTime:     300_000,     // 5 phút
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/"           element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/account"    element={<AccountPage />} />
              <Route path="/payment"    element={<PaymentPage />} />
              <Route path="/loan"       element={<LoanPage />} />
              <Route path="/report"         element={<ReportPage />} />
              <Route path="/stock"          element={<StockPage />} />
              <Route path="/profile"        element={<ProfilePage />} />
              <Route path="/notifications"  element={<NotificationsPage />} />
              <Route path="/admin/fraud"         element={<FraudPage />} />
              <Route path="/admin/audit"         element={<AuditPage />} />
              <Route path="/admin/accounts"      element={<AdminAccountsPage />} />
              <Route path="/admin/transactions"  element={<AdminTransactionsPage />} />
              <Route path="/admin/stocks"        element={<AdminStocksPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}
