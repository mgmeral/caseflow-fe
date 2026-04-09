/**
 * Notes service — aligned to backend /api/notes endpoints.
 */
import type { TicketMessage } from '@/types/ticket.types'
import type { NoteResponse, AddNoteRequest } from '@/types/api.types'
import { apiClient } from './api.client'

type NormalizedMention = NonNullable<TicketMessage['mentions']>[number]

function normalizeNoteMentions(n: NoteResponse): TicketMessage['mentions'] {
  if (!Array.isArray(n.mentions)) return []
  return n.mentions
    .map((mention) => {
      const userId = mention.mentionedUserId ?? mention.userId
      if (userId == null) return null
      const normalizedMention: NormalizedMention = {
        userId: String(userId),
        displayText: String(mention.displayText ?? mention.fullName ?? mention.username ?? ''),
        fullName: mention.fullName ?? null,
        username: mention.username ?? null,
        email: mention.email ?? null,
        startIndex: mention.startIndex ?? null,
        endIndex: mention.endIndex ?? null,
      }
      return normalizedMention
    })
    .filter((mention): mention is NormalizedMention => Boolean(mention))
}

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
    authorId: n.createdByUser?.id != null ? String(n.createdByUser.id) : n.createdBy != null ? String(n.createdBy) : null,
    authorName: n.createdByUser?.fullName ?? String(n.createdBy ?? ''),
    authorUser: n.createdByUser
      ? {
          id: n.createdByUser.id != null ? String(n.createdByUser.id) : null,
          fullName: n.createdByUser.fullName ?? '',
          username: n.createdByUser.username ?? null,
          email: n.createdByUser.email ?? null,
        }
      : null,
    content: n.content,
    mentions: normalizeNoteMentions(n),
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
      mentionedUserIds: req.mentionedUserIds ?? [],
    })
    return noteToMessage(note)
  },
}
