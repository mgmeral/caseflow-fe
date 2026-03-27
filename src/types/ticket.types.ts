export type TicketStatus =
  | 'new'
  | 'open'
  | 'in_progress'
  | 'pending'
  | 'resolved'
  | 'closed'
  | 'transferred'

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low'

/** Backend NoteType enum — also re-exported from api.types.ts */
export type NoteType = 'public_reply' | 'internal_note' | 'system_event'

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
  customerSegment: string
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
