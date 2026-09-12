import type {
  AdminCustomerTicketAggregateItemResponse,
  CustomerTicketReportResponse,
  CustomerEmailRoutingRuleResponse,
  CustomerEmailSettingsResponse,
  InitialSyncStrategy,
  MailProvider,
  MailboxAuthType,
  MailboxResponse,
  SendTicketReplyResponse,
  TagResponse,
  TicketTagResponse,
  TicketEmailAttachmentResponse,
  TicketEmailReplyPreviewResponse,
  TicketEmailMessageResponse,
  UnifiedTicketEmailDetailResponse,
} from '@/types/api.types'
import type {
  CustomerEmailRoutingRule,
  CustomerEmailSettings,
  EmailAttachment,
  Mailbox,
  MailboxListResult,
  SendTicketReplyResult,
  TicketReplyPreview,
  TicketEmailMessage,
} from '@/types/email.types'
import type { AdminCustomerTicketAggregateReport, AdminCustomerTicketAggregateItem, CustomerTicketReport, TicketTag, TicketTagAssignment, TicketTagBreakdown } from '@/types/ticket.types'
import { parseNumericContractId } from '@/lib/ticketEmailContracts'

const LEGACY_INITIAL_SYNC_STRATEGY_MAP = {
  START_FROM_LATEST: 'NEW_MESSAGES_ONLY',
  BACKFILL_ALL: 'SCAN_FROM_START',
} as const satisfies Record<string, InitialSyncStrategy>

function normalizeMailboxAuthType(value: MailboxAuthType | null | undefined): MailboxAuthType | null {
  if (!value) return null
  if (value === 'OAUTH2') return 'OAUTH2'
  return 'PASSWORD'
}

/**
 * Safely normalize any email address value coming from the backend into a
 * flat `string[]`.  The backend can send:
 *   - null / undefined                → []
 *   - "" (empty string)               → []
 *   - "addr@example.com"              → ["addr@example.com"]
 *   - ["a@b.com", "c@d.com"]          → ["a@b.com", "c@d.com"]
 *   - { address: "a@b.com", name: … } → ["a@b.com"]
 * Any other shape is silently dropped to prevent runtime crashes.
 */
export function normalizeAddressList(value: unknown): string[] {
  if (value == null) return []
  if (typeof value === 'string') return value.trim() ? [value.trim()] : []
  if (Array.isArray(value)) {
    return value.flatMap((v) => normalizeAddressList(v))
  }
  if (typeof value === 'object' && value !== null) {
    const addr = (value as Record<string, unknown>).address ?? (value as Record<string, unknown>).email
    if (typeof addr === 'string' && addr.trim()) return [addr.trim()]
  }
  return []
}

function inferMailProvider(mailbox: Pick<MailboxResponse, 'mailProvider' | 'authType' | 'imapHost' | 'smtpHost' | 'oauthTenantId' | 'oauthClientId'>): MailProvider {
  if (mailbox.mailProvider) return mailbox.mailProvider

  const imapHost = mailbox.imapHost?.toLowerCase() ?? ''
  const smtpHost = mailbox.smtpHost?.toLowerCase() ?? ''
  const authType = normalizeMailboxAuthType(mailbox.authType)

  if (
    authType === 'OAUTH2'
    || Boolean(mailbox.oauthTenantId)
    || Boolean(mailbox.oauthClientId)
    || imapHost.includes('outlook.office365.com')
    || smtpHost.includes('smtp.office365.com')
  ) {
    return 'OUTLOOK'
  }

  if (imapHost.includes('gmail.com') || smtpHost.includes('gmail.com')) {
    return 'GMAIL'
  }

  return 'OTHER'
}

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
    previewSupported: attachment.previewSupported ?? null,
    previewUrl: attachment.previewUrl ?? attachment.downloadPath ?? attachment.downloadUrl ?? null,
    openUrl: attachment.openUrl ?? attachment.downloadUrl ?? attachment.downloadPath ?? null,
    downloadUrl: attachment.downloadUrl ?? attachment.downloadPath ?? null,
  }
}

export function normalizeMailbox(mailbox: MailboxResponse): Mailbox {
  const initialSyncStrategy = normalizeInitialSyncStrategy(mailbox.initialSyncStrategy)
  const cursorInitStrategy = normalizeInitialSyncStrategy(mailbox.cursorInitStrategy as InitialSyncStrategy | null | undefined) ?? mailbox.cursorInitStrategy ?? null
  const authType = normalizeMailboxAuthType(mailbox.authType)

  return {
    id: String(mailbox.id),
    name: mailbox.name,
    address: mailbox.address ?? '',
    displayName: mailbox.displayName ?? null,
    mailProvider: inferMailProvider(mailbox),
    authType,
    providerType: mailbox.providerType ?? 'IMAP',
    inboundMode: mailbox.inboundMode ?? 'POLLING',
    outboundMode: mailbox.outboundMode ?? 'SMTP',
    oauthTenantId: mailbox.oauthTenantId ?? null,
    oauthClientId: mailbox.oauthClientId ?? null,
    oauthConfigured: mailbox.oauthConfigured ?? (authType === 'OAUTH2' ? Boolean(mailbox.oauthClientId && mailbox.oauthTenantId) : null),
    imapHost: mailbox.imapHost ?? null,
    imapPort: mailbox.imapPort ?? null,
    imapUsername: mailbox.imapUsername ?? null,
    imapUseSsl: mailbox.imapUseSsl ?? null,
    imapFolder: mailbox.imapFolder ?? null,
    smtpHost: mailbox.smtpHost ?? null,
    smtpPort: mailbox.smtpPort ?? null,
    smtpUsername: mailbox.smtpUsername ?? null,
    smtpStarttls: mailbox.smtpStarttls ?? null,
    smtpUseSsl: mailbox.smtpUseSsl ?? null,
    pollingEnabled: mailbox.pollingEnabled ?? false,
    pollIntervalSeconds: mailbox.pollIntervalSeconds ?? 60,
    initialSyncStrategy,
    cursorInitStrategy,
    lastSeenUid: mailbox.lastSeenUid != null ? String(mailbox.lastSeenUid) : null,
    activationState: mailbox.activationState ?? null,
    pollingStatus: mailbox.pollingStatus ?? null,
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
  const rawSenderMatchType = rule.senderMatchType ?? rule.ruleType ?? 'EXACT_EMAIL'
  const senderMatchType = (rawSenderMatchType === 'DOMAIN' ? 'DOMAIN_SUFFIX' : rawSenderMatchType) as CustomerEmailRoutingRule['senderMatchType']
  const senderMatchValue = rule.senderMatchValue ?? rule.matchValue ?? rule.pattern ?? rule.value ?? ''
  return {
    id: rule.id,
    customerId: rule.customerId,
    recipientMailboxId: rule.recipientMailboxId ?? null,
    recipientMailboxName: rule.recipientMailboxName ?? null,
    senderMatchType,
    senderMatchValue,
    priority: rule.priority ?? 0,
    isActive: rule.isActive ?? rule.active ?? true,
    allowSubdomains: rule.allowSubdomains ?? null,
    notes: rule.notes ?? null,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }
}

export function normalizeTag(tag: TagResponse): TicketTag {
  return {
    id: String(tag.id),
    code: tag.code,
    name: tag.name,
    color: tag.color ?? null,
    isActive: tag.isActive !== false,
  }
}

export function normalizeTicketTagResponse(response: TicketTagResponse): TicketTagAssignment {
  const nestedTag = response.tag
  const normalizedTagId = String(response.tagId ?? nestedTag?.id ?? response.id ?? '')
  const tagCode = response.tagCode ?? response.code ?? nestedTag?.code ?? null
  const tagName = response.tagName ?? response.name ?? nestedTag?.name ?? null
  const tagColor = response.tagColor ?? response.color ?? nestedTag?.color ?? null
  const tagIsActive = nestedTag?.isActive ?? response.isActive ?? true
  const hasTagData = Boolean(normalizedTagId || tagCode || tagName || tagColor || nestedTag)
  const normalizedTag = normalizeTag({
    id: normalizedTagId,
    code: tagCode ?? '',
    name: tagName ?? tagCode ?? '',
    color: tagColor,
    isActive: tagIsActive,
  })

  return {
    id: String(response.id ?? `${response.ticketId ?? ''}:${normalizedTagId}`),
    ticketId: String(response.ticketId ?? ''),
    tagId: normalizedTagId,
    taggedAt: response.taggedAt ?? null,
    taggedBy: response.taggedBy != null ? String(response.taggedBy) : null,
    taggedByName: response.taggedByName ?? null,
    tagCode,
    tagName,
    tagColor,
    tagIsActive,
    tag: hasTagData ? normalizedTag : null,
  }
}

function normalizeTagBreakdown(item: { tagId?: string | number | null; tagCode?: string | null; tagName?: string | null; tagColor?: string | null; count?: number | null }): TicketTagBreakdown {
  return {
    tagId: item.tagId != null ? String(item.tagId) : '',
    tagCode: item.tagCode ?? item.tagName ?? '',
    tagName: item.tagName ?? item.tagCode ?? '',
    tagColor: item.tagColor ?? null,
    count: item.count ?? 0,
  }
}

export function normalizeCustomerTicketReport(response: CustomerTicketReportResponse): CustomerTicketReport {
  return {
    customerId: response.customerId != null ? String(response.customerId) : null,
    customerName: response.customerName ?? null,
    from: response.from ?? null,
    to: response.to ?? null,
    totalCount: response.totalCount ?? 0,
    openCount: response.openCount ?? 0,
    closedCount: response.closedCount ?? 0,
    resolvedCount: response.resolvedCount ?? 0,
    newCount: response.newCount ?? 0,
    inProgressCount: response.inProgressCount ?? 0,
    waitingCustomerCount: response.waitingCustomerCount ?? 0,
    reopenedCount: response.reopenedCount ?? 0,
    byTag: (response.byTag ?? []).map(normalizeTagBreakdown),
  }
}

function normalizeAdminCustomerTicketAggregateItem(response: AdminCustomerTicketAggregateItemResponse): AdminCustomerTicketAggregateItem {
  return {
    customerId: response.customerId != null ? String(response.customerId) : '',
    customerName: response.customerName ?? 'Unknown customer',
    customerColorHex: response.customerColorHex ?? null,
    totalCount: response.totalCount ?? 0,
    newCount: response.newCount ?? 0,
    inProgressCount: response.inProgressCount ?? 0,
    openCount: response.openCount ?? 0,
    closedCount: response.closedCount ?? 0,
    resolvedCount: response.resolvedCount ?? 0,
    reopenedCount: response.reopenedCount ?? 0,
    waitingCustomerCount: response.waitingCustomerCount ?? 0,
    byTag: (response.byTag ?? []).map(normalizeTagBreakdown),
  }
}

export function normalizeAdminCustomerTicketAggregateReport(response: { items: AdminCustomerTicketAggregateItemResponse[]; page: number; size: number; totalElements: number; totalPages: number }): AdminCustomerTicketAggregateReport {
  return {
    items: response.items.map(normalizeAdminCustomerTicketAggregateItem),
    page: response.page,
    size: response.size,
    total: response.totalElements,
    totalPages: response.totalPages,
  }
}

export function normalizeTicketReplyPreview(response: TicketEmailReplyPreviewResponse): TicketReplyPreview {
  return {
    derivedToAddress: response.derivedToAddress ?? null,
    derivedFromAddress: response.derivedFromAddress ?? null,
    subject: response.subject,
    bodyText: response.bodyText ?? null,
    bodyHtml: response.bodyHtml ?? null,
    templateInfo: response.templateInfo
      ? {
          templateId: parseNumericContractId(response.templateInfo.templateId),
          templateCode: response.templateInfo.templateCode ?? null,
          templateName: response.templateInfo.templateName ?? null,
        }
      : null,
    placeholderDiagnostics: (response.placeholderDiagnostics ?? []).map((item) => ({
      placeholder: item.placeholder,
      status: item.status,
      message: item.message,
    })),
    warnings: response.warnings ?? [],
    mailboxName: response.mailboxName ?? null,
    mailboxAddress: response.mailboxAddress ?? null,
    isEditable: response.isEditable !== false,
  }
}

export function normalizeUnifiedTicketEmailDetail(response: UnifiedTicketEmailDetailResponse): TicketEmailMessage {
  return normalizeTicketEmailMessage({
    id: response.id,
    emailDocumentId: response.detailType === 'INBOUND' ? String(response.id) : null,
    ticketId: response.ticketPublicId,
    threadKey: null,
    messageId: response.messageId ?? '',
    providerMessageId: null,
    mailboxId: response.mailboxId != null ? String(response.mailboxId) : null,
    mailboxName: response.mailboxName ?? null,
    mailboxAddress: response.mailboxAddress ?? null,
    sourceEventId: parseNumericContractId(response.replyContext?.sourceEventId),
    direction: response.direction,
    subject: response.subject ?? null,
    from: response.fromAddress ?? null,
    fromAddress: response.fromAddress ?? null,
    to: normalizeAddressList(response.toAddress),
    cc: normalizeAddressList(response.cc),
    bcc: normalizeAddressList(response.bcc),
    replyTo: response.replyTo ?? null,
    bodyText: response.bodyText ?? null,
    bodyHtml: response.bodyHtml ?? null,
    sanitizedHtmlBody: response.bodyHtml ?? null,
    rawHtmlBody: response.bodyHtml ?? null,
    bodyPreview: response.bodyPreview ?? null,
    failureReason: response.failureReason ?? null,
    sentAt: response.sentAt ?? null,
    receivedAt: response.receivedAt ?? null,
    createdAt: response.createdAt ?? null,
    status: response.status ?? null,
    dispatchStatus: response.direction === 'OUTBOUND' ? (response.status ?? null) : null,
    detailType: response.detailType,
    detailId: String(response.id),
    attachmentCount: response.attachments?.length ?? 0,
    attachments: response.attachments ?? [],
    hasAttachments: (response.attachments?.length ?? 0) > 0,
    isPreviewAvailable: Boolean(response.bodyHtml ?? response.bodyText),
    threadMessageId: response.threadMessageId ?? null,
    templateInfo: response.templateInfo
      ? {
          templateId: parseNumericContractId(response.templateInfo.templateId),
          templateCode: response.templateInfo.templateCode ?? null,
          templateName: response.templateInfo.templateName ?? null,
        }
      : null,
    replyContext: response.replyContext
      ? {
          sourceEventId: parseNumericContractId(response.replyContext.sourceEventId),
          sourceEmailDocumentId: response.replyContext.sourceEmailDocumentId != null ? String(response.replyContext.sourceEmailDocumentId) : null,
          resolvedReplyTarget: response.replyContext.resolvedReplyTarget ?? null,
        }
      : null,
    contentWasEdited: response.contentWasEdited ?? null,
  })
}

export function normalizeTicketEmailMessage(message: TicketEmailMessageResponse): TicketEmailMessage {
  const direction = message.direction
  const status = message.status ?? null
  const timestamp = message.timestamp ?? null
  const from = message.from ?? message.fromAddress ?? null
  const to = normalizeAddressList(message.to ?? (message.toAddress ? message.toAddress : null))
  const subject = message.subject ?? null
  const bodyPreview = message.bodyPreview ?? null
  const failureReason = message.failureReason ?? message.lastError ?? null
  const sentAt = message.sentAt ?? (direction === 'OUTBOUND' ? timestamp : null)
  const receivedAt = message.receivedAt ?? (direction === 'INBOUND' ? timestamp : null)
  const processingStatus = message.processingStatus ?? (direction === 'INBOUND' ? (status as TicketEmailMessage['processingStatus']) : null)
  const dispatchStatus = message.dispatchStatus ?? (direction === 'OUTBOUND' ? (status as TicketEmailMessage['dispatchStatus']) : null)
  const attachments = (message.attachments ?? []).map(normalizeAttachment)
  const sourceEventId = parseNumericContractId(message.sourceEventId ?? message.sourceEmailEventId ?? message.ingressEventId ?? message.replyContext?.sourceEventId)
  const emailDocumentId = message.emailDocumentId ?? message.emailId ?? message.documentId ?? null

  return {
    id: String(message.id),
    emailDocumentId: emailDocumentId != null ? String(emailDocumentId) : null,
    ticketId: String(message.ticketId),
    threadKey: message.threadKey ?? null,
    messageId: message.messageId,
    providerMessageId: message.providerMessageId ?? null,
    mailboxId: message.mailboxId ?? null,
    mailboxName: message.mailboxName ?? null,
    mailboxAddress: message.mailboxAddress ?? null,
    sourceEventId,
    direction,
    subject,
    from,
    to,
    cc: normalizeAddressList(message.cc),
    bcc: normalizeAddressList(message.bcc),
    replyTo: message.replyTo ?? null,
    bodyText: message.bodyText ?? null,
    bodyHtml: message.bodyHtml ?? null,
    sanitizedHtmlBody: message.sanitizedHtmlBody ?? null,
    rawHtmlBody: message.rawHtmlBody ?? message.bodyHtml ?? null,
    bodyPreview,
    status,
    failureReason,
    sentAt,
    receivedAt,
    createdAt: message.createdAt ?? null,
    processingStatus,
    dispatchStatus,
    attachmentCount: message.attachmentCount ?? attachments.length,
    attachments,
    resolvedReplyTarget: message.resolvedReplyTarget ?? null,
    detailType: message.detailType ?? null,
    detailId: message.detailId ?? null,
    hasAttachments: message.hasAttachments ?? ((message.attachmentCount ?? attachments.length) > 0),
    isPreviewAvailable: message.isPreviewAvailable ?? Boolean(bodyPreview ?? message.bodyText ?? message.bodyHtml),
    threadMessageId: message.threadMessageId ?? null,
    templateInfo: message.templateInfo
      ? {
          templateId: parseNumericContractId(message.templateInfo.templateId),
          templateCode: message.templateInfo.templateCode ?? null,
          templateName: message.templateInfo.templateName ?? null,
        }
      : null,
    replyContext: message.replyContext
      ? {
          sourceEventId: parseNumericContractId(message.replyContext.sourceEventId),
          sourceEmailDocumentId: message.replyContext.sourceEmailDocumentId != null ? String(message.replyContext.sourceEmailDocumentId) : null,
          resolvedReplyTarget: message.replyContext.resolvedReplyTarget ?? null,
        }
      : null,
    contentWasEdited: message.contentWasEdited ?? null,
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