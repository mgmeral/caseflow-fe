import type {
  CustomerEmailRoutingRuleMatchType,
  IngressStatus,
  MailboxInboundMode,
  MailboxOutboundMode,
  MailboxProviderType,
  OutboundDispatchStatus,
  UnknownSenderPolicy,
} from './api.types'
import type { TicketPriority, TicketStatus } from './ticket.types'

export interface EmailAttachment {
  id: string | null
  fileName: string
  contentType: string | null
  size: number | null
  downloadUrl: string | null
}

export interface Mailbox {
  id: string
  name: string
  emailAddress: string
  displayName: string | null
  providerType: MailboxProviderType
  inboundMode: MailboxInboundMode
  outboundMode: MailboxOutboundMode
  isActive: boolean
  inboundEnabled: boolean
  outboundEnabled: boolean
  defaultGroupId: string | null
  defaultGroupName: string | null
  defaultPriority: TicketPriority | string | null
  defaultStatus: TicketStatus | string | null
  unknownSenderPolicy: UnknownSenderPolicy
  lastInboundSuccessAt: string | null
  lastOutboundSuccessAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MailboxListResult {
  items: Mailbox[]
  page: number
  size: number
  total: number
  totalPages: number
}

export interface CustomerEmailSettings {
  customerId: string
  customerName: string | null
  mailboxId: string | null
  mailboxName: string | null
  trustedContactsOnly: boolean
  autoCreateContact: boolean
  allowSubdomains: boolean
  unknownSenderPolicy: UnknownSenderPolicy
  defaultGroupId: string | null
  defaultGroupName: string | null
  defaultPriority: TicketPriority | string | null
  defaultStatus: TicketStatus | string | null
  updatedAt: string | null
}

export interface CustomerEmailRoutingRule {
  id: string
  customerId: string
  matchType: CustomerEmailRoutingRuleMatchType
  matchValue: string
  mailboxId: string | null
  mailboxName: string | null
  groupId: string | null
  groupName: string | null
  priority: TicketPriority | string | null
  status: TicketStatus | string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IngressEvent {
  id: string
  mailboxId: string | null
  mailboxName: string | null
  mailboxAddress: string | null
  providerType: MailboxProviderType | null
  messageId: string
  subject: string | null
  sender: string | null
  status: IngressStatus
  receivedAt: string
  processedAt: string | null
  lastErrorSummary: string | null
}

export interface IngressEventListResult {
  items: IngressEvent[]
  page: number
  size: number
  total: number
  totalPages: number
}

export interface IngressEventDetail extends IngressEvent {
  recipients: string[]
  cc: string[]
  rawHeaders: Record<string, string>
  payloadExcerpt: string | null
  quarantineReason: string | null
  quarantinedAt: string | null
  replayedAt: string | null
  relatedTicketId: string | null
}

export interface TicketEmailMessage {
  id: string
  ticketId: string
  threadKey: string | null
  messageId: string
  providerMessageId: string | null
  mailboxId: string | null
  mailboxName: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  subject: string | null
  from: string | null
  to: string[]
  cc: string[]
  bcc: string[]
  bodyText: string | null
  bodyHtml: string | null
  bodyPreview: string | null
  sentAt: string | null
  receivedAt: string | null
  dispatchStatus: OutboundDispatchStatus | null
  attachments: EmailAttachment[]
}

export interface SendTicketReplyRequest {
  mailboxId: string | null
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  body: string
  isHtml: boolean
  attachments: File[]
}

export interface SendTicketReplyResult {
  requestId: string
  ticketId: string
  outboundEmailId: string | null
  mailboxId: string | null
  status: OutboundDispatchStatus
  acceptedAt: string | null
  message: string | null
}