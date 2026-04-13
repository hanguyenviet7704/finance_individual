import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ShieldCheck, Smartphone, Globe } from 'lucide-react'
import { useState } from 'react'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  account_number: z.string().min(5, 'Nhập số tài khoản / tên đăng nhập'),
  password:       z.string().min(1, 'Nhập mật khẩu'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate  = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token)
      toast.success('Đăng nhập thành công!')
      navigate('/dashboard')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Sai tên đăng nhập hoặc mật khẩu')
    },
  })

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: BIDV brand ── */}
      <div
        className="hidden lg:flex w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay để chữ đọc được */}
        <div className="absolute inset-0 bg-primary-900/80" />

        {/* Background decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary-900 font-black text-lg">B</span>
            </div>
            <div>
              <h1 className="text-white font-black text-3xl tracking-wider">BIDV</h1>
              <p className="text-primary-200 text-xs leading-tight">
                Ngân hàng TMCP Đầu tư và Phát triển Việt Nam
              </p>
            </div>
          </div>
        </div>

        {/* Middle content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white text-3xl font-bold leading-tight">
              Ngân hàng số <br />
              <span className="text-bidv-gold">an toàn · tiện lợi</span>
            </h2>
            <p className="text-primary-200 mt-3 text-sm leading-relaxed max-w-sm">
              Quản lý tài chính cá nhân mọi lúc, mọi nơi với nền tảng
              SmartBanking hiện đại, bảo mật đa lớp.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: ShieldCheck, text: 'Bảo mật SSL 256-bit & xác thực 2 lớp' },
              { icon: Smartphone,  text: 'Chuyển khoản 24/7 không giới hạn' },
              { icon: Globe,       text: 'Thanh toán quốc tế 150+ quốc gia' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-primary-100 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="relative z-10 text-primary-300 text-xs">
          © 2026 BIDV Finance System · Phiên bản 3.2.1
        </p>
      </div>

      {/* ── Right panel: Login form ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#F0F4FA] px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-base">B</span>
            </div>
            <span className="text-primary-900 font-black text-2xl tracking-wider">BIDV</span>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-bidv border border-gray-100 overflow-hidden">

            {/* Card header stripe */}
            <div className="h-1.5 bg-bidv-gradient" />

            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900">Đăng nhập</h2>
              <p className="text-sm text-gray-500 mt-1 mb-7">
                Chào mừng bạn quay trở lại
              </p>

              <form onSubmit={handleSubmit((d) => loginMutation.mutate(d))} className="space-y-5">

                {/* Account number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số tài khoản
                  </label>
                  <input
                    placeholder="FIN0000000000001"
                    className={`bidv-input ${errors.account_number ? 'border-red-400 bg-red-50' : ''}`}
                    {...register('account_number')}
                  />
                  {errors.account_number && (
                    <p className="mt-1 text-xs text-red-600">{errors.account_number.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                    <button type="button" className="text-xs text-primary-700 hover:text-bidv-red font-medium">
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`bidv-input pr-10 ${errors.password ? 'border-red-400 bg-red-50' : ''}`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit — BIDV red CTA */}
                <Button
                  type="submit"
                  variant="cta"
                  size="lg"
                  className="w-full mt-2"
                  loading={loginMutation.isPending}
                >
                  Đăng nhập
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-primary-800 font-semibold hover:text-bidv-red transition-colors">
                  Mở tài khoản ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Demo box */}
          <div className="mt-5 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-xs font-semibold text-primary-800 mb-2">Tài khoản demo</p>
            <div className="space-y-1.5 text-xs text-primary-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-mono font-medium">FIN0000000000001 / password123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Admin:</span>
                <span className="font-mono font-medium">FIN0000000000002 / admin123</span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Được bảo vệ bởi mã hoá SSL 256-bit
          </p>
        </div>
      </div>
    </div>
  )
}
