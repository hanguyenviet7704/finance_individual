import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Lock, Unlock, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatVND, formatDateTime } from '@/utils/format'
import type { Account, PageResponse } from '@/types'

const statusVariant = (s: string) =>
  s === 'ACTIVE' ? 'success' : s === 'FROZEN' ? 'danger' : 'default'

export function AdminAccountsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-accounts', page],
    queryFn: () =>
      api.get<PageResponse<Account>>(`/accounts?page=${page}&size=15&sort=createdAt,desc`)
        .then(r => r.data),
  })

  const freezeMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/accounts/${id}/freeze`, null, { params: { reason: 'Admin action' } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-accounts'] })
      toast.success('Đã khóa tài khoản')
    },
    onError: () => toast.error('Không thể khóa tài khoản'),
  })

  const unfreezeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/accounts/${id}/unfreeze`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-accounts'] })
      toast.success('Đã mở khóa tài khoản')
    },
    onError: () => toast.error('Không thể mở khóa tài khoản'),
  })

  const filtered = (data?.content ?? []).filter(a =>
    !search ||
    a.accountNumber.includes(search) ||
    a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  )

  const totalBalance = (data?.content ?? []).reduce((s, a) => s + Number(a.balance), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tổng cộng {data?.totalElements ?? 0} tài khoản — Tổng số dư: {formatVND(totalBalance)}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">
          <Users className="w-4 h-4" />
          {data?.totalElements ?? 0} tài khoản
        </div>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Tìm theo số tài khoản, tên, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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
                    <th className="px-4 py-3 text-left">Tài khoản</th>
                    <th className="px-4 py-3 text-left">Chủ tài khoản</th>
                    <th className="px-4 py-3 text-right">Số dư</th>
                    <th className="px-4 py-3 text-left">Loại</th>
                    <th className="px-4 py-3 text-left">KYC</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-left">Ngày tạo</th>
                    <th className="px-4 py-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-400 text-sm">
                        Không có tài khoản nào
                      </td>
                    </tr>
                  ) : filtered.map(acc => (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-mono text-sm font-medium text-gray-900">{acc.accountNumber}</p>
                        <p className="text-xs text-gray-400 font-mono">{acc.id?.substring(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{acc.fullName}</p>
                        <p className="text-xs text-gray-400">{acc.email}</p>
                        <p className="text-xs text-gray-400">{acc.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-bold text-gray-900">{formatVND(acc.balance)}</p>
                        <p className="text-xs text-gray-400">Khả dụng: {formatVND(acc.availableBalance)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          {acc.accountType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={acc.kycStatus === 'VERIFIED' ? 'success' : acc.kycStatus === 'REJECTED' ? 'danger' : 'warning'}
                          className="text-xs"
                        >
                          {acc.kycStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(acc.status)} className="text-xs">
                          {acc.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(acc.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {acc.status === 'FROZEN' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => unfreezeMutation.mutate(acc.id)}
                            loading={unfreezeMutation.isPending}
                          >
                            <Unlock className="w-3 h-3" /> Mở
                          </Button>
                        ) : acc.status === 'ACTIVE' ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              if (confirm(`Khóa tài khoản ${acc.accountNumber}?`))
                                freezeMutation.mutate(acc.id)
                            }}
                            loading={freezeMutation.isPending}
                          >
                            <Lock className="w-3 h-3" /> Khóa
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">Đã đóng</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Trang {page + 1}/{data.totalPages} — {data.totalElements} tài khoản
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
