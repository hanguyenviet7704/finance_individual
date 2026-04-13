import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert, ShieldCheck, ShieldX, Search } from 'lucide-react'
import api from '@/api/axios'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatVND, formatDateTime } from '@/utils/format'
import type { FraudHistory, PageResponse } from '@/types'

function DecisionBadge({ decision }: { decision: string }) {
  const map = {
    BLOCK:  { cls: 'bg-red-100 text-red-700',    icon: ShieldX,     label: 'Chặn' },
    REVIEW: { cls: 'bg-yellow-100 text-yellow-700', icon: ShieldAlert, label: 'Xem xét' },
    ALLOW:  { cls: 'bg-green-100 text-green-700', icon: ShieldCheck,  label: 'Cho phép' },
  }
  const cfg = map[decision as keyof typeof map] ?? map.ALLOW
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-red-500' : score >= 40 ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium w-6 text-right">{score}</span>
    </div>
  )
}

export function FraudPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'BLOCK' | 'REVIEW' | 'ALLOW'>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['fraud-history', filter],
    queryFn: () => api.get<PageResponse<FraudHistory>>('/fraud/history', {
      params: { size: 50 }
    }).then(r => r.data),
    retry: 1,
  })

  const stats = {
    total:  data?.content.length ?? 0,
    block:  data?.content.filter(f => f.decision === 'BLOCK').length  ?? 0,
    review: data?.content.filter(f => f.decision === 'REVIEW').length ?? 0,
    allow:  data?.content.filter(f => f.decision === 'ALLOW').length  ?? 0,
  }

  const filtered = (data?.content ?? []).filter(f => {
    if (filter !== 'ALL' && f.decision !== filter) return false
    if (search && !f.transactionId.includes(search) && !f.userId.includes(search)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fraud Detection</h1>
        <p className="text-gray-500 text-sm mt-1">Theo dõi và phân tích giao dịch đáng ngờ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng phân tích', value: stats.total,  color: 'bg-gray-50 text-gray-700' },
          { label: 'Bị chặn',        value: stats.block,   color: 'bg-red-50 text-red-600' },
          { label: 'Cần xem xét',    value: stats.review,  color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Cho phép',       value: stats.allow,   color: 'bg-green-50 text-green-600' },
        ].map(({ label, value, color }) => (
          <Card key={label} className={`text-center ${color}`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Tìm theo User ID, Transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {(['ALL','BLOCK','REVIEW','ALLOW'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 uppercase bg-gray-50">
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-left">Transaction ID</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-left w-32">Risk Score</th>
                <th className="px-4 py-3 text-left">Quyết định</th>
                <th className="px-4 py-3 text-left">Rules kích hoạt</th>
                <th className="px-4 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Không có dữ liệu</td></tr>
              ) : filtered.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(f.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-700">{f.transactionId?.substring(0, 16)}...</p>
                    <p className="font-mono text-xs text-gray-400">{f.userId?.substring(0, 16)}...</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{formatVND(f.amount)}</td>
                  <td className="px-4 py-3 w-32"><RiskBar score={Number(f.totalScore ?? 0)} /></td>
                  <td className="px-4 py-3"><DecisionBadge decision={f.decision} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(f.triggeredRules) ? f.triggeredRules : []).slice(0, 2).map((r: string) => (
                        <span key={r} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{r}</span>
                      ))}
                      {(Array.isArray(f.triggeredRules) ? f.triggeredRules : []).length > 2 && (
                        <span className="text-xs text-gray-400">+{f.triggeredRules.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{f.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
