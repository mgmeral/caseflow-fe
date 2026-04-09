import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TicketTable } from '@/components/tickets/TicketTable'
import type { Ticket } from '@/types/ticket.types'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const tickets: Ticket[] = [
  {
    id: '1',
    ticketNo: 'T-1',
    subject: 'Alpha',
    customerName: 'Acme',
    status: 'ASSIGNED',
    priority: 'medium',
    assignedUserId: null,
    assignedUserName: null,
    groupName: 'Tier 1',
    groupId: 'g1',
    openDurationMinutes: 60,
    updatedAt: '2026-04-07T10:00:00Z',
    isUnread: false,
    isTransferred: false,
    customerId: 'c1',
    publicId: null,
    sourceType: 'manual',
    transferredFromGroup: null,
    createdAt: '2026-04-07T09:00:00Z',
    lastActionAt: '2026-04-07T10:00:00Z',
    lastActionSummary: '',
    slaDeadlineAt: null,
    slaBreached: false,
    messageCount: 0,
    internalNoteCount: 0,
    tags: [],
    attachments: [],
  },
]

describe('TicketTable sorting', () => {
  it('cycles asc, desc, then default sort', () => {
    const onSortChange = vi.fn()

    const { rerender } = render(
      <MemoryRouter>
        <TicketTable
          tickets={tickets}
          total={1}
          isLoading={false}
          sort={{ field: 'updatedAt', direction: 'desc' }}
          onSortChange={onSortChange}
          page={1}
          pageSize={25}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Status'))
    expect(onSortChange).toHaveBeenNthCalledWith(1, { field: 'status', direction: 'asc' })

    onSortChange.mockReset()
    rerender(
      <MemoryRouter>
        <TicketTable
          tickets={tickets}
          total={1}
          isLoading={false}
          sort={{ field: 'status', direction: 'asc' }}
          onSortChange={onSortChange}
          page={1}
          pageSize={25}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('Status'))
    expect(onSortChange).toHaveBeenNthCalledWith(1, { field: 'status', direction: 'desc' })

    onSortChange.mockReset()
    rerender(
      <MemoryRouter>
        <TicketTable
          tickets={tickets}
          total={1}
          isLoading={false}
          sort={{ field: 'status', direction: 'desc' }}
          onSortChange={onSortChange}
          page={1}
          pageSize={25}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('Status'))
    expect(onSortChange).toHaveBeenNthCalledWith(1, { field: 'updatedAt', direction: 'desc' })
  })
})
