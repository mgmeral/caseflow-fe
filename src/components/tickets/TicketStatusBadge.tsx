import { Badge } from '@/components/shared/Badge'
import type { TicketStatus } from '@/types/ticket.types'

interface StatusConfig {
  label: string
  variant: 'default' | 'success' | 'error' | 'warning' | 'info' | 'outline'
}

const STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  new: { label: 'New', variant: 'info' },
  open: { label: 'Open', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'info' },
  pending: { label: 'Pending', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'outline' },
  transferred: { label: 'Transferred', variant: 'warning' },
}

interface TicketStatusBadgeProps {
  status: TicketStatus
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
