import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/api/axios'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatVND, formatDateTime } from '@/utils/format'
import type { Transaction, PageResponse } from '@/types'

const statusVariant = (s: string) => {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
    COMPLETED: 'success', FAILED: 'danger', CANCELLED: 'danger',
    PENDING: 'warning', PROCESSING: 'info', REVERSED: 'default',
  }
  return map[s] ?? 'default'
}

const fraudVariant = (d: string | null) => {
  if (!d) return null
  return d === 'BLOCK' ? 'danger' : d === 'REVIEW' ? 'warning' : 'success'
}

export function AdminTransactionsPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', page],
    queryFn: () =>
      api.get<PageResponse<Transaction>>(`/payments/admin/all?page=${page}&size=20&sort=createdAt,desc`)
        .then(r => r.data),
  })

  const statuses = ['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'CANCELLED']

  const filtered = (data?.content ?? []).filter(tx => {
    if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false
    if (search && !tx.referenceNo?.includes(search) &&
        !tx.fromAccountId?.includes(search) && !tx.toAccountId?.includes(search)) return false
    return true
  })

  const totalAmount = (data?.content ?? [])
    .filter(t => t.status === 'COMPLETED')
    .reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý giao dịch</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tổng {data?.totalElements ?? 0} giao dịch — Hoàn thành: {formatVND(totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">
          <ArrowLeftRight className="w-4 h-4" />
          {data?.totalElements ?? 0} giao dịch
        </div>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Tìm theo Mã GD, Account ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'ALL' ? 'Tất cả' : s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 uppercase bg-gray-50">
                    <th className="px-4 py-3 text-left">Mã GD</th>
                    <th className="px-4 py-3 text-left">Từ → Đến</th>
                    <th className="px-4 py-3 text-right">Số tiền</th>
                    <th className="px-4 py-3 text-left">Loại</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-left">Fraud</th>
                    <th className="px-4 py-3 text-left">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                        Không có giao dịch nào
                      </td>
                    </tr>
                  ) : filtered.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-medium text-gray-900">{tx.referenceNo}</p>
                        <p className="font-mono text-xs text-gray-400">{tx.id?.substring(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-gray-600">{tx.fromAccountId?.substring(0, 8)}...</p>
                        <p className="font-mono text-xs text-gray-400">→ {tx.toAccountId?.substring(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-bold text-gray-900">{formatVND(tx.amount)}</p>
                        {tx.fee > 0 && (
                          <p className="text-xs text-gray-400">Phí: {formatVND(tx.fee)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(tx.status)} className="text-xs">
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {tx.fraudDecision ? (
                          <Badge variant={fraudVariant(tx.fraudDecision)!} className="text-xs">
                            {tx.fraudDecision}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Trang {page + 1}/{data.totalPages} — {data.totalElements} giao dịch
                </p>
                <div className="flex gap-2">
                  <button
                    className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    disabled={data.first}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    disabled={data.last}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
