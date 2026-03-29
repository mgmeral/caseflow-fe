import type {
  SendTicketReplyResponse,
  TicketEmailMessageResponse,
} from '@/types/api.types'
import type {
  SendTicketReplyRequest,
  SendTicketReplyResult,
  TicketEmailMessage,
} from '@/types/email.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { getMockDelay } from '@/mock'
import { buildMockReplyResponse, buildMockTicketEmails } from '@/mock/email-platform.mock'
import {
  normalizeSendTicketReplyResult,
  normalizeTicketEmailMessage,
} from './email-platform.normalizers'

let ticketEmailStore = buildMockTicketEmails()

function buildReplyPayload(payload: SendTicketReplyRequest): FormData | Omit<SendTicketReplyRequest, 'attachments'> {
  if (payload.attachments.length === 0) {
    return {
      mailboxId: payload.mailboxId,
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      subject: payload.subject,
      body: payload.body,
      isHtml: payload.isHtml,
    }
  }

  // Assumption: the reply endpoint accepts multipart/form-data when attachments are present.
  const formData = new FormData()
  if (payload.mailboxId) formData.append('mailboxId', payload.mailboxId)
  payload.to.forEach((address) => formData.append('to', address))
  payload.cc.forEach((address) => formData.append('cc', address))
  payload.bcc.forEach((address) => formData.append('bcc', address))
  formData.append('subject', payload.subject)
  formData.append('body', payload.body)
  formData.append('isHtml', String(payload.isHtml))
  payload.attachments.forEach((file) => formData.append('attachments', file))
  return formData
}

const mockService = {
  listThread: async (ticketId: string): Promise<TicketEmailMessage[]> => {
    await getMockDelay()
    return ticketEmailStore
      .filter((message) => message.ticketId === ticketId)
      .map(normalizeTicketEmailMessage)
      .sort((a, b) => (a.receivedAt ?? a.sentAt ?? '').localeCompare(b.receivedAt ?? b.sentAt ?? ''))
  },

  getDetail: async (ticketId: string, emailId: string): Promise<TicketEmailMessage | null> => {
    await getMockDelay()
    const message = ticketEmailStore.find((item) => item.ticketId === ticketId && item.id === emailId)
    return message ? normalizeTicketEmailMessage(message) : null
  },

  sendReply: async (ticketId: string, payload: SendTicketReplyRequest): Promise<SendTicketReplyResult> => {
    await getMockDelay()
    const message: TicketEmailMessageResponse = {
      id: `reply-${Date.now()}`,
      ticketId,
      threadKey: `thread-${ticketId}`,
      messageId: `msg-${Date.now()}`,
      providerMessageId: null,
      mailboxId: payload.mailboxId,
      mailboxName: payload.mailboxId,
      direction: 'OUTBOUND',
      subject: payload.subject,
      from: 'agent@caseflow.example',
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      bodyText: payload.isHtml ? null : payload.body,
      bodyHtml: payload.isHtml ? payload.body : null,
      bodyPreview: payload.body.replace(/<[^>]+>/g, '').slice(0, 180),
      sentAt: new Date().toISOString(),
      receivedAt: null,
      dispatchStatus: 'QUEUED',
      attachments: payload.attachments.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        fileName: file.name,
        contentType: file.type || null,
        size: file.size,
        downloadUrl: null,
      })),
    }
    ticketEmailStore = [...ticketEmailStore, message]
    return normalizeSendTicketReplyResult(buildMockReplyResponse(ticketId, payload.mailboxId))
  },
}

const realService = {
  listThread: async (ticketId: string): Promise<TicketEmailMessage[]> => {
    const messages = await apiClient.get<TicketEmailMessageResponse[]>(`/tickets/${ticketId}/emails`)
    return messages
      .map(normalizeTicketEmailMessage)
      .sort((a, b) => (a.receivedAt ?? a.sentAt ?? '').localeCompare(b.receivedAt ?? b.sentAt ?? ''))
  },

  getDetail: async (ticketId: string, emailId: string): Promise<TicketEmailMessage | null> => {
    const message = await apiClient.get<TicketEmailMessageResponse | null>(`/tickets/${ticketId}/emails/${emailId}`)
    return message ? normalizeTicketEmailMessage(message) : null
  },

  sendReply: async (ticketId: string, payload: SendTicketReplyRequest): Promise<SendTicketReplyResult> => {
    const response = await apiClient.post<SendTicketReplyResponse>(`/tickets/${ticketId}/email-replies`, buildReplyPayload(payload))
    return normalizeSendTicketReplyResult(response)
  },
}

export const ticketEmailService = USE_MOCKS ? mockService : realService