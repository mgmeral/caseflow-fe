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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-xs mb-4">{description}</p>}
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
