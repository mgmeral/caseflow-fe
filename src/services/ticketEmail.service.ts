import type {
  EmailDocumentResponse,
  EmailThreadItemResponse,
  SendTicketReplyResponse,
  TicketEmailReplyPreviewResponse,
  TicketEmailMessageResponse,
  UnifiedTicketEmailDetailResponse,
} from '@/types/api.types'
import type {
  TicketReplyPreview,
  TicketReplyPreviewRequest,
  SendTicketReplyRequest,
  SendTicketReplyResult,
  TicketEmailMessage,
} from '@/types/email.types'
import { apiClient } from './api.client'
import {
  normalizeTicketReplyPreview,
  normalizeSendTicketReplyResult,
  normalizeTicketEmailMessage,
  normalizeUnifiedTicketEmailDetail,
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

function inferEmailDocumentId(item: EmailThreadItemResponse): string | null {
  const explicitEmailDocumentId = item.emailDocumentId ?? item.emailId ?? item.documentId ?? item.inboundEmailId ?? item.outboundEmailId ?? null
  if (explicitEmailDocumentId != null) {
    return String(explicitEmailDocumentId)
  }

  const rawId = String(item.id ?? '').trim()
  if (!rawId) return null
  if (/^\d+$/.test(rawId)) return null
  if (/^evt[-_:]/i.test(rawId)) return null
  if (/^event[-_:]/i.test(rawId)) return null
  if (/^ingress[-_:]/i.test(rawId)) return null

  return rawId
}

function toThreadMessage(ticketId: string, item: EmailThreadItemResponse): TicketEmailMessageResponse {
  const emailDocumentId = inferEmailDocumentId(item)
  const detailType = item.detailType ?? item.direction
  const detailId = item.detailId != null ? String(item.detailId) : emailDocumentId ?? String(item.id)

  return {
    id: String(item.id),
    emailDocumentId: emailDocumentId != null ? String(emailDocumentId) : null,
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
    replyTo: [],
    bodyText: null,
    bodyHtml: null,
    sanitizedHtmlBody: null,
    rawHtmlBody: null,
    bodyPreview: item.bodyPreview ?? null,
    status: item.status ?? null,
    failureReason: item.failureReason ?? null,
    sentAt: item.direction === 'OUTBOUND' ? item.timestamp : null,
    receivedAt: item.direction === 'INBOUND' ? item.timestamp : null,
    processingStatus: item.direction === 'INBOUND' ? (item.status as TicketEmailMessageResponse['processingStatus']) : null,
    dispatchStatus: item.direction === 'OUTBOUND' ? (item.status as TicketEmailMessageResponse['dispatchStatus']) : null,
    attachmentCount: item.attachmentCount ?? 0,
    attachments: [],
    resolvedReplyTarget: item.resolvedReplyTarget ?? null,
    detailType,
    detailId,
    hasAttachments: item.hasAttachments ?? ((item.attachmentCount ?? 0) > 0),
    isPreviewAvailable: item.isPreviewAvailable ?? true,
  }
}

function toEmailDocumentMessage(email: EmailDocumentResponse, direction: 'INBOUND' | 'OUTBOUND' = 'INBOUND'): TicketEmailMessageResponse {
  const timestamp = email.receivedAt ?? email.parsedAt ?? null

  return {
    id: String(email.id),
    emailDocumentId: String(email.id),
    ticketId: String(email.ticketId),
    threadKey: email.threadKey ?? null,
    messageId: email.messageId ?? '',
    providerMessageId: null,
    mailboxId: null,
    mailboxName: null,
    direction,
    subject: email.subject ?? null,
    from: email.from ?? null,
    to: email.to ?? [],
    cc: email.cc ?? [],
    bcc: [],
    bodyText: email.textBody ?? null,
    bodyHtml: email.htmlBody ?? email.sanitizedHtmlBody ?? null,
    sanitizedHtmlBody: email.sanitizedHtmlBody ?? null,
    rawHtmlBody: email.htmlBody ?? null,
    bodyPreview: email.textBody ?? email.sanitizedHtmlBody ?? null,
    failureReason: null,
    sentAt: direction === 'OUTBOUND' ? timestamp : null,
    receivedAt: direction === 'INBOUND' ? timestamp : null,
    processingStatus: null,
    dispatchStatus: null,
    attachmentCount: email.attachments?.length ?? 0,
    attachments: (email.attachments ?? []).map((attachment) => ({
      id: attachment.id ?? null,
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      size: attachment.size,
      sizeBytes: attachment.size,
      previewSupported: attachment.previewSupported ?? null,
      previewUrl: attachment.downloadPath ?? null,
      openUrl: attachment.downloadPath ?? null,
      downloadPath: attachment.downloadPath ?? null,
      downloadUrl: attachment.downloadPath ?? null,
    })),
  }
}

function buildReplyPayload(payload: SendTicketReplyRequest): {
  mailboxId: number
  subject: string
  sourceEventId?: string
  templateId?: string
  toAddress?: string
  textBody?: string
  htmlBody?: string
  inReplyToMessageId?: string
  contentWasEdited?: boolean
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
    templateId?: string
    toAddress?: string
    textBody?: string
    htmlBody?: string
    inReplyToMessageId?: string
    contentWasEdited?: boolean
  } = {
    mailboxId,
    subject: payload.subject,
  }

  if (sourceEventId) requestBody.sourceEventId = sourceEventId
  if (payload.templateId?.trim()) requestBody.templateId = payload.templateId.trim()
  if (toAddress) requestBody.toAddress = toAddress
  if (textBody && textBody.trim().length > 0) requestBody.textBody = textBody
  if (htmlBody && htmlBody.trim().length > 0) requestBody.htmlBody = htmlBody
  if (payload.inReplyToMessageId) requestBody.inReplyToMessageId = payload.inReplyToMessageId
  if (typeof payload.contentWasEdited === 'boolean') requestBody.contentWasEdited = payload.contentWasEdited

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

  getDetail: async (ticketPublicId: string, detailId: string, detailType: 'INBOUND' | 'OUTBOUND' = 'INBOUND'): Promise<TicketEmailMessage | null> => {
    const detail = await apiClient.get<UnifiedTicketEmailDetailResponse | null>(`/tickets/${ticketPublicId}/email/detail/${detailType}/${detailId}`)
    return detail ? normalizeUnifiedTicketEmailDetail(detail) : null
  },

  getLegacyEmailDetail: async (_ticketId: string, emailId: string, direction?: 'INBOUND' | 'OUTBOUND'): Promise<TicketEmailMessage | null> => {
    const email = await apiClient.get<EmailDocumentResponse | null>(`/emails/${emailId}`)
    return email ? normalizeTicketEmailMessage(toEmailDocumentMessage(email, direction ?? 'INBOUND')) : null
  },

  previewReply: async (ticketPublicId: string, payload: TicketReplyPreviewRequest): Promise<TicketReplyPreview> => {
    const response = await apiClient.post<TicketEmailReplyPreviewResponse>(`/tickets/${ticketPublicId}/email/reply/preview`, payload)
    return normalizeTicketReplyPreview(response)
  },

  sendReply: async (ticketId: string, payload: SendTicketReplyRequest): Promise<SendTicketReplyResult> => {
    const response = await apiClient.post<SendTicketReplyResponse | undefined>(`/tickets/${ticketId}/email/reply`, buildReplyPayload(payload))
    return normalizeSendTicketReplyResult(response)
  },
}
