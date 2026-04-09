import { describe, expect, it } from 'vitest'
import { mapNoteResponseToTicketMessage } from '@/lib/noteMessage'
import type { NoteResponse } from '@/types/api.types'

describe('note message mapping', () => {
  it('prefers username/displayName over legacy fullName and never falls back to numeric author ids for display', () => {
    const result = mapNoteResponseToTicketMessage({
      id: 'n1',
      ticketId: 't1',
      type: 'INTERNAL',
      content: 'Investigating with @ops.team',
      createdBy: 482,
      createdByUser: {
        id: 482,
        username: 'ops.team',
        displayName: 'Ops Team',
      },
      createdAt: '2026-04-01T10:00:00Z',
    } satisfies NoteResponse)

    expect(result.authorId).toBe('482')
    expect(result.authorName).toBe('Ops Team (@ops.team)')
    expect(result.authorUser).toEqual({
      id: '482',
      username: 'ops.team',
      displayName: 'Ops Team',
      fullName: null,
      email: null,
    })
  })

  it('maps displayName-based mentions without breaking mention metadata', () => {
    const result = mapNoteResponseToTicketMessage({
      id: 'n2',
      ticketId: 't2',
      type: 'INTERNAL',
      content: 'Check with @ops.team before closing.',
      createdBy: 99,
      createdByUser: null,
      mentions: [
        {
          mentionedUserId: 55,
          username: 'ops.team',
          displayName: 'Ops Team',
          startIndex: 11,
          endIndex: 20,
        },
      ],
      createdAt: '2026-04-01T11:00:00Z',
    } satisfies NoteResponse)

    expect(result.authorName).toBe('Unknown user')
    expect(result.mentions).toEqual([
      {
        userId: '55',
        displayText: 'ops.team',
        username: 'ops.team',
        displayName: 'Ops Team',
        fullName: null,
        email: null,
        startIndex: 11,
        endIndex: 20,
      },
    ])
  })
})