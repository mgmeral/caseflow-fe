/**
 * Email service — aligned to backend /api/emails endpoints.
 * Backend only supports read operations for emails (no POST emails endpoint).
 */
import type { TicketMessage } from '@/types/ticket.types'
import type { EmailDocumentResponse, EmailDocumentSummaryResponse } from '@/types/api.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockMessages, getMockDelay } from '@/mock'

// ---------------------------------------------------------------------------
// Helper: map EmailDocumentResponse → TicketMessage view model
// ---------------------------------------------------------------------------

// Maps full EmailDocumentResponse (detail endpoint) → TicketMessage
// Spec fields: from, textBody, htmlBody, receivedAt, attachments[].fileName
function emailToMessage(e: EmailDocumentResponse): TicketMessage {
  return {
    id: e.id,
    ticketId: e.ticketId,
    // Spec has no direction field — detail endpoint emails are inbound
    type: 'public_inbound',
    authorId: null,
    authorName: e.from ?? '',
    content: e.textBody ?? e.htmlBody ?? '',
    createdAt: e.receivedAt ?? new Date().toISOString(),
    attachments: (e.attachments ?? []).map((a) => a.fileName),
  }
}

// Maps EmailDocumentSummaryResponse (list endpoints) → TicketMessage
// Spec fields: from, receivedAt (no content/attachments in summary)
function emailSummaryToMessage(e: EmailDocumentSummaryResponse): TicketMessage {
  return {
    id: e.id,
    ticketId: e.ticketId,
    type: 'public_inbound',
    authorId: null,
    authorName: e.from ?? '',
    content: '',
    createdAt: e.receivedAt ?? new Date().toISOString(),
    attachments: [],
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
    const emails = await apiClient.get<EmailDocumentSummaryResponse[]>(`/emails/by-ticket/${ticketId}`)
    return emails.map(emailSummaryToMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getById: async (id: string): Promise<TicketMessage | null> => {
    const email = await apiClient.get<EmailDocumentResponse>(`/emails/${id}`)
    return email ? emailToMessage(email) : null
  },

  getByThread: async (threadKey: string): Promise<TicketMessage[]> => {
    const emails = await apiClient.get<EmailDocumentSummaryResponse[]>(
      `/emails/by-thread/${encodeURIComponent(threadKey)}`,
    )
    return emails.map(emailSummaryToMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },
}

export const emailService = USE_MOCKS ? mockService : realService
