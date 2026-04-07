import { describe, it, expect } from 'vitest'
import {
  detectMentionQuery,
  filterMentionUsers,
  insertMention,
  parseMentionSegments,
} from '@/lib/mentions'
import type { User } from '@/types/user.types'

/* ── Helpers ───────────────────────────────────────── */

function makeUser(overrides: Partial<User> & { id: string; fullName: string }): User {
  return {
    username: overrides.fullName.toLowerCase().replace(/\s/g, '.'),
    firstName: overrides.fullName.split(' ')[0],
    lastName: overrides.fullName.split(' ').slice(1).join(' '),
    email: `${overrides.fullName.toLowerCase().replace(/\s/g, '.')}@example.com`,
    role: 'agent',
    permissionCodes: [],
    ticketScope: 'ALL',
    groupIds: [],
    groupNames: [],
    adminLevel: 0,
    isActive: true,
    lastLoginAt: null,
    openTicketCount: 0,
    avatarColor: '#4f46e5',
    ...overrides,
  }
}

const users: User[] = [
  makeUser({ id: '1', fullName: 'Mehmet Gökhan', email: 'mgokhan@acme.com' }),
  makeUser({ id: '2', fullName: 'Ayşe Yılmaz', email: 'ayilmaz@acme.com' }),
  makeUser({ id: '3', fullName: 'John Smith', email: 'jsmith@acme.com', isActive: false }),
  makeUser({ id: '4', fullName: 'Ali Veli', email: 'ali@example.com', username: 'aliveli' }),
]

/* ── detectMentionQuery ────────────────────────────── */

describe('detectMentionQuery', () => {
  it('returns null when there is no @ symbol', () => {
    expect(detectMentionQuery('hello world', 11)).toBeNull()
  })

  it('returns empty string right after @', () => {
    expect(detectMentionQuery('hello @', 7)).toBe('')
  })

  it('returns the query text after @', () => {
    expect(detectMentionQuery('hello @Meh', 10)).toBe('Meh')
  })

  it('returns null when @ is mid-word', () => {
    expect(detectMentionQuery('email@test', 10)).toBeNull()
  })

  it('works at the start of text', () => {
    expect(detectMentionQuery('@Ali', 4)).toBe('Ali')
  })

  it('returns null when there is a newline after @', () => {
    expect(detectMentionQuery('@test\nmore', 10)).toBeNull()
  })

  it('picks the last @ when multiple exist', () => {
    expect(detectMentionQuery('@One hello @Tw', 14)).toBe('Tw')
  })
})

/* ── filterMentionUsers ────────────────────────────── */

describe('filterMentionUsers', () => {
  it('filters by fullName', () => {
    const result = filterMentionUsers(users, 'Mehmet')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by email', () => {
    const result = filterMentionUsers(users, 'ayilmaz')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by username', () => {
    const result = filterMentionUsers(users, 'aliveli')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('4')
  })

  it('excludes inactive users', () => {
    const result = filterMentionUsers(users, 'John')
    expect(result).toHaveLength(0)
  })

  it('returns limited results', () => {
    const manyUsers = Array.from({ length: 20 }, (_, i) =>
      makeUser({ id: String(i), fullName: `User ${i}` }),
    )
    const result = filterMentionUsers(manyUsers, '', 5)
    expect(result).toHaveLength(5)
  })

  it('is case-insensitive', () => {
    const result = filterMentionUsers(users, 'MEHMET')
    expect(result).toHaveLength(1)
  })
})

/* ── insertMention ─────────────────────────────────── */

describe('insertMention', () => {
  it('replaces @query with full mention', () => {
    const user = users[0]
    const { newText, newCursorPos } = insertMention('hello @Meh', 10, user)
    expect(newText).toBe('hello @Mehmet Gökhan ')
    expect(newCursorPos).toBe(21)
  })

  it('preserves text after cursor', () => {
    const user = users[1]
    const { newText } = insertMention('cc @Ay and others', 7, user)
    expect(newText).toBe('cc @Ayşe Yılmaz and others')
  })

  it('works at start of text', () => {
    const user = users[3]
    const { newText, newCursorPos } = insertMention('@Al', 3, user)
    expect(newText).toBe('@Ali Veli ')
    expect(newCursorPos).toBe(10)
  })
})

/* ── parseMentionSegments ──────────────────────────── */

describe('parseMentionSegments', () => {
  it('returns single text segment for plain text', () => {
    const segments = parseMentionSegments('hello world')
    expect(segments).toEqual([{ type: 'text', value: 'hello world' }])
  })

  it('parses a mention in the middle', () => {
    const segments = parseMentionSegments('hello @Mehmet there')
    expect(segments).toEqual([
      { type: 'text', value: 'hello ' },
      { type: 'mention', value: '@Mehmet' },
      { type: 'text', value: ' there' },
    ])
  })

  it('parses multi-word mentions', () => {
    const segments = parseMentionSegments('cc @Mehmet Gökhan please review')
    expect(segments).toEqual([
      { type: 'text', value: 'cc ' },
      { type: 'mention', value: '@Mehmet Gökhan' },
      { type: 'text', value: ' please review' },
    ])
  })

  it('handles multiple mentions', () => {
    const segments = parseMentionSegments('@Ali and @Ayşe check this')
    expect(segments.filter((s) => s.type === 'mention')).toHaveLength(2)
  })

  it('returns empty array for empty string', () => {
    const segments = parseMentionSegments('')
    expect(segments).toEqual([])
  })
})

/* ── Newest-first ordering ─────────────────────────── */

describe('notes ordering (newest first)', () => {
  it('newest note should be sorted first', () => {
    const notes = [
      { createdAt: '2026-01-01T10:00:00Z', content: 'old' },
      { createdAt: '2026-04-07T12:00:00Z', content: 'newest' },
      { createdAt: '2026-02-15T08:00:00Z', content: 'middle' },
    ]
    const sorted = [...notes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    expect(sorted[0].content).toBe('newest')
    expect(sorted[1].content).toBe('middle')
    expect(sorted[2].content).toBe('old')
  })
})
