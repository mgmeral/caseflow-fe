import { clsx } from 'clsx'
import type { TicketPriority } from '@/types/ticket.types'

interface PriorityConfig {
  label: string
  classes: string
}

const PRIORITY_CONFIG: Record<TicketPriority, PriorityConfig> = {
  critical: { label: 'Critical', classes: 'bg-red-50 text-red-700 border-red-200/70' },
  high: { label: 'High', classes: 'bg-orange-50 text-orange-700 border-orange-200/70' },
  medium: { label: 'Medium', classes: 'bg-amber-50 text-amber-700 border-amber-200/70' },
  low: { label: 'Low', classes: 'bg-gray-50 text-gray-600 border-gray-200/70' },
}

interface PriorityBadgeProps {
  priority: TicketPriority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
        config.classes,
      )}
    >
      {config.label}
    </span>
  )
}
