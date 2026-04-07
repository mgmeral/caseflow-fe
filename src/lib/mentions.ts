import type { User } from '@/types/user.types'

/* ── Types ─────────────────────────────────────────── */

export interface MentionMatch {
  /** Full display text including "@", e.g. "@Mehmet Gökhan" */
  display: string
  /** User id — will be used when backend mention metadata is added */
  userId: string
  /** Display name without the "@" prefix */
  displayName: string
}

/* ── Constants ─────────────────────────────────────── */

/**
 * Regex to detect @mentions in rendered text.
 * Matches @Word or @Word Word (1-3 words, each starting uppercase — names).
 * Non-greedy: stops at the first lowercase-starting word or punctuation.
 */
export const MENTION_REGEX = /@([A-ZÀ-ÿÇĞİÖŞÜ][A-Za-zÀ-ÿçğıöşü]*(?:\s[A-ZÀ-ÿÇĞİÖŞÜ][A-Za-zÀ-ÿçğıöşü]*){0,2})/g

/* ── Query detection ───────────────────────────────── */

/**
 * Detects if the caret is inside an active @mention query.
 * Returns the query string after "@" or null if not in a mention context.
 */
export function detectMentionQuery(text: string, cursorPos: number): string | null {
  // Walk backwards from cursor to find the "@" trigger
  const before = text.slice(0, cursorPos)
  const atIdx = before.lastIndexOf('@')
  if (atIdx === -1) return null

  // "@" must be at start or preceded by whitespace/newline
  if (atIdx > 0 && !/\s/.test(before[atIdx - 1])) return null

  const query = before.slice(atIdx + 1)

  // If there's a newline after "@" in the query, it's not a mention
  if (query.includes('\n')) return null

  return query
}

/* ── User filtering ────────────────────────────────── */

/**
 * Filters users by a mention query string.
 * Matches against fullName, username, and email (case-insensitive).
 */
export function filterMentionUsers(users: User[], query: string, limit = 8): User[] {
  if (!query && query !== '') return users.slice(0, limit)

  const q = query.toLowerCase().trim()
  if (!q) return users.filter((u) => u.isActive).slice(0, limit)

  return users
    .filter((u) => {
      if (!u.isActive) return false
      return (
        u.fullName.toLowerCase().includes(q) ||
        (u.username?.toLowerCase().includes(q) ?? false) ||
        u.email.toLowerCase().includes(q)
      )
    })
    .slice(0, limit)
}

/* ── Insertion ─────────────────────────────────────── */

/**
 * Inserts a selected mention into the text at the cursor position,
 * replacing the current @query with the full mention display name.
 * Returns the new text and the new cursor position.
 */
export function insertMention(
  text: string,
  cursorPos: number,
  user: User,
): { newText: string; newCursorPos: number } {
  const before = text.slice(0, cursorPos)
  const after = text.slice(cursorPos)
  const atIdx = before.lastIndexOf('@')

  const mention = `@${user.fullName} `
  const newText = before.slice(0, atIdx) + mention + after
  const newCursorPos = atIdx + mention.length

  return { newText, newCursorPos }
}

/* ── Rendering helpers ─────────────────────────────── */

export interface MentionSegment {
  type: 'text' | 'mention'
  value: string
}

/**
 * Parses a note content string into segments of plain text and @mentions.
 * Used by MentionText renderer.
 */
export function parseMentionSegments(content: string): MentionSegment[] {
  const segments: MentionSegment[] = []
  let lastIndex = 0

  const regex = new RegExp(MENTION_REGEX.source, 'g')
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    // Text before this mention
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'mention', value: match[0] })
    lastIndex = match.index + match[0].length
  }

  // Trailing text
  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) })
  }

  return segments
}
