import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'
type ModalVariant = 'default' | 'admin'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: ModalSize
  footer?: ReactNode
  variant?: ModalVariant
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ isOpen, onClose, title, children, size = 'md', footer, variant = 'default' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/28 backdrop-blur-md" />

      <div
        className={clsx(
          'relative flex max-h-[90vh] w-full flex-col overflow-hidden',
          variant === 'admin' ? 'admin-modal' : 'operational-modal',
          SIZE_CLASSES[size],
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={clsx(
          'flex shrink-0 items-center justify-between px-6 py-4',
          variant === 'admin'
            ? 'admin-modal-header'
            : 'operational-modal-header',
        )}>
          <h2 id="modal-title" className={clsx(
            'text-[15px] font-semibold tracking-[-0.02em]',
            variant === 'admin' ? 'text-blue-50' : 'text-slate-900',
          )}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="ui-icon-button h-9 w-9"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className={clsx(
          'min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6',
          variant === 'admin' ? 'admin-modal-body' : 'operational-modal-body',
        )}>{children}</div>

        {footer && (
          <div className={clsx(
            'flex shrink-0 items-center justify-end gap-3 px-6 py-4',
            variant === 'admin'
              ? 'admin-modal-footer'
              : 'operational-modal-footer',
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
