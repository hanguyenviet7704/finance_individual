import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Download, FileText, Calendar } from 'lucide-react'
import { format, subMonths, startOfMonth } from 'date-fns'
import { reportApi } from '@/api/reportApi'
import { accountApi } from '@/api/accountApi'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatVND, formatDateTime } from '@/utils/format'
import type { StatementEntry } from '@/types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const txTypeLabels: Record<string, string> = {
  TRANSFER: 'Chuyển tiền',
  TOPUP:    'Nạp tiền',
  WITHDRAW: 'Rút tiền',
  PAYMENT:  'Thanh toán',
  REFUND:   'Hoàn tiền',
}

export function ReportPage() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: account } = useQuery({
    queryKey: ['my-account'],
    queryFn: accountApi.getMyAccount,
  })

  const fromDate = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd'T'HH:mm:ss")
  const toDate   = format(new Date(year, month, 0, 23, 59, 59),    "yyyy-MM-dd'T'HH:mm:ss")

  const { data: statement, isLoading: stmtLoading } = useQuery({
    queryKey: ['statement', account?.id, year, month],
    queryFn: () => reportApi.getStatement(account!.id, fromDate, toDate, 0, 100),
    enabled: !!account?.id,
  })

  const { data: summary } = useQuery({
    queryKey: ['monthly-summary', account?.id, year, month],
    queryFn: () => reportApi.getMonthlySummary(account!.id, year, month),
    enabled: !!account?.id,
  })

  // Dữ liệu 6 tháng cho bar chart
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(year, month - 1), 5 - i)
    return { month: format(d, 'MM/yy'), y: d.getFullYear(), m: d.getMonth() + 1 }
  })

  const { data: summaries } = useQuery({
    queryKey: ['summaries-6m', account?.id, year, month],
    queryFn: async () => {
      if (!account?.id) return []
      return Promise.all(
        last6Months.map(({ y, m }) =>
          reportApi.getMonthlySummary(account.id, y, m).catch(() => null)
        )
      )
    },
    enabled: !!account?.id,
  })

  const barData = last6Months.map((d, i) => ({
    month: d.month,
    Chi:   summaries?.[i]?.totalDebit  ?? 0,
    Thu:   summaries?.[i]?.totalCredit ?? 0,
  }))

  // Pie chart data: phân loại theo category hoặc type
  const byCategory = (statement?.content ?? []).reduce<Record<string, number>>((acc, tx) => {
    // Only group DEBIT transactions for expenses parsing, or just all. The user cares about expenses.
    // If we only want expenses: if (tx.direction !== 'DEBIT') return acc;
    // But currently it groups everything. Let's continue grouping everything or group by category if it's there
    const groupKey = tx.direction === 'DEBIT' ? (tx.category || txTypeLabels[tx.type] || tx.type) : 'Thu nhập';
    acc[groupKey] = (acc[groupKey] ?? 0) + tx.amount
    return acc
  }, {})
  const pieData = Object.entries(byCategory).map(([name, value]) => ({
    name, value
  }))

  const exportCSV = () => {
    const rows = [
      ['Ngày', 'Mã GD', 'Loại', 'Hướng', 'Số tiền', 'Trạng thái'],
      ...(statement?.content ?? []).map(tx => [
        formatDateTime(tx.transactionDate),
        tx.referenceNo,
        tx.type,
        tx.direction,
        tx.amount,
        tx.status,
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sao-ke-${year}-${String(month).padStart(2,'0')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Sao kê</h1>
          <p className="text-gray-500 text-sm mt-1">Phân tích giao dịch và xuất báo cáo</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4" /> Xuất CSV
        </Button>
      </div>

      {/* Month selector */}
      <Card>
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex gap-3">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {summary && (
            <div className="flex gap-6 ml-auto text-sm">
              <div>
                <span className="text-gray-500">Tổng chi: </span>
                <span className="font-semibold text-red-500">{formatVND(summary.totalDebit)}</span>
              </div>
              <div>
                <span className="text-gray-500">Tổng thu: </span>
                <span className="font-semibold text-green-600">{formatVND(summary.totalCredit)}</span>
              </div>
              <div>
                <span className="text-gray-500">Số dư ròng: </span>
                <span className={`font-semibold ${summary.netChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {summary.netChange >= 0 ? '+' : ''}{formatVND(summary.netChange)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Thu chi 6 tháng gần đây</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => formatVND(v)} />
              <Legend />
              <Bar dataKey="Thu" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="Chi" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader><CardTitle>Phân loại giao dịch tháng này</CardTitle></CardHeader>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              Không có dữ liệu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatVND(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Statement table */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">
            Sao kê tháng {month}/{year}
            {statement && <span className="text-gray-400 font-normal ml-1">({statement.totalElements} giao dịch)</span>}
          </h3>
        </div>

        {stmtLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 uppercase bg-gray-50">
                <th className="px-4 py-3 text-left">Ngày</th>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!statement?.content.length ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Không có giao dịch trong tháng này</td></tr>
              ) : statement.content.map((tx: StatementEntry) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(tx.transactionDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{tx.description || tx.referenceNo}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{tx.category || txTypeLabels[tx.type] || tx.type}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold text-sm ${tx.direction === 'DEBIT' ? 'text-red-500' : 'text-green-600'}`}>
                      {tx.direction === 'DEBIT' ? '-' : '+'}{formatVND(tx.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
