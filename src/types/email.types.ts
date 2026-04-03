import type {
  MailboxSourceType,
  InboundMode,
  InitialSyncStrategy,
  OutboundDispatchStatus,
  OutboundMode,
  PollingStatus,
  ProcessingStatus,
  SenderMatchType,
  UnknownSenderPolicy,
} from './api.types'
import type { TicketPriority } from './ticket.types'

export interface EmailAttachment {
  id: string | null
  fileName: string
  contentType: string | null
  size: number | null
  sizeBytes: number | null
  downloadUrl: string | null
}

export interface Mailbox {
  id: string
  name: string
  address: string
  displayName: string | null
  providerType: MailboxSourceType
  inboundMode: InboundMode
  outboundMode: OutboundMode
  imapHost: string | null
  imapPort: number | null
  imapUsername: string | null
  imapUseSsl: boolean | null
  imapFolder: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpUsername: string | null
  smtpUseSsl: boolean | null
  pollingEnabled: boolean
  pollIntervalSeconds: number
  initialSyncStrategy: InitialSyncStrategy | null
  cursorInitStrategy: InitialSyncStrategy | string | null
  lastSeenUid: string | null
  activationState: string | null
  pollingStatus: PollingStatus
  isActive: boolean
  defaultGroupId: string | null
  defaultPriority: TicketPriority | string | null
  lastPollAt: string | null
  lastPollError: string | null
  lastSuccessfulInboundAt: string | null
  lastSuccessfulOutboundAt: string | null
  createdAt: string | null
  updatedAt: string | null
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
  isEnabled: boolean
  allowSubdomains: boolean
  unknownSenderPolicy: UnknownSenderPolicy
  defaultGroupId: string | null
  defaultGroupName: string | null
  defaultPriority: TicketPriority | string | null
  updatedAt: string | null
}

export interface CustomerEmailRoutingRule {
  id: string
  customerId: string
  recipientMailboxId: string | null
  recipientMailboxName: string | null
  senderMatchType: SenderMatchType
  senderMatchValue: string
  priority: number
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface IngressEvent {
  id: string
  publicId: string | null
  mailboxId: string | null
  mailboxName: string | null
  mailboxEmail: string | null
  sourceType: MailboxSourceType | null
  sourceUid: string | null
  internetMessageId: string | null
  subject: string | null
  sender: string | null
  processingStatus: ProcessingStatus
  receivedAt: string
  processedAt: string | null
  lastError: string | null
  failureReason: string | null
  processingAttempts: number | null
  lastAttemptAt: string | null
  relatedTicketId: string | null
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
  retryCount: number
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
  sourceEventId: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  subject: string | null
  from: string | null
  to: string[]
  cc: string[]
  bcc: string[]
  bodyText: string | null
  bodyHtml: string | null
  sanitizedHtmlBody: string | null
  rawHtmlBody: string | null
  bodyPreview: string | null
  sentAt: string | null
  receivedAt: string | null
  processingStatus: ProcessingStatus | null
  dispatchStatus: OutboundDispatchStatus | null
  attachmentCount: number
  attachments: EmailAttachment[]
}

interface BaseSendTicketReplyRequest {
  mailboxId: string | null
  subject: string
  textBody?: string
  htmlBody?: string
  inReplyToMessageId?: string
}

export interface ThreadedSendTicketReplyRequest extends BaseSendTicketReplyRequest {
  sourceEventId: string
  toAddress?: never
}

export interface DirectSendTicketReplyRequest extends BaseSendTicketReplyRequest {
  sourceEventId?: never
  toAddress: string
}

export type SendTicketReplyRequest = ThreadedSendTicketReplyRequest | DirectSendTicketReplyRequest

export interface SendTicketReplyResult {
  requestId: string
  ticketId: string
  outboundEmailId: string | null
  mailboxId: string | null
  status: OutboundDispatchStatus | 'UNKNOWN'
  acceptedAt: string | null
  message: string | null
}