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
import { toArrayPayload } from '@/lib/apiList'
import { optionalNumericContractId, parseNumericContractId, requireNumericContractId, trimOptionalText } from '@/lib/ticketEmailContracts'
import {
  normalizeTicketReplyPreview,
  normalizeSendTicketReplyResult,
  normalizeTicketEmailMessage,
  normalizeUnifiedTicketEmailDetail,
  normalizeAddressList,
} from './email-platform.normalizers'

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
  const sourceEventId = parseNumericContractId(item.sourceEventId ?? item.sourceEmailEventId ?? item.ingressEventId)

  return {
    id: String(item.id),
    emailDocumentId: emailDocumentId != null ? String(emailDocumentId) : null,
    ticketId,
    threadKey: null,
    messageId: item.messageId ?? '',
    providerMessageId: null,
    mailboxId: item.mailboxId != null ? String(item.mailboxId) : null,
    mailboxName: item.mailboxName ?? null,
    sourceEventId,
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
    to: normalizeAddressList(email.to),
    cc: normalizeAddressList(email.cc),
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
  sourceEventId: number
  templateId: number | null
  templateCode: string | null
  toAddress: string | null
  subject: string
  textBody: string | null
  htmlBody: string | null
  inReplyToMessageId: string | null
  contentWasEdited: boolean
} {
  const mailboxId = requireNumericContractId(
    payload.mailboxId,
    'Select the mailbox that should send this reply.',
    'Reply context is invalid. Mailbox id must be numeric.',
  )
  const sourceEventId = requireNumericContractId(
    payload.sourceEventId,
    'This message cannot be replied to because its inbound event reference is missing.',
    'Reply context is invalid. Source event id must be numeric.',
  )
  const templateId = optionalNumericContractId(payload.templateId, 'Selected template id is invalid.')
  const subject = payload.subject.trim()
  const textBody = trimOptionalText(payload.textBody)
  const htmlBody = trimOptionalText(payload.htmlBody)

  if (!subject) {
    throw new Error('Reply subject cannot be empty.')
  }

  if (!textBody && !htmlBody) {
    throw new Error('Reply body cannot be empty.')
  }

  return {
    mailboxId,
    sourceEventId,
    templateId,
    templateCode: trimOptionalText(payload.templateCode),
    toAddress: trimOptionalText(payload.toAddress),
    subject,
    textBody,
    htmlBody,
    inReplyToMessageId: trimOptionalText(payload.inReplyToMessageId),
    contentWasEdited: payload.contentWasEdited === true,
  }
}

function buildReplyPreviewPayload(payload: TicketReplyPreviewRequest): TicketReplyPreviewRequest {
  return {
    mailboxId: requireNumericContractId(
      payload.mailboxId,
      'Select the mailbox that should send this reply.',
      'Reply context is invalid. Mailbox id must be numeric.',
    ),
    sourceEventId: optionalNumericContractId(payload.sourceEventId, 'Reply context is invalid. Source event id must be numeric.'),
    templateId: optionalNumericContractId(payload.templateId, 'Selected template id is invalid.'),
    templateCode: payload.templateCode ?? undefined,
    subjectOverride: payload.subjectOverride ?? undefined,
    bodyText: payload.bodyText ?? undefined,
    bodyHtml: payload.bodyHtml ?? undefined,
  }
}

export const ticketEmailService = {
  listThread: async (ticketId: string): Promise<TicketEmailMessage[]> => {
    const res = await apiClient.get<unknown>(`/tickets/${ticketId}/email/thread`)
    const items = toArrayPayload(res) as EmailThreadItemResponse[]
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
    const response = await apiClient.post<TicketEmailReplyPreviewResponse>(`/tickets/${ticketPublicId}/email/reply/preview`, buildReplyPreviewPayload(payload))
    return normalizeTicketReplyPreview(response)
  },

  sendReply: async (ticketId: string, payload: SendTicketReplyRequest): Promise<SendTicketReplyResult> => {
    const response = await apiClient.post<SendTicketReplyResponse | undefined>(`/tickets/${ticketId}/email/reply`, buildReplyPayload(payload))
    return normalizeSendTicketReplyResult(response)
  },
}
