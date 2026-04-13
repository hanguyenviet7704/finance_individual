import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  User, Mail, Phone, CreditCard, Shield,
  Bell, BellOff, Eye, EyeOff, Lock,
  CheckCircle2, Camera, LogOut, ChevronRight
} from 'lucide-react'
import { accountApi } from '@/api/accountApi'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime, maskAccountNumber } from '@/utils/format'
import { useNavigate } from 'react-router-dom'

// ── Ảnh background từ Unsplash (finance / city skyline)
const BG_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80'

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(8, 'Ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Phải có chữ HOA')
      .regex(/[0-9]/, 'Phải có chữ số'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
type PwForm = z.infer<typeof pwSchema>

// ── Notification toggle item
function NotifToggle({
  icon: Icon, title, desc, checked, onChange,
}: {
  icon: React.ElementType; title: string; desc: string
  checked: boolean; onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-700" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${
          checked ? 'bg-primary-700' : 'bg-gray-300'
        }`}
        style={{ height: '22px', width: '42px' }}
      >
        <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform ${
          checked ? 'translate-x-5' : ''
        }`} style={{ width: '18px', height: '18px' }} />
      </button>
    </div>
  )
}

// ── Password field
function PwField({
  label, show, onToggle, error, ...props
}: { label: string; show: boolean; onToggle: () => void; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={`bidv-input pr-10 ${error ? 'border-red-400 bg-red-50' : ''}`}
          {...props}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

type Tab = 'info' | 'security' | 'notifications'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [tab, setTab] = useState<Tab>('info')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [notifs, setNotifs] = useState({
    transaction: true,
    security:    true,
    promotion:   false,
    monthly:     true,
    login:       true,
    lowBalance:  true,
  })

  const { data: account } = useQuery({
    queryKey: ['my-account'],
    queryFn: accountApi.getMyAccount,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  })

  const handleChangePw = async (_data: PwForm) => {
    // In a real app, call API. Here we simulate.
    await new Promise(r => setTimeout(r, 800))
    toast.success('Đổi mật khẩu thành công!')
    reset()
  }

  const handleLogout = async () => {
    await authApi.logout()
    logout()
    navigate('/login')
  }

  const initials = account?.fullName
    ? account.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'info',          label: 'Thông tin cá nhân', icon: User },
    { key: 'security',      label: 'Bảo mật',           icon: Shield },
    { key: 'notifications', label: 'Thông báo',          icon: Bell },
  ]

  return (
    <div className="space-y-6">
      {/* ── Hero header với ảnh từ Unsplash ── */}
      <div
        className="relative rounded-2xl overflow-hidden h-48 shadow-bidv"
        style={{
          backgroundImage: `url(${BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-primary-900/60" />

        {/* Content */}
        <div className="relative z-10 h-full flex items-end p-6">
          <div className="flex items-end gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-primary-900 font-black text-2xl shadow-lg border-4 border-white">
                {initials}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-bidv-red rounded-full flex items-center justify-center shadow">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            {/* Info */}
            <div className="pb-1">
              <h1 className="text-white font-bold text-xl leading-tight">
                {account?.fullName || user?.email}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-primary-200 text-xs font-mono">
                  {maskAccountNumber(account?.accountNumber || '')}
                </span>
                <Badge
                  variant={account?.kycStatus === 'VERIFIED' ? 'success' : 'warning'}
                  className="text-[10px] py-0"
                >
                  {account?.kycStatus === 'VERIFIED' ? (
                    <><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Đã xác minh</>
                  ) : 'Chờ xác minh'}
                </Badge>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="ml-auto flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors mb-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng xuất
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-card">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-primary-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Thông tin cá nhân ── */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
            <div className="space-y-4">
              {[
                { icon: User,       label: 'Họ và tên',      value: account?.fullName || '—' },
                { icon: Mail,       label: 'Email',           value: account?.email || '—' },
                { icon: Phone,      label: 'Số điện thoại',   value: account?.phone || '—' },
                { icon: CreditCard, label: 'Số tài khoản',    value: account?.accountNumber || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Trạng thái tài khoản</h3>
            <div className="space-y-3">
              {[
                { label: 'Loại tài khoản',  value: account?.accountType === 'CHECKING' ? 'Thanh toán' : 'Tiết kiệm' },
                { label: 'Tiền tệ',         value: account?.currency || 'VND' },
                { label: 'Trạng thái',      value: account?.status || 'ACTIVE' },
                { label: 'KYC',             value: account?.kycStatus || 'PENDING' },
                { label: 'Ngày mở tài khoản', value: formatDateTime(account?.createdAt || '') },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 mb-1">Nâng cấp KYC</p>
              <p className="text-xs text-amber-600">
                Xác minh danh tính để tăng hạn mức giao dịch lên 500 triệu VND/ngày.
              </p>
              <button className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                Nộp hồ sơ KYC <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab: Bảo mật ── */}
      {tab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary-700" /> Đổi mật khẩu
            </h3>
            <form onSubmit={handleSubmit(handleChangePw)} className="space-y-4">
              <PwField
                label="Mật khẩu hiện tại"
                show={showCurrent}
                onToggle={() => setShowCurrent(!showCurrent)}
                placeholder="••••••••"
                error={errors.currentPassword?.message}
                {...register('currentPassword')}
              />
              <PwField
                label="Mật khẩu mới"
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
                placeholder="Tối thiểu 8 ký tự, có HOA và số"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <PwField
                label="Xác nhận mật khẩu mới"
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                placeholder="Nhập lại mật khẩu mới"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" variant="cta" className="w-full" loading={isSubmitting}>
                Cập nhật mật khẩu
              </Button>
            </form>
          </Card>

          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Lịch sử đăng nhập</h3>
              <div className="space-y-3">
                {[
                  { device: 'Chrome · Windows 11',  time: 'Vừa xong',          current: true  },
                  { device: 'Safari · iPhone 15',    time: '2 giờ trước',       current: false },
                  { device: 'Chrome · Macbook Pro',  time: 'Hôm qua 09:15',     current: false },
                ].map(({ device, time, current }) => (
                  <div key={device} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${current ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{device}</p>
                        <p className="text-xs text-gray-400">{time}</p>
                      </div>
                    </div>
                    {current && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Thiết bị này</span>}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Xác thực 2 lớp</h3>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                <div>
                  <p className="text-sm font-semibold text-green-800">Đang bật — SMS OTP</p>
                  <p className="text-xs text-green-600">SĐT: {account?.phone || '0901***567'}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Tab: Thông báo ── */}
      {tab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-1">Giao dịch & Tài khoản</h3>
            <p className="text-xs text-gray-400 mb-4">Thông báo khi có biến động số dư</p>
            <NotifToggle icon={Bell}    title="Biến động số dư"   desc="Thông báo mọi giao dịch"        checked={notifs.transaction} onChange={() => setNotifs(p => ({ ...p, transaction: !p.transaction }))} />
            <NotifToggle icon={Shield}  title="Cảnh báo bảo mật" desc="Đăng nhập lạ, đổi mật khẩu"     checked={notifs.security}    onChange={() => setNotifs(p => ({ ...p, security: !p.security }))} />
            <NotifToggle icon={CreditCard} title="Số dư thấp"    desc="Khi số dư < 500.000 VND"        checked={notifs.lowBalance}  onChange={() => setNotifs(p => ({ ...p, lowBalance: !p.lowBalance }))} />
            <NotifToggle icon={Lock}    title="Đăng nhập mới"    desc="Mỗi lần đăng nhập thành công"   checked={notifs.login}       onChange={() => setNotifs(p => ({ ...p, login: !p.login }))} />
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-1">Thông tin & Ưu đãi</h3>
            <p className="text-xs text-gray-400 mb-4">Tin tức và chương trình khuyến mãi</p>
            <NotifToggle icon={Mail}    title="Báo cáo tháng"     desc="Tóm tắt thu chi hàng tháng"    checked={notifs.monthly}     onChange={() => setNotifs(p => ({ ...p, monthly: !p.monthly }))} />
            <NotifToggle icon={BellOff} title="Khuyến mãi"        desc="Ưu đãi lãi suất, phí giao dịch" checked={notifs.promotion}   onChange={() => setNotifs(p => ({ ...p, promotion: !p.promotion }))} />

            <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <p className="text-xs font-semibold text-primary-800 mb-1">Kênh nhận thông báo</p>
              <div className="space-y-2 mt-2">
                {['Tin nhắn SMS', 'Email', 'Ứng dụng (Push)'].map((ch, i) => (
                  <label key={ch} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={i < 2} className="rounded text-primary-700 focus:ring-primary-500" />
                    <span className="text-sm text-gray-700">{ch}</span>
                  </label>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
