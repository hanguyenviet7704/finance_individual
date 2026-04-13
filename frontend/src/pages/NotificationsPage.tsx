import { useState } from 'react'
import {
  Bell, ArrowLeftRight, Shield, AlertTriangle,
  Info, CheckCircle2, Trash2, CheckCheck, Filter
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/utils/format'

type NotifType = 'transaction' | 'security' | 'system' | 'promo'
type NotifStatus = 'unread' | 'read'

interface Notif {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  status: NotifStatus
}

const MOCK_NOTIFS: Notif[] = [
  {
    id: '1',
    type: 'transaction',
    title: 'Giao dịch thành công',
    body: 'Chuyển khoản 5.000.000 VND đến FIN9876543210001 lúc 14:32 hôm nay.',
    time: new Date(Date.now() - 10 * 60_000).toISOString(),
    status: 'unread',
  },
  {
    id: '2',
    type: 'transaction',
    title: 'Nhận tiền thành công',
    body: 'Tài khoản nhận +2.500.000 VND từ FIN1234567890001. Số dư mới: 12.500.000 VND.',
    time: new Date(Date.now() - 2 * 3600_000).toISOString(),
    status: 'unread',
  },
  {
    id: '3',
    type: 'security',
    title: 'Đăng nhập từ thiết bị mới',
    body: 'Phát hiện đăng nhập từ Chrome trên Windows 11 tại Hà Nội. Nếu không phải bạn, hãy đổi mật khẩu ngay.',
    time: new Date(Date.now() - 5 * 3600_000).toISOString(),
    status: 'unread',
  },
  {
    id: '4',
    type: 'system',
    title: 'Hạn mức giao dịch được cập nhật',
    body: 'Hạn mức giao dịch ngày của bạn đã được cập nhật lên 100.000.000 VND sau khi xác minh KYC.',
    time: new Date(Date.now() - 24 * 3600_000).toISOString(),
    status: 'read',
  },
  {
    id: '5',
    type: 'promo',
    title: 'Ưu đãi lãi suất vay đặc biệt',
    body: 'Tháng 4/2026: Vay mua nhà lãi suất chỉ 6,5%/năm. Ưu đãi kéo dài đến 30/04/2026.',
    time: new Date(Date.now() - 2 * 24 * 3600_000).toISOString(),
    status: 'read',
  },
  {
    id: '6',
    type: 'transaction',
    title: 'Thanh toán hoá đơn điện',
    body: 'Thanh toán hoá đơn điện EVN tháng 3/2026 thành công. Số tiền: 450.000 VND.',
    time: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
    status: 'read',
  },
  {
    id: '7',
    type: 'security',
    title: 'Cảnh báo: Số dư thấp',
    body: 'Số dư tài khoản của bạn xuống dưới 500.000 VND. Vui lòng nạp thêm tiền.',
    time: new Date(Date.now() - 4 * 24 * 3600_000).toISOString(),
    status: 'read',
  },
  {
    id: '8',
    type: 'system',
    title: 'Báo cáo tháng 3/2026',
    body: 'Báo cáo thu chi tháng 3 đã sẵn sàng. Tổng thu: 25.000.000 VND • Tổng chi: 18.500.000 VND.',
    time: new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
    status: 'read',
  },
]

const TYPE_CFG: Record<NotifType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  transaction: { icon: ArrowLeftRight, color: 'text-primary-700',  bg: 'bg-primary-50',  label: 'Giao dịch' },
  security:    { icon: Shield,          color: 'text-red-600',      bg: 'bg-red-50',      label: 'Bảo mật'   },
  system:      { icon: Info,            color: 'text-green-600',    bg: 'bg-green-50',    label: 'Hệ thống'  },
  promo:       { icon: AlertTriangle,   color: 'text-amber-600',    bg: 'bg-amber-50',    label: 'Ưu đãi'    },
}

type FilterType = 'all' | NotifType

export function NotificationsPage() {
  const [items, setItems]       = useState<Notif[]>(MOCK_NOTIFS)
  const [filter, setFilter]     = useState<FilterType>('all')
  const [onlyUnread, setOnlyUnread] = useState(false)

  const unreadCount = items.filter(n => n.status === 'unread').length

  const markAllRead = () =>
    setItems(p => p.map(n => ({ ...n, status: 'read' as const })))

  const markRead = (id: string) =>
    setItems(p => p.map(n => n.id === id ? { ...n, status: 'read' as const } : n))

  const deleteOne = (id: string) =>
    setItems(p => p.filter(n => n.id !== id))

  const clearAll = () => setItems([])

  const filtered = items.filter(n => {
    if (onlyUnread && n.status !== 'unread') return false
    if (filter !== 'all' && n.type !== filter) return false
    return true
  })

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60_000)
    if (m < 1)  return 'Vừa xong'
    if (m < 60) return `${m} phút trước`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} giờ trước`
    const d = Math.floor(h / 24)
    if (d < 7)  return `${d} ngày trước`
    return formatDateTime(iso)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-800" />
            Thông báo
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-bidv-red text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{items.length} thông báo</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="secondary" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
            </Button>
          )}
          {items.length > 0 && (
            <Button size="sm" variant="outline" onClick={clearAll}>
              <Trash2 className="w-3.5 h-3.5" /> Xoá tất cả
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        {([
          { key: 'all',         label: 'Tất cả' },
          { key: 'transaction', label: 'Giao dịch' },
          { key: 'security',    label: 'Bảo mật' },
          { key: 'system',      label: 'Hệ thống' },
          { key: 'promo',       label: 'Ưu đãi' },
        ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-primary-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setOnlyUnread(!onlyUnread)}
          className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            onlyUnread
              ? 'bg-bidv-red/10 border-bidv-red/30 text-bidv-red'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <Bell className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">Không có thông báo</p>
            <p className="text-gray-300 text-sm mt-1">Tất cả đã được xử lý rồi!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const cfg = TYPE_CFG[notif.type]
            const Icon = cfg.icon
            const isUnread = notif.status === 'unread'
            return (
              <div
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`group relative flex gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  isUnread
                    ? 'bg-white border-primary-100 shadow-card hover:shadow-card-hover'
                    : 'bg-gray-50 border-gray-100 hover:bg-white'
                }`}
              >
                {/* Unread dot */}
                {isUnread && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-bidv-red rounded-full" />
                )}

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(notif.time)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {isUnread && (
                      <button
                        onClick={e => { e.stopPropagation(); markRead(notif.id) }}
                        className="text-[10px] text-gray-400 hover:text-primary-700 flex items-center gap-0.5"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete btn */}
                <button
                  onClick={e => { e.stopPropagation(); deleteOne(notif.id) }}
                  className="opacity-0 group-hover:opacity-100 self-start mt-0.5 p-1 text-gray-300 hover:text-red-500 transition-all rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
