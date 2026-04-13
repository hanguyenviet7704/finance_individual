import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Eye, EyeOff, CheckCircle2, User, Mail, Phone, Lock, CreditCard, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'

const schema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Họ tên ít nhất 2 ký tự')
      .max(100)
      .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Họ tên chỉ chứa chữ cái'),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().regex(/^(\+84|0)[0-9]{9}$/, 'Số điện thoại không hợp lệ (VD: 0901234567)'),
    password: z
      .string()
      .min(8, 'Ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Phải có ít nhất 1 chữ HOA')
      .regex(/[0-9]/, 'Phải có ít nhất 1 chữ số'),
    confirmPassword: z.string(),
    accountType: z.enum(['SAVING', 'CHECKING']),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'Vui lòng đồng ý với điều khoản dịch vụ' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

function StrengthBar({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= 8,      label: '≥ 8 ký tự' },
    { ok: /[A-Z]/.test(password),    label: 'Chữ HOA' },
    { ok: /[0-9]/.test(password),    label: 'Chữ số' },
    { ok: /[^a-zA-Z0-9]/.test(password), label: 'Ký tự đặc biệt' },
  ]
  const score = checks.filter(c => c.ok).length
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
  const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh']
  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score-1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {checks.map(c => (
            <span key={c.label} className={`text-[10px] flex items-center gap-0.5 ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
              <CheckCircle2 className={`w-2.5 h-2.5 ${c.ok ? 'text-green-500' : 'text-gray-300'}`} />
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[10px] font-semibold ${score < 2 ? 'text-red-500' : score < 3 ? 'text-yellow-600' : score < 4 ? 'text-blue-600' : 'text-green-600'}`}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  )
}

function FieldLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
      <Icon className="w-3.5 h-3.5 text-primary-700" />
      {label}
    </label>
  )
}

export function RegisterPage() {
  const navigate  = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [showPw, setShowPw]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [accountNumber, setAccountNumber] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: 'CHECKING' },
  })

  const password     = watch('password', '')
  const accountType  = watch('accountType')

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAccountNumber(data.account_number)
      setTokens(data.access_token, data.refresh_token)
      toast.success('Mở tài khoản thành công!')
      setTimeout(() => navigate('/dashboard'), 2500)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  /* ── Success screen ── */
  if (accountNumber) {
    return (
      <div className="min-h-screen bg-[#F0F4FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-bidv border border-gray-100 overflow-hidden w-full max-w-md text-center">
          <div className="h-1.5 bg-bidv-gradient" />
          <div className="p-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-5">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Mở tài khoản thành công!</h2>
            <p className="text-gray-500 text-sm mb-7">Tài khoản của bạn đã được kích hoạt</p>

            <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 mb-6">
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">
                Số tài khoản của bạn
              </p>
              <p className="text-2xl font-black font-mono text-primary-900 tracking-widest">
                {accountNumber}
              </p>
              <p className="text-xs text-gray-400 mt-2">Ghi nhớ số tài khoản để nhận chuyển khoản</p>
            </div>

            <p className="text-xs text-gray-400">Đang chuyển đến trang chủ...</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Registration form ── */
  return (
    <div className="min-h-screen bg-[#F0F4FA] flex flex-col">

      {/* Top bar */}
      <div className="bg-bidv-gradient px-6 py-4 flex items-center gap-4 shadow-bidv">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-primary-900 font-black text-sm">B</span>
          </div>
          <span className="text-white font-black text-xl tracking-wider">BIDV</span>
        </div>
        <span className="text-primary-200 text-sm hidden sm:block">· Mở tài khoản trực tuyến</span>

        <Link
          to="/login"
          className="ml-auto flex items-center gap-1.5 text-primary-200 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Đã có tài khoản
        </Link>
      </div>

      {/* Steps indicator */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-xs">
            {['Thông tin cá nhân', 'Loại tài khoản', 'Bảo mật', 'Xác nhận'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px bg-gray-200" />}
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${i === 0 ? 'bg-primary-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {i + 1}
                  </div>
                  <span className={i === 0 ? 'text-primary-900 font-semibold' : 'text-gray-400'}>
                    {s}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-bidv border border-gray-100 overflow-hidden">
            <div className="h-1.5 bg-bidv-gradient" />

            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Thông tin đăng ký</h2>
              <p className="text-sm text-gray-500 mb-7">
                Vui lòng điền đầy đủ thông tin để mở tài khoản
              </p>

              <form onSubmit={handleSubmit((d) => registerMutation.mutate(d))} className="space-y-5">

                {/* ── Họ tên ── */}
                <div>
                  <FieldLabel icon={User} label="Họ và tên" />
                  <input
                    placeholder="Nguyễn Văn A"
                    className={`bidv-input ${errors.fullName ? 'border-red-400 bg-red-50' : ''}`}
                    {...register('fullName')}
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
                </div>

                {/* ── Email + Phone ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel icon={Mail} label="Email" />
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      className={`bidv-input ${errors.email ? 'border-red-400 bg-red-50' : ''}`}
                      {...register('email')}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                  </div>
                  <div>
                    <FieldLabel icon={Phone} label="Số điện thoại" />
                    <input
                      type="tel"
                      placeholder="0901234567"
                      className={`bidv-input ${errors.phone ? 'border-red-400 bg-red-50' : ''}`}
                      {...register('phone')}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
                  </div>
                </div>

                {/* ── Loại tài khoản ── */}
                <div>
                  <FieldLabel icon={CreditCard} label="Loại tài khoản" />
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      {
                        value: 'CHECKING',
                        label: 'Tài khoản thanh toán',
                        desc: 'Giao dịch hàng ngày, chuyển khoản nhanh',
                        badge: 'Phổ biến',
                      },
                      {
                        value: 'SAVING',
                        label: 'Tài khoản tiết kiệm',
                        desc: 'Lãi suất hấp dẫn, an toàn lâu dài',
                        badge: '',
                      },
                    ] as const).map((opt) => (
                      <label
                        key={opt.value}
                        className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          accountType === opt.value
                            ? 'border-primary-700 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <input type="radio" value={opt.value} className="sr-only" {...register('accountType')} />
                        <div className="flex items-start justify-between">
                          <span className="font-semibold text-sm text-gray-900">{opt.label}</span>
                          {opt.badge && (
                            <span className="text-[10px] bg-bidv-red text-white px-1.5 py-0.5 rounded font-bold">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{opt.desc}</span>
                        {accountType === opt.value && (
                          <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary-700" />
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.accountType && <p className="mt-1 text-xs text-red-600">{errors.accountType.message}</p>}
                </div>

                {/* ── Mật khẩu ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel icon={Lock} label="Mật khẩu" />
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Tối thiểu 8 ký tự"
                        className={`bidv-input pr-10 ${errors.password ? 'border-red-400 bg-red-50' : ''}`}
                        {...register('password')}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password
                      ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                      : <StrengthBar password={password} />
                    }
                  </div>
                  <div>
                    <FieldLabel icon={Lock} label="Xác nhận mật khẩu" />
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu"
                        className={`bidv-input pr-10 ${errors.confirmPassword ? 'border-red-400 bg-red-50' : ''}`}
                        {...register('confirmPassword')}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {/* ── Điều khoản ── */}
                <div className="pt-1">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                      {...register('terms')}
                    />
                    <span className="text-sm text-gray-600 leading-relaxed">
                      Tôi đã đọc và đồng ý với{' '}
                      <span className="text-primary-800 font-semibold hover:underline cursor-pointer">
                        Điều khoản sử dụng
                      </span>{' '}
                      và{' '}
                      <span className="text-primary-800 font-semibold hover:underline cursor-pointer">
                        Chính sách bảo mật
                      </span>{' '}
                      của BIDV
                    </span>
                  </label>
                  {errors.terms && <p className="mt-1 text-xs text-red-600 ml-7">{errors.terms.message}</p>}
                </div>

                {/* ── Submit ── */}
                <Button
                  type="submit"
                  variant="cta"
                  size="lg"
                  className="w-full mt-2"
                  loading={registerMutation.isPending}
                >
                  Mở tài khoản ngay
                </Button>
              </form>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            © 2026 BIDV Finance System · Bảo mật SSL 256-bit
          </p>
        </div>
      </div>
    </div>
  )
}
