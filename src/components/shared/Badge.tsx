import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'outline'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-gray-50 text-gray-600 border-gray-200/70',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  error: 'bg-red-50 text-red-700 border-red-200/70',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/70',
  info: 'bg-blue-50 text-blue-700 border-blue-200/70',
  outline: 'bg-white text-gray-500 border-gray-200',
}

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
