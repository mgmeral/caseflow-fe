import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  children: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-[linear-gradient(180deg,#2f7bff_0%,#1258e3_100%)] text-white shadow-card hover:-translate-y-[1px] hover:shadow-elevated active:translate-y-0 active:shadow-card focus:ring-[#1258e3]/28 disabled:bg-[#9bbcf6] disabled:shadow-none',
  secondary:
    'border-[#c6d8ff]/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.8)_0%,rgba(236,244,255,0.72)_100%)] text-[#17407a] shadow-soft hover:-translate-y-[1px] hover:border-[#7faeff] hover:bg-[linear-gradient(180deg,rgba(248,251,255,0.94)_0%,rgba(229,240,255,0.88)_100%)] hover:text-[#0f53d3] hover:shadow-card focus:ring-[#1f6fff]/18 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none',
  danger:
    'border-transparent bg-[linear-gradient(180deg,#ef4444_0%,#dc2626_100%)] text-white shadow-card hover:-translate-y-[1px] hover:shadow-elevated active:translate-y-0 focus:ring-red-500/25 disabled:bg-red-300 disabled:shadow-none',
  ghost:
    'border border-transparent bg-white/[0.08] text-slate-600 hover:border-[#d0deff] hover:bg-[#edf4ff] hover:text-[#1258e3] hover:shadow-soft focus:ring-slate-400/20 disabled:text-slate-400',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[13px] gap-1.5',
  md: 'px-4 py-2 text-[13px] gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg border font-semibold tracking-[-0.015em]',
        'focus:outline-none focus:ring-4 focus:ring-offset-0',
        'transition-all duration-200',
        'disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="animate-spin shrink-0" size={size === 'lg' ? 18 : 16} />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
    </button>
  )
}
