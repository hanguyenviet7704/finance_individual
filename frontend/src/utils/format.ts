/** Format số tiền VND */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount)
}

/** Format ngày giờ */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

/** Format ngày */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(dateStr))
}

/** Rút gọn UUID */
export function shortId(id: string): string {
  return id ? id.substring(0, 8).toUpperCase() : '—'
}

/** Format số tài khoản dạng: FIN *** *** 123 */
export function maskAccountNumber(num: string): string {
  if (!num || num.length < 6) return num
  return num.slice(0, 3) + ' *** *** ' + num.slice(-3)
}

/** Màu badge theo transaction status */
export function txStatusColor(status: string): string {
  const map: Record<string, string> = {
    COMPLETED:  'bg-green-100 text-green-700',
    PENDING:    'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    FAILED:     'bg-red-100 text-red-700',
    CANCELLED:  'bg-gray-100 text-gray-600',
    REVERSED:   'bg-orange-100 text-orange-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

/** Màu badge theo loan status */
export function loanStatusColor(status: string): string {
  const map: Record<string, string> = {
    APPROVED:    'bg-green-100 text-green-700',
    PENDING:     'bg-yellow-100 text-yellow-700',
    UNDER_REVIEW:'bg-blue-100 text-blue-700',
    REJECTED:    'bg-red-100 text-red-700',
    DISBURSED:   'bg-purple-100 text-purple-700',
    ACTIVE:      'bg-emerald-100 text-emerald-700',
    COMPLETED:   'bg-gray-100 text-gray-600',
    DEFAULTED:   'bg-red-200 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}
