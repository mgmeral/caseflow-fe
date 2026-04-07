import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { clsx } from 'clsx'
import { useUIStore } from '@/store/ui.store'
import type { Toast as ToastItem, ToastType } from '@/store/ui.store'

const TYPE_CONFIG: Record<
  ToastType,
  { icon: typeof CheckCircle; bg: string; border: string; icon_color: string; text: string }
> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon_color: 'text-green-500',
    text: 'text-green-800',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon_color: 'text-red-500',
    text: 'text-red-800',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon_color: 'text-amber-500',
    text: 'text-amber-800',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon_color: 'text-blue-500',
    text: 'text-blue-800',
  },
}

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const config = TYPE_CONFIG[toast.type]
  const Icon = config.icon

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border shadow-elevated min-w-[300px] max-w-[400px]',
        config.bg,
        config.border,
      )}
      role="alert"
    >
      <Icon size={18} className={clsx('shrink-0 mt-0.5', config.icon_color)} />
      <p className={clsx('flex-1 text-sm font-medium', config.text)}>{toast.message}</p>
      <button
        onClick={onDismiss}
        className={clsx('shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity', config.text)}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  )
}
