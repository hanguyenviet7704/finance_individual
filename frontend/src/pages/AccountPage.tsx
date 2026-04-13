import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreditCard, Shield, Lock, Unlock, CheckCircle,
  Clock, XCircle, AlertCircle, Edit, Copy, Wifi
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { accountApi } from '@/api/accountApi'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { formatVND, formatDateTime, maskAccountNumber } from '@/utils/format'
import type { Account } from '@/types'

function kycBadge(status: string) {
  const map: Record<string, { variant: 'success'|'warning'|'danger'|'info'; label: string; icon: React.ElementType }> = {
    VERIFIED:  { variant: 'success', label: 'Đã xác minh', icon: CheckCircle },
    PENDING:   { variant: 'warning', label: 'Chờ xác minh', icon: Clock },
    SUBMITTED: { variant: 'info',    label: 'Đã nộp hồ sơ', icon: AlertCircle },
    REJECTED:  { variant: 'danger',  label: 'Bị từ chối', icon: XCircle },
  }
  const cfg = map[status] || map.PENDING
  const Icon = cfg.icon
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <Icon className="w-3 h-3" /> {cfg.label}
    </Badge>
  )
}

function AccountInfoRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    toast.success('Đã sao chép!')
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{value}</span>
        {copyable && (
          <button onClick={handleCopy} className="text-gray-400 hover:text-primary-600">
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export function AccountPage() {
  const qc = useQueryClient()
  const [limitModal, setLimitModal] = useState(false)
  const [newLimit, setNewLimit] = useState('')

  const { data: account, isLoading } = useQuery({
    queryKey: ['my-account'],
    queryFn: accountApi.getMyAccount,
  })

  const freezeMutation = useMutation({
    mutationFn: () => accountApi.freezeAccount(account!.id, 'User request'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-account'] })
      toast.success('Tài khoản đã bị khóa tạm thời')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const unfreezeMutation = useMutation({
    mutationFn: () => accountApi.unfreezeAccount(account!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-account'] })
      toast.success('Tài khoản đã được mở khóa')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const limitMutation = useMutation({
    mutationFn: (limit: number) => accountApi.updateLimits(account!.id, limit),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-account'] })
      toast.success('Hạn mức đã được cập nhật')
      setLimitModal(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  if (!account) return (
    <div className="text-center py-20 text-gray-500">Không tìm thấy tài khoản.</div>
  )

  const isFrozen = account.status === 'FROZEN'
  const usedPercent = account.dailyLimit > 0
    ? Math.min((account.dailyUsed / account.dailyLimit) * 100, 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tài khoản của tôi</h1>
        <p className="text-gray-500 text-sm mt-1">Quản lý thông tin và cài đặt tài khoản</p>
      </div>

      {/* ── Virtual Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card face */}
        <div
          className="relative rounded-2xl p-6 text-white overflow-hidden h-52 shadow-bidv"
          style={{ background: 'linear-gradient(135deg, #003087 0%, #1A4EB5 50%, #0D2B7E 100%)' }}
        >
          {/* Background decorations */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-1/3 w-36 h-36 rounded-full bg-white/5" />

          {/* Card content */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-black text-lg tracking-widest">BIDV</p>
                <p className="text-primary-200 text-[10px]">SMARTBANKING</p>
              </div>
              <div className="text-right flex items-center gap-2">
                <Wifi className="w-5 h-5 text-white/60 rotate-90" />
                {/* Chip */}
                <div className="w-8 h-6 bg-yellow-400/80 rounded-md" />
              </div>
            </div>

            <div>
              <p className="font-mono text-lg tracking-[0.2em] font-semibold">
                {maskAccountNumber(account.accountNumber)}
              </p>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <p className="text-primary-300 text-[9px] uppercase tracking-wider">Chủ tài khoản</p>
                  <p className="font-bold text-sm mt-0.5 uppercase tracking-wide">
                    {account.fullName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary-300 text-[9px] uppercase tracking-wider">Hết hạn</p>
                  <p className="font-semibold text-sm mt-0.5">12/29</p>
                </div>
                {/* Visa-like circles */}
                <div className="flex">
                  <div className="w-8 h-8 rounded-full bg-red-500 opacity-80" />
                  <div className="w-8 h-8 rounded-full bg-yellow-400 opacity-80 -ml-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance + status */}
        <div className="bg-bidv-card rounded-2xl p-6 text-white shadow-bidv">
          <p className="text-primary-200 text-xs font-medium uppercase tracking-wider mb-1">
            Số dư khả dụng
          </p>
          <p className="text-3xl font-black">{formatVND(account.availableBalance)}</p>
          <p className="text-primary-300 text-sm mt-1">
            Tổng số dư: {formatVND(account.balance)}
          </p>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <div>
              <p className="text-primary-200 text-xs">Trạng thái</p>
              <p className={`font-bold text-sm mt-0.5 ${isFrozen ? 'text-red-300' : 'text-green-300'}`}>
                {isFrozen ? '🔒 Đã khóa tạm thời' : '✓ Đang hoạt động'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-primary-200 text-xs">Loại TK</p>
              <p className="font-bold text-sm mt-0.5">
                {account.accountType === 'CHECKING' ? 'Thanh toán' : 'Tiết kiệm'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin tài khoản</CardTitle>
            {kycBadge(account.kycStatus)}
          </CardHeader>
          <div>
            <AccountInfoRow label="Họ và tên"        value={account.fullName} />
            <AccountInfoRow label="Email"             value={account.email} />
            <AccountInfoRow label="Số điện thoại"     value={account.phone} />
            <AccountInfoRow label="Số tài khoản"      value={account.accountNumber} copyable />
            <AccountInfoRow label="Loại tài khoản"    value={account.accountType} />
            <AccountInfoRow label="Tiền tệ"           value={account.currency} />
            <AccountInfoRow label="Ngày tạo"          value={formatDateTime(account.createdAt)} />
          </div>
        </Card>

        {/* Limit & Security */}
        <div className="space-y-4">
          {/* Daily limit */}
          <Card>
            <CardHeader>
              <CardTitle>Hạn mức giao dịch</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setLimitModal(true)}>
                <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
              </Button>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Đã sử dụng hôm nay</span>
                  <span className="font-medium">{formatVND(account.dailyUsed)} / {formatVND(account.dailyLimit)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usedPercent > 80 ? 'bg-red-500' : usedPercent > 50 ? 'bg-yellow-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Còn lại: {formatVND(account.dailyLimit - account.dailyUsed)}
                </p>
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle>Bảo mật tài khoản</CardTitle>
              <Shield className="w-5 h-5 text-gray-400" />
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {isFrozen ? 'Khóa tài khoản tạm thời' : 'Tài khoản đang hoạt động'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isFrozen ? 'Tất cả giao dịch bị chặn' : 'Có thể thực hiện giao dịch bình thường'}
                  </p>
                </div>
                {isFrozen ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => unfreezeMutation.mutate()}
                    loading={unfreezeMutation.isPending}
                  >
                    <Unlock className="w-3.5 h-3.5" /> Mở khóa
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn khóa tài khoản?'))
                        freezeMutation.mutate()
                    }}
                    loading={freezeMutation.isPending}
                  >
                    <Lock className="w-3.5 h-3.5" /> Khóa
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Update limit modal */}
      <Modal open={limitModal} onClose={() => setLimitModal(false)} title="Cập nhật hạn mức ngày">
        <div className="space-y-4">
          <Input
            label="Hạn mức mới (VND)"
            type="number"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            hint={`Hạn mức hiện tại: ${formatVND(account.dailyLimit)}`}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setLimitModal(false)}>
              Hủy
            </Button>
            <Button
              className="flex-1"
              loading={limitMutation.isPending}
              onClick={() => limitMutation.mutate(Number(newLimit))}
            >
              Cập nhật
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
