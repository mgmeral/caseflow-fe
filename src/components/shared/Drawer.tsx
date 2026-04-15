import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}

export function Drawer({ isOpen, onClose, title, children, footer, width = 'w-96' }: DrawerProps) {
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
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-md" onClick={onClose} />

      <div
        className={clsx(
          'operational-drawer relative h-full rounded-none rounded-l-[1.75rem] flex flex-col',
          width,
          'animate-in slide-in-from-right duration-200',
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="operational-drawer-header flex shrink-0 items-center justify-between px-6 py-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="ui-icon-button h-9 w-9"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="operational-drawer-body flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="operational-drawer-footer flex shrink-0 items-center justify-end gap-3 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
