import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode | { label: string; onClick: () => void }
}

function isActionObject(a: NonNullable<EmptyStateProps['action']>): a is { label: string; onClick: () => void } {
  return typeof (a as { label?: string }).label === 'string'
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="surface-card flex flex-col items-center justify-center px-5 py-14 text-center">
      {icon && (
        <div className="surface-tint mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] text-slate-600 shadow-soft">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-base font-semibold tracking-[-0.02em] text-slate-900">{title}</h3>
      {description && <p className="mb-5 max-w-sm text-sm leading-6 text-slate-500">{description}</p>}
      {action && (
        <div className="mt-2">
          {isActionObject(action) ? (
            <Button variant="secondary" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  )
}
