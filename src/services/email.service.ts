/**
 * Legacy compatibility wrapper.
 * New ticket email integrations should use ticketEmailService + useTicketEmailThread.
 */
import type { TicketMessage } from '@/types/ticket.types'
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

export const emailService = {
  getByTicket: async (ticketId: string): Promise<TicketMessage[]> => {
    const messages = await ticketEmailService.listThread(ticketId)
    return messages.map(toLegacyTicketMessage)
  },

  getById: async (id: string): Promise<TicketMessage | null> => {
    const message = await ticketEmailService.getDetail('', id)
    return message ? toLegacyTicketMessage(message) : null
  },

  getByThread: async (_threadKey: string): Promise<TicketMessage[]> => [],
}
