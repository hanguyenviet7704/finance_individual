import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight,
  FileText, ShieldAlert, BookOpen,
  LogOut, Users, Settings, Home,
  PiggyBank, BarChart3, Bell, UserCircle
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/authApi'

const MOCK_UNREAD = 3   // số thông báo chưa đọc (sau này kéo từ API)

const customerNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan'   },
  { to: '/account',   icon: CreditCard,      label: 'Tài khoản'   },
  { to: '/payment',   icon: ArrowLeftRight,  label: 'Giao dịch & Lịch sử' },
  { to: '/loan',      icon: PiggyBank,       label: 'Vay vốn'     },
  { to: '/report',    icon: BarChart3,       label: 'Sao kê'      },
]

const adminSystemItems = [
  { to: '/admin/accounts',     icon: Users,          label: 'Quản lý TK'       },
  { to: '/admin/transactions', icon: ArrowLeftRight, label: 'Giao dịch'        },
  { to: '/admin/fraud',        icon: ShieldAlert,    label: 'Fraud Detection'  },
  { to: '/admin/audit',        icon: BookOpen,       label: 'Audit Logs'       },
]

const adminPersonalItems = [
  { to: '/account', icon: CreditCard, label: 'Tài khoản cá nhân' },
  { to: '/report',  icon: FileText,   label: 'Báo cáo'           },
]

function NavItem({ to, icon: Icon, label, badge }: {
  to: string; icon: React.ElementType; label: string; badge?: number
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => clsx(
        'relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 rounded-lg',
        isActive
          ? 'text-white bg-white/10 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-5 before:bg-bidv-red before:rounded-r-full'
          : 'text-primary-200 hover:text-white hover:bg-white/8'
      )}
    >
      <Icon className="w-4.5 h-4.5 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-bidv-red text-white text-[10px] font-bold">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const isAdmin = user?.roles?.includes('admin')

  const handleLogout = async () => {
    await authApi.logout()
    logout()
  }

  const initials = user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <aside className="w-60 min-h-screen bg-bidv-gradient2 flex flex-col border-r border-white/5 shadow-bidv shrink-0">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <Home className="w-5 h-5 text-primary-900" />
          </div>
          <div>
            <p className="text-white font-black text-lg leading-none tracking-wide">BIDV</p>
            <p className="text-primary-200 text-[10px] leading-tight mt-0.5">SmartBanking</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {isAdmin ? (
          <>
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="text-[10px] font-bold bg-bidv-red text-white px-2 py-0.5 rounded">ADMIN</span>
            </div>
            <p className="bidv-section-title flex items-center gap-1">
              <Settings className="w-3 h-3" /> Quản trị hệ thống
            </p>
            {adminSystemItems.map(item => <NavItem key={item.to} {...item} />)}
            <p className="bidv-section-title">Cá nhân</p>
            {adminPersonalItems.map(item => <NavItem key={item.to} {...item} />)}
          </>
        ) : (
          <>
            <p className="bidv-section-title">Menu chính</p>
            {customerNavItems.map(item => <NavItem key={item.to} {...item} />)}
          </>
        )}

        {/* Common — hiện với cả customer & admin */}
        <p className="bidv-section-title">Tài khoản</p>
        <NavItem to="/notifications" icon={Bell}       label="Thông báo" badge={MOCK_UNREAD} />
        <NavItem to="/profile"       icon={UserCircle} label="Hồ sơ & Cài đặt" />
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
            isAdmin ? 'bg-bidv-red' : 'bg-white/20'
          )}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.email || 'Người dùng'}</p>
            <p className="text-primary-300 text-[11px]">{isAdmin ? 'Quản trị viên' : 'Khách hàng'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 flex items-center gap-2 w-full px-3 py-2 text-xs text-primary-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
