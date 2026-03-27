/**
 * Email service — aligned to backend /api/emails endpoints.
 * Backend only supports read operations for emails (no POST emails endpoint).
 */
import type { TicketMessage } from '@/types/ticket.types'
import type { EmailDocumentResponse } from '@/types/api.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockMessages, getMockDelay } from '@/mock'

// ---------------------------------------------------------------------------
// Helper: map EmailDocumentResponse → TicketMessage view model
// ---------------------------------------------------------------------------

function emailToMessage(e: EmailDocumentResponse): TicketMessage {
  return {
    id: e.id,
    ticketId: e.ticketId,
    type: e.direction === 'INBOUND' ? 'public_inbound' : 'public_outbound',
    authorId: null,
    authorName: e.fromAddress,
    content: e.content,
    createdAt: e.sentAt ?? e.receivedAt ?? new Date().toISOString(),
    attachments: e.attachments.map((a) => a.filename),
  }
}

// ---------------------------------------------------------------------------
// Mock implementation
// ---------------------------------------------------------------------------

const mockService = {
  getByTicket: async (ticketId: string): Promise<TicketMessage[]> => {
    await getMockDelay()
    return mockMessages
      .filter((m) => m.ticketId === ticketId && (m.type === 'public_inbound' || m.type === 'public_outbound'))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getById: async (id: string): Promise<TicketMessage | null> => {
    await getMockDelay()
    return mockMessages.find((m) => m.id === id) ?? null
  },

  getByThread: async (threadKey: string): Promise<TicketMessage[]> => {
    await getMockDelay()
    // No thread key in mock — return empty (thread view is a real-mode feature)
    void threadKey
    return []
  },
}

// ---------------------------------------------------------------------------
// Real API implementation
// ---------------------------------------------------------------------------

const realService = {
  getByTicket: async (ticketId: string): Promise<TicketMessage[]> => {
    const emails = await apiClient.get<EmailDocumentResponse[]>(`/emails/by-ticket/${ticketId}`)
    return emails.map(emailToMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getById: async (id: string): Promise<TicketMessage | null> => {
    const email = await apiClient.get<EmailDocumentResponse>(`/emails/${id}`)
    return email ? emailToMessage(email) : null
  },

  getByThread: async (threadKey: string): Promise<TicketMessage[]> => {
    const emails = await apiClient.get<EmailDocumentResponse[]>(
      `/emails/by-thread/${encodeURIComponent(threadKey)}`,
    )
    return emails.map(emailToMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },
}

export const emailService = USE_MOCKS ? mockService : realService
