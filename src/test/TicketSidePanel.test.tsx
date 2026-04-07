import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canChangePriority: true,
    canChangeStatus: true,
  }),
}))

const { TicketSidePanel } = await import('@/components/ticket-detail/TicketSidePanel')

const baseTicket = {
  id: 't1',
  ticketNo: '1001',
  subject: 'Issue',
  customerId: 'c1',
  customerName: 'Acme',
  groupId: 'g1',
  groupName: 'Tier 1',
  assignedUserId: null,
  assignedUserName: null,
  status: 'ASSIGNED',
  priority: 'medium',
  sourceType: 'EMAIL',
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-01T11:00:00Z',
  closedAt: null,
  dueAt: null,
  slaDeadlineAt: null,
  slaBreached: false,
  openDurationMinutes: 30,
  isTransferred: false,
  transferredFromGroup: null,
  lastActionAt: null,
  lastActionSummary: null,
  messageCount: 0,
  internalNoteCount: 0,
  tags: [],
  attachments: [],
}

describe('TicketSidePanel', () => {
  it('renders only backend-allowed status action buttons', () => {
    const onChangeStatus = vi.fn()

    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={['TRIAGED', 'WAITING_CUSTOMER']}
        onChangeStatus={onChangeStatus}
        onChangePriority={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Triaged' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Waiting Customer' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Triaged' }))
    expect(onChangeStatus).toHaveBeenCalledWith('TRIAGED')
  })

  it('shows status & priority in merged section with correct heading', () => {
    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={['RESOLVED', 'CLOSED']}
        onChangeStatus={vi.fn()}
        onChangePriority={vi.fn()}
      />,
    )

    expect(screen.getByText('Status & Priority')).toBeInTheDocument()
    expect(screen.getByText('Assigned')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument()
    // Close/Reopen are in the top action bar, not the side panel
    expect(screen.queryByRole('button', { name: 'Close Ticket' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reopen Ticket' })).not.toBeInTheDocument()
  })

  it('renders SLA section', () => {
    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={[]}
        onChangeStatus={vi.fn()}
        onChangePriority={vi.fn()}
      />,
    )

    expect(screen.getByText('SLA')).toBeInTheDocument()
  })

  it('renders injected tags and integration cards', () => {
    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={[]}
        tagsCard={<div>Tags Card</div>}
        integrationCards={<div>Integration Cards</div>}
        onChangeStatus={vi.fn()}
        onChangePriority={vi.fn()}
      />,
    )

    expect(screen.getByText('Tags Card')).toBeInTheDocument()
    expect(screen.getByText('Integration Cards')).toBeInTheDocument()
  })

  it('does not render attachments or activity timeline (moved to work area)', () => {
    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={[]}
        onChangeStatus={vi.fn()}
        onChangePriority={vi.fn()}
      />,
    )

    expect(screen.queryByText('Attachments')).not.toBeInTheDocument()
    expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument()
  })
})