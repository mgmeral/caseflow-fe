import { clsx } from 'clsx'
import type { TicketPriority } from '@/types/ticket.types'

interface PriorityConfig {
  label: string
  classes: string
}

const PRIORITY_CONFIG: Record<TicketPriority, PriorityConfig> = {
  critical: { label: 'Critical', classes: 'bg-red-100 text-red-700 border-red-200' },
  high: { label: 'High', classes: 'bg-orange-50 text-orange-700 border-orange-200' },
  medium: { label: 'Medium', classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  low: { label: 'Low', classes: 'bg-gray-50 text-gray-600 border-gray-200' },
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
