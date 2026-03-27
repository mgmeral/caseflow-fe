/**
 * Notes service — aligned to backend /api/notes endpoints.
 * Handles AddNoteRequest, NoteResponse per backend contract.
 */
import type { TicketMessage } from '@/types/ticket.types'
import type { NoteResponse, AddNoteRequest } from '@/types/api.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockMessages, getMockDelay } from '@/mock'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function noteToMessage(n: NoteResponse): TicketMessage {
  const typeMap: Record<string, TicketMessage['type']> = {
    public_reply: 'public_outbound',
    internal_note: 'internal_note',
    system_event: 'system_event',
  }
  return {
    id: n.id,
    ticketId: n.ticketId,
    type: typeMap[n.type] ?? 'internal_note',
    authorId: n.authorId,
    authorName: n.authorName,
    content: n.content,
    createdAt: n.createdAt,
    attachments: [],
  }
}

// ---------------------------------------------------------------------------
// Mock implementation
// ---------------------------------------------------------------------------

let _mockNoteIdCounter = 9000

const mockService = {
  getByTicket: async (ticketId: string): Promise<TicketMessage[]> => {
    await getMockDelay()
    return mockMessages
      .filter((m) => m.ticketId === ticketId && m.type !== 'public_inbound' && m.type !== 'public_outbound')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getById: async (id: string): Promise<TicketMessage | null> => {
    await getMockDelay()
    return mockMessages.find((m) => m.id === id) ?? null
  },

  create: async (req: AddNoteRequest): Promise<TicketMessage> => {
    await getMockDelay()
    const msg: TicketMessage = {
      id: `note-${++_mockNoteIdCounter}`,
      ticketId: req.ticketId,
      type: req.type === 'public_reply' ? 'public_outbound' : (req.type as TicketMessage['type']),
      authorId: req.authorId,
      authorName: req.authorId,
      content: req.content,
      createdAt: new Date().toISOString(),
      attachments: [],
    }
    mockMessages.push(msg)
    return msg
  },
}

// ---------------------------------------------------------------------------
// Real API implementation
// ---------------------------------------------------------------------------

const realService = {
  getByTicket: async (ticketId: string): Promise<TicketMessage[]> => {
    const notes = await apiClient.get<NoteResponse[]>(`/notes/by-ticket/${ticketId}`)
    return notes.map(noteToMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getById: async (id: string): Promise<TicketMessage | null> => {
    const note = await apiClient.get<NoteResponse>(`/notes/${id}`)
    return note ? noteToMessage(note) : null
  },

  create: async (req: AddNoteRequest): Promise<TicketMessage> => {
    const note = await apiClient.post<NoteResponse>('/notes', req)
    return noteToMessage(note)
  },
}

export const noteService = USE_MOCKS ? mockService : realService
