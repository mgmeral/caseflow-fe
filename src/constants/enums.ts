export const TICKET_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  TRIAGED: 'Triaged',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  WAITING_CUSTOMER: 'Waiting Customer',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',

  // Legacy aliases
  new: 'New',
  open: 'Assigned',
  in_progress: 'In Progress',
  pending: 'Waiting Customer',
  resolved: 'Resolved',
  closed: 'Closed',
  transferred: 'Assigned',
}

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
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
