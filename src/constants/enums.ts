export const TICKET_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  open: 'Open',
  in_progress: 'In Progress',
  pending: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
  transferred: 'Transferred',
}

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const CUSTOMER_SEGMENT_LABELS: Record<string, string> = {
  bank: 'Bank',
  insurance: 'Insurance',
  leasing: 'Leasing',
  corporate: 'Corporate',
  other: 'Other',
}

export const USER_ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  agent: 'Agent',
  supervisor: 'Supervisor',
  trade_agent: 'Trade Agent',
  operation_agent: 'Operations Agent',
  viewer: 'Viewer',
}

// Convenient aliases
export const SEGMENT_LABELS = CUSTOMER_SEGMENT_LABELS
export const ROLE_LABELS = USER_ROLE_LABELS

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export const DEFAULT_PAGE_SIZE = 25

export const AVATAR_COLORS = [
  '#4f46e5',
  '#0891b2',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0d9488',
  '#c2410c',
]
