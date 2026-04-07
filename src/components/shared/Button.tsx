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
    'bg-[#1a5dc4] text-white hover:bg-[#154fa8] focus:ring-[#1a5dc4]/40 border-transparent shadow-soft disabled:bg-blue-300 disabled:shadow-none',
  secondary:
    'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:ring-[#1a5dc4]/30 border-gray-200 shadow-soft disabled:bg-gray-50 disabled:text-gray-400 disabled:shadow-none',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/40 border-transparent shadow-soft disabled:bg-red-300 disabled:shadow-none',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400/30 border-transparent disabled:text-gray-400',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
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
        'inline-flex items-center justify-center font-medium rounded-lg border',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        'transition-all duration-150',
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
