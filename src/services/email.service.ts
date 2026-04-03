/**
 * Legacy compatibility wrapper.
 * New ticket email integrations should use ticketEmailService + useTicketEmailThread.
 */
import type { TicketMessage } from '@/types/ticket.types'
import type { EmailDocumentResponse } from '@/types/api.types'
import { apiClient } from './api.client'
import { ticketEmailService } from './ticketEmail.service'

function toLegacyTicketMessage(message: Awaited<ReturnType<typeof ticketEmailService.listThread>>[number]): TicketMessage {
  return {
    id: message.id,
    ticketId: message.ticketId,
    type: message.direction === 'INBOUND' ? 'public_inbound' : 'public_outbound',
    authorId: null,
    authorName: message.from ?? message.mailboxName ?? '',
    content: message.bodyText ?? message.bodyPreview ?? '',
    createdAt: message.receivedAt ?? message.sentAt ?? new Date().toISOString(),
    attachments: message.attachments.map((attachment) => attachment.fileName),
  }
}

function emailDocToLegacyTicketMessage(message: EmailDocumentResponse): TicketMessage {
  return {
    id: message.id,
    ticketId: message.ticketId,
    type: 'public_inbound',
    authorId: null,
    authorName: message.from ?? '',
    content: message.textBody ?? message.htmlBody ?? '',
    createdAt: message.receivedAt ?? new Date().toISOString(),
    attachments: (message.attachments ?? []).map((attachment) => attachment.fileName),
  }
}

export const emailService = {
  getByTicket: async (ticketId: string): Promise<TicketMessage[]> => {
    const messages = await ticketEmailService.listThread(ticketId)
    return messages.map(toLegacyTicketMessage)
  },

  getById: async (id: string): Promise<TicketMessage | null> => {
    const message = await apiClient.get<EmailDocumentResponse | null>(`/emails/${id}`)
    return message ? emailDocToLegacyTicketMessage(message) : null
  },

  getByThread: async (_threadKey: string): Promise<TicketMessage[]> => [],
}
