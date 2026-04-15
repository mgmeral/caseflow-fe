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
  default: 'border-slate-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(241,245,249,0.84)_100%)] text-slate-600',
  success: 'border-emerald-200/70 bg-[linear-gradient(180deg,rgba(236,253,245,0.98)_0%,rgba(209,250,229,0.86)_100%)] text-emerald-800',
  error: 'border-rose-200/70 bg-[linear-gradient(180deg,rgba(255,241,242,0.98)_0%,rgba(254,226,226,0.86)_100%)] text-rose-800',
  warning: 'border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(254,243,199,0.88)_100%)] text-amber-800',
  info: 'border-blue-200/70 bg-[linear-gradient(180deg,rgba(239,246,255,0.98)_0%,rgba(219,234,254,0.88)_100%)] text-blue-800',
  outline: 'border-slate-200/80 bg-white/85 text-slate-500',
}

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-1 text-[11px]',
  md: 'px-3 py-1.5 text-sm',
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border font-semibold tracking-[0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
