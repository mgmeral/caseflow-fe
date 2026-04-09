import type {
  MailProvider,
  MailboxSourceType,
  InboundMode,
  InitialSyncStrategy,
  MailboxAuthType,
  OutboundDispatchStatus,
  OutboundMode,
  PollingStatus,
  ProcessingStatus,
  SenderMatchType,
  TicketEmailDetailType,
  UnknownSenderPolicy,
} from './api.types'
import type { TicketPriority } from './ticket.types'

export interface EmailAttachment {
  id: string | null
  fileName: string
  contentType: string | null
  size: number | null
  sizeBytes: number | null
  previewSupported?: boolean | null
  previewUrl?: string | null
  openUrl?: string | null
  downloadPath?: string | null
  downloadUrl: string | null
}

export interface Mailbox {
  id: string
  name: string
  address: string
  displayName: string | null
  mailProvider: MailProvider | null
  authType: MailboxAuthType | null
  providerType: MailboxSourceType
  inboundMode: InboundMode
  outboundMode: OutboundMode
  oauthTenantId: string | null
  oauthClientId: string | null
  oauthConfigured: boolean | null
  imapHost: string | null
  imapPort: number | null
  imapUsername: string | null
  imapUseSsl: boolean | null
  imapFolder: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpUsername: string | null
  smtpStarttls: boolean | null
  smtpUseSsl: boolean | null
  pollingEnabled: boolean
  pollIntervalSeconds: number
  initialSyncStrategy: InitialSyncStrategy | null
  cursorInitStrategy: InitialSyncStrategy | string | null
  lastSeenUid: string | null
  activationState: string | null
  pollingStatus: PollingStatus | null
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
  allowSubdomains?: boolean | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface TicketEmailMessage {
  id: string
  emailDocumentId: string | null
  ticketId: string
  threadKey: string | null
  messageId: string
  threadMessageId?: string | null
  providerMessageId: string | null
  mailboxId: string | null
  mailboxName: string | null
  mailboxAddress?: string | null
  sourceEventId: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  subject: string | null
  from: string | null
  to: string[]
  cc: string[]
  bcc: string[]
  replyTo?: string[] | null
  bodyText: string | null
  bodyHtml: string | null
  sanitizedHtmlBody: string | null
  rawHtmlBody: string | null
  bodyPreview: string | null
  status?: string | null
  failureReason?: string | null
  sentAt: string | null
  receivedAt: string | null
  createdAt?: string | null
  processingStatus: ProcessingStatus | null
  dispatchStatus: OutboundDispatchStatus | null
  attachmentCount: number
  attachments: EmailAttachment[]
  resolvedReplyTarget?: string | null
  detailType?: TicketEmailDetailType | null
  detailId?: string | null
  hasAttachments?: boolean
  isPreviewAvailable?: boolean
  templateInfo?: {
    templateId: string | null
    templateCode: string | null
    templateName: string | null
  } | null
  replyContext?: {
    sourceEventId: string | null
    sourceEmailDocumentId: string | null
    resolvedReplyTarget: string | null
  } | null
  contentWasEdited?: boolean | null
}

export interface TicketReplyPreviewPlaceholderDiagnostic {
  placeholder: string
  status: 'EMPTY' | 'UNKNOWN'
  message: string
}

export interface TicketReplyPreview {
  derivedToAddress: string | null
  derivedFromAddress: string | null
  subject: string
  bodyText: string | null
  bodyHtml: string | null
  templateInfo: {
    templateId: string | null
    templateCode: string | null
    templateName: string | null
  } | null
  placeholderDiagnostics: TicketReplyPreviewPlaceholderDiagnostic[]
  warnings: string[]
  mailboxName: string | null
  mailboxAddress: string | null
  isEditable: boolean
}

export interface TicketReplyPreviewRequest {
  sourceEventId: string
  mailboxId?: string | null
  templateId?: string | null
}

interface BaseSendTicketReplyRequest {
  mailboxId: string | null
  subject: string
  textBody?: string
  htmlBody?: string
  inReplyToMessageId?: string
  contentWasEdited?: boolean
  templateId?: string | null
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