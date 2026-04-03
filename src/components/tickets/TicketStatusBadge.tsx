import { Badge } from '@/components/shared/Badge'
import type { TicketStatus } from '@/types/ticket.types'

interface StatusConfig {
  label: string
  variant: 'default' | 'success' | 'error' | 'warning' | 'info' | 'outline'
}

const STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  NEW: { label: 'New', variant: 'info' },
  TRIAGED: { label: 'Triaged', variant: 'warning' },
  ASSIGNED: { label: 'Assigned', variant: 'warning' },
  IN_PROGRESS: { label: 'In Progress', variant: 'info' },
  WAITING_CUSTOMER: { label: 'Waiting Customer', variant: 'default' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'outline' },
  REOPENED: { label: 'Reopened', variant: 'warning' },

  // Legacy aliases
  new: { label: 'New', variant: 'info' },
  open: { label: 'Assigned', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'info' },
  pending: { label: 'Waiting Customer', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'outline' },
  transferred: { label: 'Assigned', variant: 'warning' },
}

interface TicketStatusBadgeProps {
  status: TicketStatus
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
