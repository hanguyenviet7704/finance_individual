import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Search, CheckCircle, XCircle } from 'lucide-react'
import api from '@/api/axios'
import { Card } from '@/components/ui/Card'
import { formatDateTime } from '@/utils/format'
import type { AuditLog, PageResponse } from '@/types'

const serviceColors: Record<string, string> = {
  'payment-service':      'bg-blue-100 text-blue-700',
  'account-service':      'bg-green-100 text-green-700',
  'fraud-service':        'bg-red-100 text-red-700',
  'loan-service':         'bg-purple-100 text-purple-700',
  'notification-service': 'bg-yellow-100 text-yellow-700',
}

export function AuditPage() {
  const [search, setSearch]   = useState('')
  const [service, setService] = useState('ALL')
  const [page, setPage]       = useState(0)

  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const to   = new Date().toISOString()

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', service, page],
    queryFn: () => {
      const url = service !== 'ALL'
        ? `/audit/service/${service}?from=${from}&to=${to}&page=${page}&size=20`
        : `/audit?page=${page}&size=20&sort=timestamp,desc`
      return api.get<PageResponse<AuditLog>>(url).then(r => r.data)
    },
    retry: 1,
  })

  const services = ['ALL', 'payment-service', 'account-service', 'fraud-service', 'loan-service', 'notification-service']

  const filtered = (data?.content ?? []).filter(log =>
    !search ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.actorId?.toLowerCase().includes(search.toLowerCase()) ||
    log.resourceId?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Nhật ký kiểm toán toàn hệ thống</p>
      </div>

      <Card padding={false}>
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Tìm theo action, actor ID, resource ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {services.map(s => (
              <button
                key={s}
                onClick={() => { setService(s); setPage(0) }}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  service === s
                    ? 'bg-primary-600 text-white'
                    : (serviceColors[s] ?? 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
              >
                {s === 'ALL' ? 'Tất cả' : s.replace('-service', '')}
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
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-gray-500 uppercase bg-gray-50">
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-left">Service</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Actor</th>
                  <th className="px-4 py-3 text-left">Resource</th>
                  <th className="px-4 py-3 text-left">Kết quả</th>
                  <th className="px-4 py-3 text-left">Trace ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-400 text-sm">Không có log nào</p>
                    </td>
                  </tr>
                ) : filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${serviceColors[log.serviceName] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.serviceName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-medium text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-gray-700">{log.actorId?.substring(0, 12)}...</p>
                      <p className="text-xs text-gray-400">{log.actorType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-gray-700">{log.resourceId?.substring(0, 12)}...</p>
                      <p className="text-xs text-gray-400">{log.resourceType}</p>
                    </td>
                    <td className="px-4 py-3">
                      {log.result === 'SUCCESS' ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" /> Thành công
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="w-3 h-3" /> Thất bại
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-400">
                        {log.traceId?.substring(0, 8)}...
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Trang {page + 1}/{data.totalPages} — {data.totalElements} records
                </p>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40"
                    disabled={data.first}
                    onClick={() => setPage(p => p - 1)}
                  >Trước</button>
                  <button
                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40"
                    disabled={data.last}
                    onClick={() => setPage(p => p + 1)}
                  >Sau</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
