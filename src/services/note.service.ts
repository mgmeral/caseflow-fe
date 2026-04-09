/**
 * Notes service — aligned to backend /api/notes endpoints.
 */
import type { TicketMessage } from '@/types/ticket.types'
import type { NoteResponse, AddNoteRequest } from '@/types/api.types'
import { apiClient } from './api.client'
import { mapNoteResponseToTicketMessage } from '@/lib/noteMessage'

export const noteService = {
  getByTicket: async (ticketId: string): Promise<TicketMessage[]> => {
    const notes = await apiClient.get<NoteResponse[]>(`/notes/by-ticket/${ticketId}`)
    return notes.map(mapNoteResponseToTicketMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getById: async (id: string): Promise<TicketMessage | null> => {
    const note = await apiClient.get<NoteResponse>(`/notes/${id}`)
    return note ? mapNoteResponseToTicketMessage(note) : null
  },

  create: async (req: AddNoteRequest): Promise<TicketMessage> => {
    const note = await apiClient.post<NoteResponse>('/notes', {
      ticketId: Number(req.ticketId),
      content: req.content,
      type: req.type,
      mentionedUserIds: req.mentionedUserIds ?? [],
    })
    return mapNoteResponseToTicketMessage(note)
  },
}
