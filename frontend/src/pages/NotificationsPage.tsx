import { useState } from 'react'
import {
  Bell, ArrowLeftRight, Shield, AlertTriangle,
  Info, CheckCircle2, Trash2, CheckCheck, Filter
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/utils/format'
import { useNotificationStore } from '@/store/notificationStore'
import type { Notif } from '@/store/notificationStore'

type NotifType = 'transaction' | 'security' | 'system' | 'promo'

const TYPE_CFG: Record<NotifType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  transaction: { icon: ArrowLeftRight, color: 'text-primary-700',  bg: 'bg-primary-50',  label: 'Giao dịch' },
  security:    { icon: Shield,          color: 'text-red-600',      bg: 'bg-red-50',      label: 'Bảo mật'   },
  system:      { icon: Info,            color: 'text-green-600',    bg: 'bg-green-50',    label: 'Hệ thống'  },
  promo:       { icon: AlertTriangle,   color: 'text-amber-600',    bg: 'bg-amber-50',    label: 'Ưu đãi'    },
}

type FilterType = 'all' | NotifType

export function NotificationsPage() {
  const { items, markRead, markAllRead, deleteOne, clearAll } = useNotificationStore()
  const [filter, setFilter]         = useState<FilterType>('all')
  const [onlyUnread, setOnlyUnread] = useState(false)

  const unreadCount = items.filter(n => n.status === 'unread').length

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
          {filtered.map((notif: Notif) => {
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
