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

export interface TicketTag {
  id: string
  code: string
  name: string
  color: string | null
  isActive: boolean
}

export interface TicketTagAssignment {
  id: string
  ticketId: string
  tagId: string
  taggedAt: string | null
  taggedBy: string | null
  taggedByName: string | null
  tagCode: string | null
  tagName: string | null
  tagColor: string | null
  tagIsActive: boolean
  tag: TicketTag | null
}

export interface TicketTagBreakdown {
  tagId: string
  tagCode: string
  tagName: string
  tagColor: string | null
  count: number
}

export interface CustomerTicketReport {
  totalCount: number
  openCount: number
  closedCount: number
  resolvedCount: number
  newCount: number
  inProgressCount: number
  waitingCustomerCount: number
  reopenedCount: number
  byTag: TicketTagBreakdown[]
}

export interface AdminCustomerTicketAggregateItem {
  customerId: string
  customerName: string
  customerColorHex: string | null
  totalCount: number
  openCount: number
  closedCount: number
  resolvedCount: number
  waitingCustomerCount: number
  byTag: TicketTagBreakdown[]
}

export interface AdminCustomerTicketAggregateReport {
  items: AdminCustomerTicketAggregateItem[]
  page: number
  size: number
  total: number
  totalPages: number
}

export interface Ticket {
  id: string
  publicId: string | null
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
  tags: TicketTag[]
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
  previewSupported?: boolean | null
  previewUrl?: string | null
  openUrl?: string | null
  downloadUrl: string | null
  uploadedAt: string | null
}

export interface TicketMessage {
  id: string
  ticketId: string
  type: MessageType
  authorId: string | null
  authorName: string
  authorUser?: {
    id: string | null
    username?: string | null
    displayName?: string | null
    fullName?: string | null
    email?: string | null
  } | null
  content: string
  mentions?: Array<{
    userId: string
    displayText: string
    displayName?: string | null
    fullName?: string | null
    username?: string | null
    email?: string | null
    startIndex?: number | null
    endIndex?: number | null
  }>
  createdAt: string
  attachments: string[]
  eventType?: string | null
  metadataJson?: string | null
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
    | 'priority_changed'
    | 'assigned'
    | 'transferred'
    | 'note_added'
    | 'reply_queued'
    | 'reply_sending'
    | 'reply_sent'
    | 'reply_failed'
    | 'template_used'
    | 'customer_reply'
    | 'jira_requested'
    | 'jira_created'
    | 'jira_failed'
    | 'notification_sent'
    | 'notification_failed'
    | 'scheduled_email_created'
    | 'scheduled_email_canceled'
    | 'scheduled_email_failed'
    | 'system'
  actor: string | null
  timestamp: string
  summary: string
  detail?: string | null
  linkLabel?: string | null
  linkUrl?: string | null
}

export interface TicketFilters {
  search: string
  statuses: TicketStatus[]
  priorities: TicketPriority[]
  assignedUserIds: string[]
  groupIds: string[]
  tagIds: string[]
  tagCodes: string[]
  dateFrom: string | null
  dateTo: string | null
  unassignedOnly: boolean
  overdueOnly: boolean
  openOnly: boolean
  transferredOnly: boolean
}
