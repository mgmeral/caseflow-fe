import type {
  CustomerEmailRoutingRuleResponse,
  CustomerEmailSettingsResponse,
  IngressEventDetailResponse,
  IngressEventResponse,
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

function normalizeAttachment(attachment: TicketEmailAttachmentResponse): EmailAttachment {
  return {
    id: attachment.id ?? null,
    fileName: attachment.fileName,
    contentType: attachment.contentType ?? null,
    size: attachment.size ?? null,
    downloadUrl: attachment.downloadUrl ?? null,
  }
}

export function normalizeMailbox(mailbox: MailboxResponse): Mailbox {
  return {
    id: mailbox.id,
    name: mailbox.name,
    emailAddress: mailbox.emailAddress,
    displayName: mailbox.displayName ?? null,
    providerType: mailbox.providerType,
    inboundMode: mailbox.inboundMode,
    outboundMode: mailbox.outboundMode,
    isActive: mailbox.isActive,
    inboundEnabled: mailbox.inboundEnabled,
    outboundEnabled: mailbox.outboundEnabled,
    defaultGroupId: mailbox.defaultGroupId ?? null,
    defaultGroupName: mailbox.defaultGroupName ?? null,
    defaultPriority: mailbox.defaultPriority ?? null,
    defaultStatus: mailbox.defaultStatus ?? null,
    unknownSenderPolicy: mailbox.unknownSenderPolicy,
    lastInboundSuccessAt: mailbox.lastInboundSuccessAt ?? null,
    lastOutboundSuccessAt: mailbox.lastOutboundSuccessAt ?? null,
    createdAt: mailbox.createdAt,
    updatedAt: mailbox.updatedAt,
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
  return {
    customerId: settings.customerId,
    customerName: settings.customerName ?? null,
    mailboxId: settings.mailboxId ?? null,
    mailboxName: settings.mailboxName ?? null,
    trustedContactsOnly: settings.trustedContactsOnly,
    autoCreateContact: settings.autoCreateContact,
    allowSubdomains: settings.allowSubdomains,
    unknownSenderPolicy: settings.unknownSenderPolicy,
    defaultGroupId: settings.defaultGroupId ?? null,
    defaultGroupName: settings.defaultGroupName ?? null,
    defaultPriority: settings.defaultPriority ?? null,
    defaultStatus: settings.defaultStatus ?? null,
    updatedAt: settings.updatedAt ?? null,
  }
}

export function normalizeCustomerEmailRoutingRule(rule: CustomerEmailRoutingRuleResponse): CustomerEmailRoutingRule {
  return {
    id: rule.id,
    customerId: rule.customerId,
    matchType: rule.matchType,
    matchValue: rule.matchValue,
    mailboxId: rule.mailboxId ?? null,
    mailboxName: rule.mailboxName ?? null,
    groupId: rule.groupId ?? null,
    groupName: rule.groupName ?? null,
    priority: rule.priority ?? null,
    status: rule.status ?? null,
    isActive: rule.isActive,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }
}

export function normalizeIngressEvent(event: IngressEventResponse): IngressEvent {
  return {
    id: event.id,
    mailboxId: event.mailboxId ?? null,
    mailboxName: event.mailboxName ?? null,
    mailboxAddress: event.mailboxAddress ?? null,
    providerType: event.providerType ?? null,
    messageId: event.messageId,
    subject: event.subject ?? null,
    sender: event.sender ?? null,
    status: event.status,
    receivedAt: event.receivedAt,
    processedAt: event.processedAt ?? null,
    lastErrorSummary: event.lastErrorSummary ?? null,
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
    quarantineReason: event.quarantineReason ?? null,
    quarantinedAt: event.quarantinedAt ?? null,
    replayedAt: event.replayedAt ?? null,
    relatedTicketId: event.relatedTicketId ?? null,
  }
}

export function normalizeTicketEmailMessage(message: TicketEmailMessageResponse): TicketEmailMessage {
  return {
    id: message.id,
    ticketId: message.ticketId,
    threadKey: message.threadKey ?? null,
    messageId: message.messageId,
    providerMessageId: message.providerMessageId ?? null,
    mailboxId: message.mailboxId ?? null,
    mailboxName: message.mailboxName ?? null,
    direction: message.direction,
    subject: message.subject ?? null,
    from: message.from ?? null,
    to: message.to ?? [],
    cc: message.cc ?? [],
    bcc: message.bcc ?? [],
    bodyText: message.bodyText ?? null,
    bodyHtml: message.bodyHtml ?? null,
    bodyPreview: message.bodyPreview ?? null,
    sentAt: message.sentAt ?? null,
    receivedAt: message.receivedAt ?? null,
    dispatchStatus: message.dispatchStatus ?? null,
    attachments: (message.attachments ?? []).map(normalizeAttachment),
  }
}

export function normalizeSendTicketReplyResult(result: SendTicketReplyResponse): SendTicketReplyResult {
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