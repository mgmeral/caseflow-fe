import type {
  DispatchResponse,
  EmailThreadItemResponse,
  IngressEventResponse,
  SendTicketReplyResponse,
  TicketEmailMessageResponse,
} from '@/types/api.types'
import type {
  SendTicketReplyRequest,
  SendTicketReplyResult,
  TicketEmailMessage,
} from '@/types/email.types'
import { apiClient } from './api.client'
import {
  normalizeSendTicketReplyResult,
  normalizeTicketEmailMessage,
} from './email-platform.normalizers'

function extractEmailAddress(raw: string): string {
  const value = raw.trim()
  if (!value) return ''

  // Prefer RFC-like display-name format: Name <user@example.com>
  const angleMatch = value.match(/<\s*([^>\s]+@[^>\s]+)\s*>/)
  if (angleMatch?.[1]) return angleMatch[1].trim()

  // Fallback: find first email-looking token anywhere in the string.
  const emailMatch = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return emailMatch?.[0]?.trim() ?? ''
}

function toInboundMessage(ticketId: string, event: IngressEventResponse): TicketEmailMessageResponse {
  const detail = event as IngressEventResponse & {
    bodyText?: string | null
    bodyHtml?: string | null
    sanitizedHtmlBody?: string | null
    rawHtmlBody?: string | null
    bodyPreview?: string | null
    attachments?: TicketEmailMessageResponse['attachments']
  }

  return {
    id: String(event.id),
    ticketId,
    threadKey: null,
    messageId: event.messageId ?? '',
    providerMessageId: null,
    mailboxId: event.mailboxId != null ? String(event.mailboxId) : null,
    mailboxName: null,
    sourceEventId: String(event.id),
    direction: 'INBOUND',
    subject: event.rawSubject ?? event.subject ?? null,
    from: event.rawFrom ?? event.sender ?? null,
    to: [],
    cc: [],
    bcc: [],
    bodyText: detail.bodyText ?? null,
    bodyHtml: detail.bodyHtml ?? null,
    sanitizedHtmlBody: detail.sanitizedHtmlBody ?? null,
    rawHtmlBody: detail.rawHtmlBody ?? detail.bodyHtml ?? null,
    bodyPreview: detail.bodyPreview ?? event.failureReason ?? null,
    sentAt: null,
    receivedAt: event.receivedAt,
    processingStatus: (event.status ?? event.processingStatus ?? null) as TicketEmailMessageResponse['processingStatus'],
    dispatchStatus: null,
    attachmentCount: detail.attachments?.length ?? 0,
    attachments: detail.attachments ?? [],
  }
}

function toThreadMessage(ticketId: string, item: EmailThreadItemResponse): TicketEmailMessageResponse {
  return {
    id: String(item.id),
    ticketId,
    threadKey: null,
    messageId: item.messageId ?? '',
    providerMessageId: null,
    mailboxId: item.mailboxId != null ? String(item.mailboxId) : null,
    mailboxName: item.mailboxName ?? null,
    sourceEventId: item.sourceEventId ?? item.sourceEmailEventId ?? item.ingressEventId ?? (item.direction === 'INBOUND' ? String(item.id) : null),
    direction: item.direction,
    subject: item.subject ?? null,
    from: item.fromAddress ?? null,
    to: item.toAddress ? [item.toAddress] : [],
    cc: [],
    bcc: [],
    bodyText: null,
    bodyHtml: null,
    sanitizedHtmlBody: null,
    rawHtmlBody: null,
    bodyPreview: item.bodyPreview ?? null,
    sentAt: item.direction === 'OUTBOUND' ? item.timestamp : null,
    receivedAt: item.direction === 'INBOUND' ? item.timestamp : null,
    processingStatus: item.direction === 'INBOUND' ? (item.status as TicketEmailMessageResponse['processingStatus']) : null,
    dispatchStatus: item.direction === 'OUTBOUND' ? (item.status as TicketEmailMessageResponse['dispatchStatus']) : null,
    attachmentCount: item.attachmentCount ?? 0,
    attachments: [],
  }
}

function toOutboundMessage(dispatch: DispatchResponse): TicketEmailMessageResponse {
  return {
    id: String(dispatch.id),
    ticketId: String(dispatch.ticketId),
    threadKey: null,
    messageId: dispatch.messageId ?? '',
    providerMessageId: null,
    mailboxId: dispatch.mailboxId != null ? String(dispatch.mailboxId) : null,
    mailboxName: dispatch.mailboxName ?? null,
    direction: 'OUTBOUND',
    subject: dispatch.subject ?? null,
    from: dispatch.fromAddress ?? null,
    to: dispatch.toAddress ? [dispatch.toAddress] : [],
    cc: [],
    bcc: [],
    bodyText: dispatch.bodyText ?? null,
    bodyHtml: dispatch.bodyHtml ?? null,
    sanitizedHtmlBody: dispatch.sanitizedHtmlBody ?? null,
    rawHtmlBody: dispatch.rawHtmlBody ?? dispatch.bodyHtml ?? null,
    bodyPreview: dispatch.bodyPreview ?? dispatch.failureReason ?? null,
    sentAt: dispatch.sentAt ?? dispatch.createdAt ?? null,
    receivedAt: null,
    processingStatus: null,
    dispatchStatus: (dispatch.status ?? null) as TicketEmailMessageResponse['dispatchStatus'],
    attachmentCount: dispatch.attachments?.length ?? 0,
    attachments: dispatch.attachments ?? [],
  }
}

function buildReplyPayload(payload: SendTicketReplyRequest): {
  mailboxId: number
  subject: string
  sourceEventId?: string
  toAddress?: string
  textBody?: string
  htmlBody?: string
  inReplyToMessageId?: string
} {
  if (!payload.mailboxId) {
    throw new Error('mailboxId is required for ticket email replies')
  }
  const mailboxId = Number(payload.mailboxId)
  if (Number.isNaN(mailboxId)) {
    throw new Error('mailboxId must be numeric for ticket email replies')
  }

  const sourceEventId = payload.sourceEventId?.trim()
  const toAddress = payload.toAddress ? extractEmailAddress(payload.toAddress) : ''

  if (!sourceEventId && !toAddress) {
    throw new Error('sourceEventId or toAddress is required for ticket email replies')
  }

  if (!payload.subject.trim()) {
    throw new Error('subject is required for ticket email replies')
  }

  const textBody = payload.textBody
  const htmlBody = payload.htmlBody

  const requestBody: {
    mailboxId: number
    subject: string
    sourceEventId?: string
    toAddress?: string
    textBody?: string
    htmlBody?: string
    inReplyToMessageId?: string
  } = {
    mailboxId,
    subject: payload.subject,
  }

  if (sourceEventId) requestBody.sourceEventId = sourceEventId
  if (toAddress) requestBody.toAddress = toAddress
  if (textBody && textBody.trim().length > 0) requestBody.textBody = textBody
  if (htmlBody && htmlBody.trim().length > 0) requestBody.htmlBody = htmlBody
  if (payload.inReplyToMessageId) requestBody.inReplyToMessageId = payload.inReplyToMessageId

  return requestBody
}

export const ticketEmailService = {
  listThread: async (ticketId: string): Promise<TicketEmailMessage[]> => {
    const items = await apiClient.get<EmailThreadItemResponse[]>(`/tickets/${ticketId}/email/thread`)
    const messages = items.map((item) => toThreadMessage(ticketId, item))
    return messages
      .map(normalizeTicketEmailMessage)
      .sort((a, b) => (a.receivedAt ?? a.sentAt ?? '').localeCompare(b.receivedAt ?? b.sentAt ?? ''))
  },

  getInboundDetail: async (ticketId: string, eventId: string): Promise<TicketEmailMessage | null> => {
    const event = await apiClient.get<IngressEventResponse | null>(`/tickets/${ticketId}/email/inbound/${eventId}`)
    return event ? normalizeTicketEmailMessage(toInboundMessage(ticketId, event)) : null
  },

  getOutboundDetail: async (ticketId: string, dispatchId: string): Promise<TicketEmailMessage | null> => {
    const dispatch = await apiClient.get<DispatchResponse | null>(`/tickets/${ticketId}/email/outbound/${dispatchId}`)
    return dispatch ? normalizeTicketEmailMessage(toOutboundMessage(dispatch)) : null
  },

  /** Convenience: route to inbound or outbound detail based on direction */
  getDetail: async (ticketId: string, emailId: string, direction?: 'INBOUND' | 'OUTBOUND'): Promise<TicketEmailMessage | null> => {
    if (direction === 'OUTBOUND') {
      return ticketEmailService.getOutboundDetail(ticketId, emailId)
    }
    // Default to inbound — covers legacy callers that don't pass direction
    return ticketEmailService.getInboundDetail(ticketId, emailId)
  },

  sendReply: async (ticketId: string, payload: SendTicketReplyRequest): Promise<SendTicketReplyResult> => {
    const response = await apiClient.post<SendTicketReplyResponse | undefined>(`/tickets/${ticketId}/email/reply`, buildReplyPayload(payload))
    return normalizeSendTicketReplyResult(response)
  },
}
