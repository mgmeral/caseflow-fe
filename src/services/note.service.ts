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
  // Map backend NoteType (INTERNAL/INFO/INVESTIGATION/ESCALATION) → FE MessageType
  const typeMap: Record<string, TicketMessage['type']> = {
    INTERNAL: 'internal_note',
    INFO: 'system_event',
    INVESTIGATION: 'internal_note',
    ESCALATION: 'internal_note',
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
    const mockTypeMap: Record<string, TicketMessage['type']> = {
      INTERNAL: 'internal_note',
      INFO: 'system_event',
      INVESTIGATION: 'internal_note',
      ESCALATION: 'internal_note',
    }
    const msg: TicketMessage = {
      id: `note-${++_mockNoteIdCounter}`,
      ticketId: req.ticketId,
      type: mockTypeMap[req.type] ?? 'internal_note',
      authorId: req.authorId ?? null,
      authorName: req.authorId ?? 'Unknown',
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
    // authorId is NOT sent to the backend — the API derives the author from the session token
    const { authorId: _authorId, ...body } = req
    const note = await apiClient.post<NoteResponse>('/notes', body)
    return noteToMessage(note)
  },
}

export const noteService = USE_MOCKS ? mockService : realService
