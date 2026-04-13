import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpRight, ArrowDownLeft, TrendingUp,
  RefreshCw, ArrowRight, Wallet, Send,
  PiggyBank, FileBarChart, Plus, TrendingDown
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { accountApi } from '@/api/accountApi'
import { paymentApi } from '@/api/paymentApi'
import { reportApi } from '@/api/reportApi'
import { useAuthStore } from '@/store/authStore'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatVND, formatDateTime, txStatusColor } from '@/utils/format'
import { subMonths, format } from 'date-fns'

const generateChartData = () =>
  Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    return {
      month: format(d, 'MM/yy'),
      chi: Math.floor(Math.random() * 30_000_000) + 5_000_000,
      thu: Math.floor(Math.random() * 40_000_000) + 10_000_000,
    }
  })
const chartData = generateChartData()

// Tỷ giá mock (cập nhật theo BIDV thực tế)
const FX_RATES = [
  { code: 'USD', flag: '🇺🇸', name: 'Đô la Mỹ',     buy: 25_410, sell: 25_710, change: +0.12 },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro',           buy: 27_580, sell: 27_990, change: -0.08 },
  { code: 'JPY', flag: '🇯🇵', name: 'Yên Nhật',      buy:   167,  sell:   174,  change: +0.31 },
  { code: 'CNY', flag: '🇨🇳', name: 'Nhân dân tệ',   buy:  3_490, sell:  3_610, change: -0.05 },
  { code: 'GBP', flag: '🇬🇧', name: 'Bảng Anh',      buy: 32_050, sell: 32_680, change: +0.22 },
  { code: 'KRW', flag: '🇰🇷', name: 'Won Hàn Quốc',  buy:    17,  sell:    19,  change: +0.09 },
]

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: account } = useQuery({
    queryKey: ['my-account'],
    queryFn: accountApi.getMyAccount,
    retry: 1,
  })

  const { data: txHistory } = useQuery({
    queryKey: ['tx-history', account?.id],
    queryFn: () => paymentApi.getHistory(account!.id, 0, 5),
    enabled: !!account?.id,
  })

  const now = new Date()
  const { data: summary } = useQuery({
    queryKey: ['monthly-summary', account?.id, now.getFullYear(), now.getMonth() + 1],
    queryFn: () => reportApi.getMonthlySummary(account!.id, now.getFullYear(), now.getMonth() + 1),
    enabled: !!account?.id,
  })

  const dailyRemain = account ? account.dailyLimit - account.dailyUsed : 0
  const dailyPct    = account ? (account.dailyUsed / account.dailyLimit) * 100 : 0

  return (
    <div className="space-y-6">

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Xin chào, {account?.fullName?.split(' ').pop() || user?.email} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Badge variant={account?.status === 'ACTIVE' ? 'success' : 'warning'}>
          {account?.status ?? 'ACTIVE'}
        </Badge>
      </div>

      {/* ── BIDV Balance Hero Card ── */}
      <div className="rounded-2xl bg-bidv-card p-6 text-white shadow-bidv relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-20 w-28 h-28 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-primary-200 text-xs font-medium uppercase tracking-wider mb-1">
                Số dư khả dụng
              </p>
              <p className="text-3xl font-black tracking-tight">
                {formatVND(account?.availableBalance ?? 0)}
              </p>
              <p className="text-primary-300 text-xs mt-1">
                Tổng số dư: {formatVND(account?.balance ?? 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-primary-200 text-xs mb-1">Số tài khoản</p>
              <p className="font-mono text-sm font-semibold tracking-widest">
                {account?.accountNumber ?? '—'}
              </p>
              <p className="text-primary-300 text-xs mt-1 capitalize">
                {account?.accountType === 'CHECKING' ? 'Thanh toán' : 'Tiết kiệm'}
              </p>
            </div>
          </div>

          {/* Daily limit bar */}
          <div>
            <div className="flex justify-between text-xs text-primary-200 mb-1.5">
              <span>Hạn mức ngày đã dùng</span>
              <span>{formatVND(account?.dailyUsed ?? 0)} / {formatVND(account?.dailyLimit ?? 0)}</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${dailyPct > 80 ? 'bg-red-400' : dailyPct > 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
                style={{ width: `${Math.min(dailyPct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-primary-200 mt-1.5">
              Còn lại: <span className="text-white font-semibold">{formatVND(dailyRemain)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { to: '/payment', label: 'Chuyển tiền',  icon: Send,         color: 'bg-primary-900 text-white' },
          { to: '/account', label: 'Nạp tiền',     icon: Plus,         color: 'bg-green-600 text-white' },
          { to: '/loan',    label: 'Vay vốn',       icon: PiggyBank,    color: 'bg-bidv-red text-white' },
          { to: '/report',  label: 'Sao kê',        icon: FileBarChart, color: 'bg-amber-500 text-white' },
        ].map(({ to, label, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Chi tiêu tháng này',
            value: formatVND(summary?.totalDebit ?? 0),
            sub:   `${summary?.transactionCount ?? 0} giao dịch`,
            icon: ArrowUpRight,
            iconBg: 'bg-red-50 text-red-500',
          },
          {
            title: 'Thu nhập tháng này',
            value: formatVND(summary?.totalCredit ?? 0),
            sub:   'Tháng hiện tại',
            icon: ArrowDownLeft,
            iconBg: 'bg-green-50 text-green-600',
          },
          {
            title: 'Số dư ròng',
            value: formatVND((summary?.totalCredit ?? 0) - (summary?.totalDebit ?? 0)),
            sub:   'Thu - Chi',
            icon: TrendingUp,
            iconBg: 'bg-blue-50 text-primary-700',
          },
        ].map(({ title, value, sub, icon: Icon, iconBg }) => (
          <Card key={title}>
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Thu chi 6 tháng</CardTitle>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary-700 inline-block" />Thu
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-bidv-red inline-block" />Chi
              </span>
            </div>
          </CardHeader>
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gThu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#003087" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#003087" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gChi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D4001A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#D4001A" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v/1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => formatVND(v)}
                contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="thu" stroke="#003087" fill="url(#gThu)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="chi" stroke="#D4001A" fill="url(#gChi)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Số dư ròng theo tháng</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={195}>
            <BarChart data={chartData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v/1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => formatVND(v)}
                contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="thu" name="Thu" fill="#003087" radius={[4, 4, 0, 0]} />
              <Bar dataKey="chi" name="Chi" fill="#D4001A" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── AI Advisor & Financial Goal ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-24 h-24" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-primary-800 flex items-center gap-2">
              <span className="bg-primary-600 text-white p-1.5 rounded-lg text-xs">AI</span> 
              Gợi ý tài chính thông minh
            </CardTitle>
          </CardHeader>
          <div className="p-6 pt-0 relative z-10 text-sm">
            {(!summary || (summary.totalDebit === 0 && summary.totalCredit === 0)) ? (
              <p className="text-gray-600 italic">🤖 Bắt đầu thực hiện các giao dịch để AI có thể đưa ra phân tích thói quen sống cho bạn nhé!</p>
            ) : (summary.totalDebit > summary.totalCredit * 0.8) ? (
              <div className="space-y-2">
                <p className="font-semibold text-red-600 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4"/> Báo động đỏ chi tiêu!
                </p>
                <p className="text-gray-700">Tháng này bạn đã tiêu <b>{formatVND(summary.totalDebit)}</b>, vượt quá mức 80% thu nhập của bạn. Hãy rà soát lại các khoản chi không cần thiết bằng chức năng Sao kê nhé.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold text-green-600 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4"/> Sức khỏe tài chính xuất sắc!
                </p>
                <p className="text-gray-700">Thu nhập ổn định và tỷ lệ chi tiêu thấp giúp bạn tích lũy được <b>{formatVND(summary.totalCredit - summary.totalDebit)}</b> thặng dư tháng này. Hãy cân nhắc xem xét các gói vay tiêu dùng hoặc thẻ tín dụng để gia tăng hạn mức.</p>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <span className="inline-flex px-2 py-0.5 rounded-full bg-white/60 text-primary-700 text-[10px] font-bold uppercase tracking-wide border border-primary-100">Cá nhân hóa</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center">
              Mục tiêu tài chính
              <Plus className="w-4 h-4 text-gray-400 cursor-pointer hover:text-primary-600 transition-colors" />
            </CardTitle>
          </CardHeader>
          <div className="p-6 pt-0 space-y-5">
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Chuyến du lịch Bali 🌴</p>
                  <p className="text-xs text-gray-400">Tiết kiệm hưu trí / cá nhân</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">{formatVND(account?.availableBalance ?? 0)} <span className="text-gray-400 font-normal">/ {formatVND(20000000)}</span></p>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000 ease-in-out" 
                  style={{ width: `${Math.min(((account?.availableBalance || 0) / 20000000) * 100, 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1.5">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Quỹ khẩn cấp dự phòng 🛡️</p>
                  <p className="text-xs text-gray-400">Lưu động an toàn</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">{formatVND(10000000)} <span className="text-gray-400 font-normal">/ {formatVND(50000000)}</span></p>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-in-out" 
                  style={{ width: '20%' }} 
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Tỷ giá hối đoái ── */}
      <Card>
        <CardHeader>
          <CardTitle>Tỷ giá hối đoái</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              Cập nhật: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs text-gray-400 font-medium">Đơn vị: VND</span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ngoại tệ</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mua</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Bán</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {FX_RATES.map(fx => (
                <tr key={fx.code} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{fx.flag}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{fx.code}</p>
                        <p className="text-xs text-gray-400">{fx.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-2.5 font-mono text-sm font-medium text-gray-700">
                    {fx.buy.toLocaleString('vi-VN')}
                  </td>
                  <td className="text-right py-2.5 font-mono text-sm font-semibold text-gray-900">
                    {fx.sell.toLocaleString('vi-VN')}
                  </td>
                  <td className="text-right py-2.5">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${fx.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {fx.change >= 0
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {fx.change >= 0 ? '+' : ''}{fx.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Recent transactions ── */}
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
          <Link to="/payment"
            className="text-sm text-primary-800 hover:text-bidv-red flex items-center gap-1 font-medium transition-colors">
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        {!txHistory?.content?.length ? (
          <div className="text-center py-12 text-gray-400">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có giao dịch nào</p>
            <Link to="/payment"
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary-700 hover:text-bidv-red font-medium">
              <Send className="w-3.5 h-3.5" /> Thực hiện giao dịch đầu tiên
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {txHistory.content.map((tx) => {
              const isCredit = tx.type === 'TOPUP'
              return (
                <div key={tx.id} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
                      {isCredit
                        ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        : <ArrowUpRight  className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.description || tx.type}
                        {tx.category && (
                          <span className="ml-2 inline-flex items-center rounded-sm bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">
                            {tx.category}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                      {isCredit ? '+' : '-'}{formatVND(tx.amount)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${txStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
