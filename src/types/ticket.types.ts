export type TicketStatus =
  // Backend enum values (source of truth)
  | 'NEW'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  // Legacy FE aliases kept for backward compatibility
  | 'new'
  | 'open'
  | 'in_progress'
  | 'pending'
  | 'resolved'
  | 'closed'
  | 'transferred'

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low'

/** Backend NoteType enum — uppercase values matching backend contract */
export type NoteType = 'INTERNAL' | 'INFO' | 'INVESTIGATION' | 'ESCALATION'

/** FE view model for conversation thread (combines notes + emails) */
export type MessageType =
  | 'public_inbound'
  | 'public_outbound'
  | 'internal_note'
  | 'system_event'

export type SourceType = 'email' | 'manual' | 'api'

export interface Ticket {
  id: string
  ticketNo: string
  subject: string
  customerId: string
  customerName: string
  groupId: string
  groupName: string
  assignedUserId: string | null
  assignedUserName: string | null
  status: TicketStatus
  priority: TicketPriority
  sourceType: SourceType
  isUnread: boolean
  isTransferred: boolean
  transferredFromGroup: string | null
  createdAt: string
  updatedAt: string
  lastActionAt: string
  lastActionSummary: string
  openDurationMinutes: number
  slaDeadlineAt: string | null
  slaBreached: boolean
  messageCount: number
  internalNoteCount: number
  tags: string[]
  allowedTransitions?: TicketStatus[]
  attachments: TicketAttachment[]
}

export interface TicketAttachment {
  id: string
  ticketId: string | null
  emailId: string | null
  fileName: string
  contentType: string | null
  size: number | null
  downloadUrl: string | null
  uploadedAt: string | null
}

export interface TicketMessage {
  id: string
  ticketId: string
  type: MessageType
  authorId: string | null
  authorName: string
  content: string
  createdAt: string
  attachments: string[]
}

export interface TransferRecord {
  id: string
  ticketId: string
  fromGroupId: string
  fromGroupName: string
  toGroupId: string
  toGroupName: string
  transferredByName: string
  reason: string
  note: string | null
  createdAt: string
}

export interface TicketActivityItem {
  id: string
  kind:
    | 'created'
    | 'status_changed'
    | 'assigned'
    | 'transferred'
    | 'note_added'
    | 'reply_queued'
    | 'reply_sending'
    | 'reply_sent'
    | 'reply_failed'
    | 'template_used'
    | 'customer_reply'
    | 'system'
  actor: string | null
  timestamp: string
  summary: string
  detail?: string | null
}

export interface TicketFilters {
  search: string
  statuses: TicketStatus[]
  priorities: TicketPriority[]
  assignedUserIds: string[]
  groupIds: string[]
  dateFrom: string | null
  dateTo: string | null
  unassignedOnly: boolean
  overdueOnly: boolean
  openOnly: boolean
  transferredOnly: boolean
}
