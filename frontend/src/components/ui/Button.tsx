import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'cta' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantMap = {
  // BIDV blue — hành động thông thường
  primary:   'bg-primary-900 text-white hover:bg-primary-800 focus:ring-primary-700 shadow-sm',
  // BIDV red — hành động chính (đăng nhập, xác nhận)
  cta:       'bg-bidv-red text-white hover:bg-bidv-red-hover focus:ring-bidv-red shadow-sm',
  secondary: 'bg-primary-50 text-primary-900 hover:bg-primary-100 focus:ring-primary-300 border border-primary-200',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost:     'text-primary-900 hover:bg-primary-50 focus:ring-primary-300',
  outline:   'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300',
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-sm font-semibold',
}

export function Button({
  children, variant = 'primary', size = 'md',
  loading, disabled, className, ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'transition-all duration-150',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
