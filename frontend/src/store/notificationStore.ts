import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type NotifType = 'transaction' | 'security' | 'system' | 'promo'
type NotifStatus = 'unread' | 'read'

export interface Notif {
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

export interface NotificationState {
  items: Notif[]
  markRead: (id: string) => void
  markAllRead: () => void
  deleteOne: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      items: MOCK_NOTIFS,

      markRead: (id) =>
        set((s) => ({
          items: s.items.map((n) => (n.id === id ? { ...n, status: 'read' as const } : n)),
        })),

      markAllRead: () =>
        set((s) => ({
          items: s.items.map((n) => ({ ...n, status: 'read' as const })),
        })),

      deleteOne: (id) =>
        set((s) => ({ items: s.items.filter((n) => n.id !== id) })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'finance-notifications',
    }
  )
)
