/**
 * Notes service — aligned to backend /api/notes endpoints.
 */
import type { TicketMessage } from '@/types/ticket.types'
import type { NoteResponse, AddNoteRequest } from '@/types/api.types'
import { apiClient } from './api.client'

function noteToMessage(n: NoteResponse): TicketMessage {
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
    authorId: n.createdBy ?? null,
    authorName: n.createdBy ?? '',
    content: n.content,
    createdAt: n.createdAt,
    attachments: [],
    eventType: n.eventType ?? null,
    metadataJson: n.metadataJson ?? null,
  }
}

export const noteService = {
  getByTicket: async (ticketId: string): Promise<TicketMessage[]> => {
    const notes = await apiClient.get<NoteResponse[]>(`/notes/by-ticket/${ticketId}`)
    return notes.map(noteToMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getById: async (id: string): Promise<TicketMessage | null> => {
    const note = await apiClient.get<NoteResponse>(`/notes/${id}`)
    return note ? noteToMessage(note) : null
  },

  create: async (req: AddNoteRequest): Promise<TicketMessage> => {
    const note = await apiClient.post<NoteResponse>('/notes', {
      ticketId: Number(req.ticketId),
      content: req.content,
      type: req.type,
    })
    return noteToMessage(note)
  },
}
