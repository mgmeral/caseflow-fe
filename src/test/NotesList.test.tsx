import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NotesList } from '@/components/ticket-detail/NotesList'
import type { TicketMessage } from '@/types/ticket.types'

describe('NotesList', () => {
  it('renders username-aware author labels and never exposes raw numeric ids', () => {
    const notes: TicketMessage[] = [
      {
        id: 'n1',
        ticketId: 't1',
        type: 'internal_note',
        authorId: '482',
        authorName: 'Ops Team (@ops.team)',
        authorUser: {
          id: '482',
          username: 'ops.team',
          displayName: 'Ops Team',
          fullName: null,
          email: null,
        },
        content: 'Internal update',
        mentions: [],
        createdAt: '2026-04-01T10:00:00Z',
        attachments: [],
      },
      {
        id: 'n2',
        ticketId: 't1',
        type: 'internal_note',
        authorId: '991',
        authorName: 'Unknown user',
        authorUser: null,
        content: 'Fallback update',
        mentions: [],
        createdAt: '2026-04-01T11:00:00Z',
        attachments: [],
      },
    ]

    render(<NotesList notes={notes} />)

    expect(screen.getByText('Ops Team (@ops.team)')).toBeInTheDocument()
    expect(screen.getByText('Unknown user')).toBeInTheDocument()
    expect(screen.queryByText('482')).not.toBeInTheDocument()
    expect(screen.queryByText('991')).not.toBeInTheDocument()
  })
})