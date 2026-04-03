import type {
  CustomerEmailRoutingRuleResponse,
  CustomerEmailSettingsResponse,
  IngressEventDetailResponse,
  IngressEventResponse,
  InitialSyncStrategy,
  MailboxResponse,
  SendTicketReplyResponse,
  TicketEmailAttachmentResponse,
  TicketEmailMessageResponse,
} from '@/types/api.types'
import type {
  CustomerEmailRoutingRule,
  CustomerEmailSettings,
  EmailAttachment,
  IngressEvent,
  IngressEventDetail,
  IngressEventListResult,
  Mailbox,
  MailboxListResult,
  SendTicketReplyResult,
  TicketEmailMessage,
} from '@/types/email.types'

const LEGACY_INITIAL_SYNC_STRATEGY_MAP = {
  START_FROM_LATEST: 'NEW_MESSAGES_ONLY',
  BACKFILL_ALL: 'SCAN_FROM_START',
} as const satisfies Record<string, InitialSyncStrategy>

export function normalizeInitialSyncStrategy(value: InitialSyncStrategy | null | undefined): InitialSyncStrategy | null {
  if (!value) return null
  return LEGACY_INITIAL_SYNC_STRATEGY_MAP[value as keyof typeof LEGACY_INITIAL_SYNC_STRATEGY_MAP] ?? value
}

function normalizeAttachment(attachment: TicketEmailAttachmentResponse): EmailAttachment {
  return {
    id: attachment.id ?? null,
    fileName: attachment.fileName,
    contentType: attachment.contentType ?? null,
    size: attachment.sizeBytes ?? attachment.size ?? null,
    sizeBytes: attachment.sizeBytes ?? attachment.size ?? null,
    downloadUrl: attachment.downloadUrl ?? null,
  }
}

export function normalizeMailbox(mailbox: MailboxResponse): Mailbox {
  const pollingStatus = mailbox.pollingStatus ?? (mailbox.lastPollError ? 'ERROR' : 'IDLE')
  const initialSyncStrategy = normalizeInitialSyncStrategy(mailbox.initialSyncStrategy)
  const cursorInitStrategy = normalizeInitialSyncStrategy(mailbox.cursorInitStrategy as InitialSyncStrategy | null | undefined) ?? mailbox.cursorInitStrategy ?? null

  return {
    id: String(mailbox.id),
    name: mailbox.name,
    address: mailbox.address ?? '',
    displayName: mailbox.displayName ?? null,
    providerType: mailbox.providerType ?? 'IMAP',
    inboundMode: mailbox.inboundMode ?? 'POLLING',
    outboundMode: mailbox.outboundMode ?? 'SMTP',
    imapHost: mailbox.imapHost ?? null,
    imapPort: mailbox.imapPort ?? null,
    imapUsername: mailbox.imapUsername ?? null,
    imapUseSsl: mailbox.imapUseSsl ?? null,
    imapFolder: mailbox.imapFolder ?? null,
    smtpHost: mailbox.smtpHost ?? null,
    smtpPort: mailbox.smtpPort ?? null,
    smtpUsername: mailbox.smtpUsername ?? null,
    smtpUseSsl: mailbox.smtpUseSsl ?? null,
    pollingEnabled: mailbox.pollingEnabled ?? true,
    pollIntervalSeconds: mailbox.pollIntervalSeconds ?? 60,
    initialSyncStrategy,
    cursorInitStrategy,
    lastSeenUid: mailbox.lastSeenUid != null ? String(mailbox.lastSeenUid) : null,
    activationState: mailbox.activationState ?? null,
    pollingStatus,
    isActive: mailbox.isActive,
    defaultGroupId: mailbox.defaultGroupId != null ? String(mailbox.defaultGroupId) : null,
    defaultPriority: mailbox.defaultPriority ?? null,
    lastPollAt: mailbox.lastPollAt ?? null,
    lastPollError: mailbox.lastPollError ?? null,
    lastSuccessfulInboundAt: mailbox.lastSuccessfulInboundAt ?? null,
    lastSuccessfulOutboundAt: mailbox.lastSuccessfulOutboundAt ?? null,
    createdAt: mailbox.createdAt ?? null,
    updatedAt: mailbox.updatedAt ?? null,
  }
}

export function normalizeMailboxList(
  response: MailboxResponse[] | { items: MailboxResponse[]; page: number; size: number; totalElements: number; totalPages: number },
): MailboxListResult {
  if (Array.isArray(response)) {
    return {
      items: response.map(normalizeMailbox),
      page: 0,
      size: response.length,
      total: response.length,
      totalPages: response.length > 0 ? 1 : 0,
    }
  }

  return {
    items: response.items.map(normalizeMailbox),
    page: response.page,
    size: response.size,
    total: response.totalElements,
    totalPages: response.totalPages,
  }
}

export function normalizeCustomerEmailSettings(settings: CustomerEmailSettingsResponse): CustomerEmailSettings {
  const isEnabled = settings.isEnabled ?? settings.isActive ?? false
  return {
    customerId: settings.customerId,
    customerName: settings.customerName ?? null,
    isEnabled,
    allowSubdomains: settings.allowSubdomains,
    unknownSenderPolicy: settings.unknownSenderPolicy,
    defaultGroupId: settings.defaultGroupId ?? null,
    defaultGroupName: settings.defaultGroupName ?? null,
    defaultPriority: settings.defaultPriority ?? null,
    updatedAt: settings.updatedAt ?? null,
  }
}

export function normalizeCustomerEmailRoutingRule(rule: CustomerEmailRoutingRuleResponse): CustomerEmailRoutingRule {
  const senderMatchType = rule.senderMatchType === 'DOMAIN' ? 'DOMAIN_SUFFIX' : rule.senderMatchType
  const senderMatchValue = rule.senderMatchValue ?? rule.matchValue ?? ''
  return {
    id: rule.id,
    customerId: rule.customerId,
    recipientMailboxId: rule.recipientMailboxId ?? null,
    recipientMailboxName: rule.recipientMailboxName ?? null,
    senderMatchType,
    senderMatchValue,
    priority: rule.priority,
    isActive: rule.isActive,
    notes: rule.notes ?? null,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }
}

export function normalizeIngressEvent(event: IngressEventResponse): IngressEvent {
  const processingStatus = (event.processingStatus ?? event.status ?? 'RECEIVED') as IngressEvent['processingStatus']
  return {
    id: String(event.id),
    publicId: event.publicId ?? null,
    mailboxId: event.mailboxId != null ? String(event.mailboxId) : null,
    mailboxName: event.mailboxName ?? null,
    mailboxEmail: event.mailboxEmail ?? null,
    sourceType: event.sourceType ?? null,
    sourceUid: event.sourceUid ?? null,
    internetMessageId: event.internetMessageId ?? null,
    subject: event.subject ?? null,
    sender: event.sender ?? null,
    processingStatus,
    receivedAt: event.receivedAt,
    processedAt: event.processedAt ?? null,
    lastError: event.lastError ?? event.failureReason ?? null,
    failureReason: event.failureReason ?? null,
    processingAttempts: event.processingAttempts ?? null,
    lastAttemptAt: event.lastAttemptAt ?? null,
    relatedTicketId: event.ticketId != null ? String(event.ticketId) : null,
  }
}

export function normalizeIngressEventList(
  response: IngressEventResponse[] | { items: IngressEventResponse[]; page: number; size: number; totalElements: number; totalPages: number },
): IngressEventListResult {
  if (Array.isArray(response)) {
    return {
      items: response.map(normalizeIngressEvent),
      page: 0,
      size: response.length,
      total: response.length,
      totalPages: response.length > 0 ? 1 : 0,
    }
  }

  return {
    items: response.items.map(normalizeIngressEvent),
    page: response.page,
    size: response.size,
    total: response.totalElements,
    totalPages: response.totalPages,
  }
}

export function normalizeIngressEventDetail(event: IngressEventDetailResponse): IngressEventDetail {
  return {
    ...normalizeIngressEvent(event),
    recipients: event.recipients ?? [],
    cc: event.cc ?? [],
    rawHeaders: event.rawHeaders ?? {},
    payloadExcerpt: event.payloadExcerpt ?? null,
    retryCount: event.retryCount ?? 0,
    relatedTicketId: event.relatedTicketId ?? (event.ticketId != null ? String(event.ticketId) : null),
  }
}

export function normalizeTicketEmailMessage(message: TicketEmailMessageResponse): TicketEmailMessage {
  const direction = message.direction
  const status = message.status ?? null
  const timestamp = message.timestamp ?? null
  const from = message.from ?? message.fromAddress ?? null
  const to = message.to ?? (message.toAddress ? [message.toAddress] : [])
  const subject = message.subject ?? null
  const bodyPreview = message.bodyPreview ?? null
  const sentAt = message.sentAt ?? (direction === 'OUTBOUND' ? timestamp : null)
  const receivedAt = message.receivedAt ?? (direction === 'INBOUND' ? timestamp : null)
  const processingStatus = message.processingStatus ?? (direction === 'INBOUND' ? (status as TicketEmailMessage['processingStatus']) : null)
  const dispatchStatus = message.dispatchStatus ?? (direction === 'OUTBOUND' ? (status as TicketEmailMessage['dispatchStatus']) : null)
  const attachments = (message.attachments ?? []).map(normalizeAttachment)
  const sourceEventId = message.sourceEventId ?? message.sourceEmailEventId ?? message.ingressEventId ?? (direction === 'INBOUND' ? String(message.id) : null)

  return {
    id: String(message.id),
    ticketId: String(message.ticketId),
    threadKey: message.threadKey ?? null,
    messageId: message.messageId,
    providerMessageId: message.providerMessageId ?? null,
    mailboxId: message.mailboxId ?? null,
    mailboxName: message.mailboxName ?? null,
    sourceEventId: sourceEventId != null ? String(sourceEventId) : null,
    direction,
    subject,
    from,
    to,
    cc: message.cc ?? [],
    bcc: message.bcc ?? [],
    bodyText: message.bodyText ?? null,
    bodyHtml: message.bodyHtml ?? null,
    sanitizedHtmlBody: message.sanitizedHtmlBody ?? null,
    rawHtmlBody: message.rawHtmlBody ?? message.bodyHtml ?? null,
    bodyPreview,
    sentAt,
    receivedAt,
    processingStatus,
    dispatchStatus,
    attachmentCount: message.attachmentCount ?? attachments.length,
    attachments,
  }
}

export function normalizeSendTicketReplyResult(result: SendTicketReplyResponse | null | undefined): SendTicketReplyResult {
  if (!result) {
    return {
      requestId: '',
      ticketId: '',
      outboundEmailId: null,
      mailboxId: null,
      status: 'UNKNOWN',
      acceptedAt: null,
      message: null,
    }
  }

  return {
    requestId: result.requestId,
    ticketId: result.ticketId,
    outboundEmailId: result.outboundEmailId ?? null,
    mailboxId: result.mailboxId ?? null,
    status: result.status,
    acceptedAt: result.acceptedAt ?? null,
    message: result.message ?? null,
  }
}