import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, ChevronDown, ChevronUp, TrendingUp, FileText, Calculator } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { loanApi } from '@/api/loanApi'
import { accountApi } from '@/api/accountApi'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatVND, formatDate, loanStatusColor } from '@/utils/format'
import type { Loan, LoanType } from '@/types'

const applySchema = z.object({
  loanType:   z.enum(['PERSONAL','VEHICLE','MORTGAGE','BUSINESS','EDUCATION']),
  amount:     z.coerce.number().min(1_000_000, 'Tối thiểu 1.000.000 VND'),
  termMonths: z.coerce.number().min(3).max(360),
  purpose:    z.string().optional(),
})
type ApplyForm = z.infer<typeof applySchema>

const loanTypeLabels: Record<LoanType, string> = {
  PERSONAL:  'Vay cá nhân',
  VEHICLE:   'Mua xe',
  MORTGAGE:  'Mua nhà',
  BUSINESS:  'Kinh doanh',
  EDUCATION: 'Học tập',
}

function CreditScoreGauge({ score }: { score: number }) {
  const pct = ((score - 300) / 550) * 100
  const color = score >= 700 ? 'text-green-600' : score >= 550 ? 'text-yellow-600' : 'text-red-500'
  const grade = score >= 750 ? 'A+' : score >= 700 ? 'A' : score >= 650 ? 'B+' : score >= 600 ? 'B' : 'C'
  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f0f0" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={score >= 700 ? '#10b981' : score >= 550 ? '#f59e0b' : '#ef4444'}
            strokeWidth="10"
            strokeDasharray={`${pct * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <p className={`text-xl font-bold ${color}`}>{score}</p>
          <p className="text-xs text-gray-500">{grade}</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">Credit Score</p>
    </div>
  )
}

function LoanCard({ loan }: { loan: Loan }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{loan.loanCode}</p>
            <p className="text-xs text-gray-500">{loanTypeLabels[loan.loanType]} • {loan.termMonths} tháng</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-semibold text-gray-900">{formatVND(loan.requestedAmount)}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${loanStatusColor(loan.status)}`}>
              {loan.status}
            </span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
          {/* Loan details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Số tiền yêu cầu</p>
              <p className="font-medium">{formatVND(loan.requestedAmount)}</p>
            </div>
            {loan.approvedAmount && (
              <div>
                <p className="text-gray-500">Số tiền duyệt</p>
                <p className="font-medium text-green-600">{formatVND(loan.approvedAmount)}</p>
              </div>
            )}
            {loan.interestRate && (
              <div>
                <p className="text-gray-500">Lãi suất</p>
                <p className="font-medium">{loan.interestRate}%/tháng</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Credit Score</p>
              <p className="font-medium">{loan.creditScore} ({loan.creditGrade})</p>
            </div>
            <div>
              <p className="text-gray-500">Ngày nộp</p>
              <p className="font-medium">{formatDate(loan.createdAt)}</p>
            </div>
            {loan.approvedAt && (
              <div>
                <p className="text-gray-500">Ngày duyệt</p>
                <p className="font-medium">{formatDate(loan.approvedAt)}</p>
              </div>
            )}
          </div>

          {/* Repayment schedule */}
          {loan.repaymentSchedule && loan.repaymentSchedule.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Lịch trả nợ (3 kỳ đầu)</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pb-1">Kỳ</th>
                    <th className="text-right pb-1">Gốc</th>
                    <th className="text-right pb-1">Lãi</th>
                    <th className="text-right pb-1">Tổng</th>
                    <th className="text-right pb-1">Ngày đến hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loan.repaymentSchedule.slice(0, 3).map((inst) => (
                    <tr key={inst.installmentNo}>
                      <td className="py-1">Kỳ {inst.installmentNo}</td>
                      <td className="text-right py-1">{formatVND(inst.principal)}</td>
                      <td className="text-right py-1 text-red-500">{formatVND(inst.interest)}</td>
                      <td className="text-right py-1 font-medium">{formatVND(inst.total)}</td>
                      <td className="text-right py-1 text-gray-500">{formatDate(inst.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loan.repaymentSchedule.length > 3 && (
                <p className="text-xs text-gray-400 mt-1">... và {loan.repaymentSchedule.length - 3} kỳ còn lại</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Máy tính lãi vay ──────────────────────────────────────────
function LoanCalculator() {
  const [amount,   setAmount]   = useState(100_000_000)
  const [term,     setTerm]     = useState(12)
  const [rate,     setRate]     = useState(0.85)          // %/tháng

  const monthly = useMemo(() => {
    const r = rate / 100
    if (r === 0) return amount / term
    return (amount * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1)
  }, [amount, term, rate])

  const totalPay     = monthly * term
  const totalInterest = totalPay - amount

  const chartData = useMemo(() => {
    let balance = amount
    const r = rate / 100
    return Array.from({ length: Math.min(term, 24) }, (_, i) => {
      const interest  = balance * r
      const principal = monthly - interest
      balance -= principal
      return {
        month: `T${i + 1}`,
        principal: Math.round(principal / 1000),
        interest:  Math.round(interest  / 1000),
      }
    })
  }, [amount, term, rate, monthly])

  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inputs */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary-700" /> Thông số khoản vay
          </h3>
          <div className="space-y-5">
            {/* Amount */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Số tiền vay</label>
                <span className="text-sm font-bold text-primary-800">{fmt(amount)}</span>
              </div>
              <input type="range" min={5_000_000} max={2_000_000_000} step={5_000_000}
                value={amount} onChange={e => setAmount(Number(e.target.value))}
                className="w-full accent-primary-800 h-2 rounded-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5 triệu</span><span>2 tỷ</span>
              </div>
            </div>

            {/* Term */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Kỳ hạn</label>
                <span className="text-sm font-bold text-primary-800">{term} tháng</span>
              </div>
              <input type="range" min={3} max={360} step={3}
                value={term} onChange={e => setTerm(Number(e.target.value))}
                className="w-full accent-primary-800 h-2 rounded-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>3 tháng</span><span>30 năm</span>
              </div>
            </div>

            {/* Rate */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Lãi suất</label>
                <span className="text-sm font-bold text-primary-800">{rate.toFixed(2)}%/tháng</span>
              </div>
              <input type="range" min={0.3} max={2.5} step={0.05}
                value={rate} onChange={e => setRate(Number(e.target.value))}
                className="w-full accent-primary-800 h-2 rounded-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.3%</span><span>2.5%</span>
              </div>
            </div>

            {/* Preset buttons */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Loại vay phổ biến</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Cá nhân', rate: 1.2, term: 24 },
                  { label: 'Mua xe',  rate: 0.85, term: 60 },
                  { label: 'Mua nhà', rate: 0.65, term: 240 },
                  { label: 'Kinh doanh', rate: 0.9, term: 36 },
                ].map(p => (
                  <button key={p.label}
                    onClick={() => { setRate(p.rate); setTerm(p.term) }}
                    className="px-3 py-1.5 text-xs bg-primary-50 text-primary-800 rounded-lg hover:bg-primary-100 font-medium border border-primary-200 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-bidv-card rounded-2xl p-6 text-white shadow-bidv">
            <p className="text-primary-200 text-sm mb-1">Trả hàng tháng</p>
            <p className="text-3xl font-black">{fmt(monthly)}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-primary-200 text-xs">Tổng tiền trả</p>
                <p className="font-bold mt-0.5">{fmt(totalPay)}</p>
              </div>
              <div>
                <p className="text-primary-200 text-xs">Tổng lãi phải trả</p>
                <p className="font-bold mt-0.5 text-yellow-300">{fmt(totalInterest)}</p>
              </div>
              <div>
                <p className="text-primary-200 text-xs">Số tiền vay</p>
                <p className="font-bold mt-0.5">{fmt(amount)}</p>
              </div>
              <div>
                <p className="text-primary-200 text-xs">Lãi suất năm</p>
                <p className="font-bold mt-0.5">{(rate * 12).toFixed(1)}%/năm</p>
              </div>
            </div>
          </div>

          <Card>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Tỷ lệ gốc / lãi
            </p>
            <div className="flex rounded-full overflow-hidden h-4">
              <div className="bg-primary-800 flex items-center justify-center text-white text-[10px] font-bold"
                style={{ width: `${(amount / totalPay) * 100}%` }}>
                {((amount / totalPay) * 100).toFixed(0)}%
              </div>
              <div className="bg-bidv-red flex-1 flex items-center justify-center text-white text-[10px] font-bold">
                {((totalInterest / totalPay) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary-800 inline-block"/>Gốc</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-bidv-red inline-block"/>Lãi</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Amortization chart */}
      <Card>
        <p className="text-sm font-semibold text-gray-900 mb-4">
          Cơ cấu trả nợ theo tháng {term > 24 ? '(24 tháng đầu)' : ''}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={term > 12 ? 8 : 14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}K`} />
            <Tooltip formatter={(v: number) => `${(v * 1000).toLocaleString('vi-VN')} VND`}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
            <Bar dataKey="principal" name="Gốc"  stackId="a" fill="#003087" radius={[0, 0, 0, 0]} />
            <Bar dataKey="interest"  name="Lãi"   stackId="a" fill="#D4001A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
export function LoanPage() {
  const qc = useQueryClient()
  const [applyModal, setApplyModal] = useState(false)
  const [tab, setTab] = useState<'loans' | 'calculator'>('loans')

  const { data: account } = useQuery({
    queryKey: ['my-account'],
    queryFn: accountApi.getMyAccount,
  })

  const { data: loans, isLoading } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => loanApi.getMyLoans(),
  })

  const { data: creditData } = useQuery({
    queryKey: ['credit-score', account?.userId],
    queryFn: () => loanApi.getCreditScore(account!.userId),
    enabled: !!account?.userId,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: { loanType: 'PERSONAL', termMonths: 12 },
  })

  const applyMutation = useMutation({
    mutationFn: (data: ApplyForm) => loanApi.applyLoan(account!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-loans'] })
      setApplyModal(false)
      reset()
      toast.success('Hồ sơ vay đã được nộp!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vay vốn</h1>
          <p className="text-gray-400 text-sm mt-0.5">Nộp hồ sơ và theo dõi các khoản vay</p>
        </div>
        {tab === 'loans' && (
          <Button variant="cta" onClick={() => setApplyModal(true)}>
            <Plus className="w-4 h-4" /> Nộp hồ sơ vay
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-card w-fit">
        <button onClick={() => setTab('loans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'loans' ? 'bg-primary-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
          <FileText className="w-4 h-4" /> Hồ sơ của tôi
        </button>
        <button onClick={() => setTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'calculator' ? 'bg-primary-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
          <Calculator className="w-4 h-4" /> Máy tính lãi vay
        </button>
      </div>

      {tab === 'calculator' && <LoanCalculator />}
      {tab !== 'calculator' && (<>

      {/* Credit score + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex items-center justify-center">
          <CreditScoreGauge score={creditData?.creditScore ?? 650} />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tổng quan khoản vay</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Tổng hồ sơ',   value: loans?.totalElements ?? 0 },
              { label: 'Đã duyệt',     value: loans?.content.filter(l => l.status === 'APPROVED' || l.status === 'DISBURSED' || l.status === 'ACTIVE').length ?? 0 },
              { label: 'Đang xử lý',  value: loans?.content.filter(l => l.status === 'PENDING' || l.status === 'UNDER_REVIEW').length ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Loan list */}
      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ vay của tôi</CardTitle>
        </CardHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : !loans?.content.length ? (
          <div className="text-center py-12 text-gray-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Chưa có hồ sơ vay nào</p>
            <Button className="mt-4" size="sm" onClick={() => setApplyModal(true)}>
              Nộp hồ sơ đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.content.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </Card>

      </>)}

      {/* Apply modal */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Nộp hồ sơ vay" size="lg">
        <form onSubmit={handleSubmit((d) => applyMutation.mutate(d))} className="space-y-4">
          <Select
            label="Loại vay"
            options={Object.entries(loanTypeLabels).map(([v, l]) => ({ value: v, label: l }))}
            error={errors.loanType?.message}
            {...register('loanType')}
          />
          <Input
            label="Số tiền vay (VND)"
            type="number"
            placeholder="10000000"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Kỳ hạn (tháng)"
            type="number"
            placeholder="12"
            error={errors.termMonths?.message}
            hint="Từ 3 đến 360 tháng"
            {...register('termMonths')}
          />
          <Input
            label="Mục đích vay"
            placeholder="Mua xe, kinh doanh..."
            {...register('purpose')}
          />
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            Credit score hiện tại: <strong>{creditData?.creditScore ?? 'Đang tải...'}</strong>
            {creditData && creditData.creditScore < 500 && ' — Cần >= 500 để được duyệt vay'}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setApplyModal(false)}>
              Hủy
            </Button>
            <Button className="flex-1" type="submit" loading={applyMutation.isPending}>
              Nộp hồ sơ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
