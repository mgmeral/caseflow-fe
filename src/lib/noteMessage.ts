import type {
  BackendUserSummaryResponse,
  NoteMentionResponse,
  NoteResponse,
} from '@/types/api.types'
import type { TicketMessage } from '@/types/ticket.types'

type TicketAuthorUser = NonNullable<NonNullable<TicketMessage['authorUser']>>
type TicketMention = NonNullable<TicketMessage['mentions']>[number]

function normalizeString(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function toUserId(value: string | number | null | undefined): string | null {
  if (value == null) return null
  const normalized = String(value).trim()
  return normalized || null
}

function normalizeUserSummary(
  user?: BackendUserSummaryResponse | NoteMentionResponse | null,
): TicketAuthorUser | null {
  if (!user) return null

  return {
    id: toUserId(user.id),
    username: normalizeString(user.username),
    displayName: normalizeString(user.displayName),
    fullName: normalizeString(user.fullName),
    email: normalizeString(user.email),
  }
}

function resolveMentionUserSummary(
  mention?: NoteMentionResponse | null,
): TicketMention['userId'] | null {
  return toUserId(mention?.mentionedUserId ?? mention?.userId ?? mention?.id)
}

export function formatNoteAuthor(user?: BackendUserSummaryResponse | null): string {
  const normalized = normalizeUserSummary(user)
  const username = normalizeString(normalized?.username)
  const displayName = normalizeString(normalized?.displayName)
  const fullName = normalizeString(normalized?.fullName)

  if (username) {
    const secondaryLabel = displayName ?? fullName
    if (secondaryLabel && secondaryLabel.localeCompare(username, undefined, { sensitivity: 'accent' }) !== 0) {
      return `${secondaryLabel} (@${username})`
    }

    return `@${username}`
  }

  return displayName ?? fullName ?? 'Unknown user'
}

export function normalizeNoteMentions(note: NoteResponse): TicketMessage['mentions'] {
  if (!Array.isArray(note.mentions)) return []

  return note.mentions
    .map((mention) => {
      const userId = resolveMentionUserSummary(mention)
      if (!userId) return null

      const userSummary = normalizeUserSummary(mention)
      const normalizedMention: TicketMention = {
        userId,
        displayText:
          normalizeString(mention.displayText)
          ?? normalizeString(userSummary?.username)
          ?? normalizeString(userSummary?.displayName)
          ?? normalizeString(userSummary?.fullName)
          ?? 'Unknown user',
        username: userSummary?.username ?? null,
        displayName: userSummary?.displayName ?? null,
        fullName: userSummary?.fullName ?? null,
        email: userSummary?.email ?? null,
        startIndex: mention.startIndex ?? null,
        endIndex: mention.endIndex ?? null,
      }

      return normalizedMention
    })
    .filter((mention): mention is TicketMention => Boolean(mention))
}

export function mapNoteResponseToTicketMessage(note: NoteResponse): TicketMessage {
  const typeMap: Record<string, TicketMessage['type']> = {
    INTERNAL: 'internal_note',
    INFO: 'system_event',
    INVESTIGATION: 'internal_note',
    ESCALATION: 'internal_note',
  }

  return {
    id: note.id,
    ticketId: note.ticketId,
    type: typeMap[note.type] ?? 'internal_note',
    authorId: toUserId(note.createdByUser?.id) ?? toUserId(note.createdBy),
    authorName: formatNoteAuthor(note.createdByUser),
    authorUser: normalizeUserSummary(note.createdByUser),
    content: note.content,
    mentions: normalizeNoteMentions(note),
    createdAt: note.createdAt,
    attachments: [],
    eventType: note.eventType ?? null,
    metadataJson: note.metadataJson ?? null,
  }
}