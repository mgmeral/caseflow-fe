import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canAssignTickets: true,
    canCloseTickets: true,
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
        activities={[]}
        onAssign={vi.fn()}
        onChangeStatus={onChangeStatus}
        onChangePriority={vi.fn()}
        onCloseTicket={vi.fn()}
        onReopenTicket={vi.fn()}
        onTransfer={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Triaged' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Waiting Customer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close Ticket' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reopen Ticket' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Triaged' }))
    expect(onChangeStatus).toHaveBeenCalledWith('TRIAGED')
  })

  it('shows quick actions only when those transitions are allowed', () => {
    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={['RESOLVED', 'CLOSED']}
        activities={[]}
        onAssign={vi.fn()}
        onChangeStatus={vi.fn()}
        onChangePriority={vi.fn()}
        onCloseTicket={vi.fn()}
        onReopenTicket={vi.fn()}
        onTransfer={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Close Ticket' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark as Resolved' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reopen Ticket' })).not.toBeInTheDocument()
    expect(screen.getByText('No manual status actions available.')).toBeInTheDocument()
  })

  it('renders activity timeline entries from backend-derived history data', () => {
    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={[]}
        activities={[
          {
            id: 'activity-1',
            kind: 'reply_failed',
            actor: 'support@caseflow.com',
            timestamp: '2026-03-01T11:00:00Z',
            summary: 'Reply failed to send.',
            detail: 'Re: Issue',
          },
          {
            id: 'activity-2',
            kind: 'transferred',
            actor: 'Case Flow',
            timestamp: '2026-03-01T10:30:00Z',
            summary: 'Transferred from Tier 1 to Tier 2.',
            detail: 'Escalated to specialist',
          },
        ]}
        onAssign={vi.fn()}
        onChangeStatus={vi.fn()}
        onChangePriority={vi.fn()}
        onCloseTicket={vi.fn()}
        onReopenTicket={vi.fn()}
        onTransfer={vi.fn()}
      />,
    )

    expect(screen.getByText('Reply failed to send.')).toBeInTheDocument()
    expect(screen.getByText('Transferred from Tier 1 to Tier 2.')).toBeInTheDocument()
    expect(screen.getByText('Escalated to specialist')).toBeInTheDocument()
  })

  it('shows a loading state while backend history is still loading', () => {
    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={[]}
        activities={[]}
        isActivityLoading
        onAssign={vi.fn()}
        onChangeStatus={vi.fn()}
        onChangePriority={vi.fn()}
        onCloseTicket={vi.fn()}
        onReopenTicket={vi.fn()}
        onTransfer={vi.fn()}
      />,
    )

    expect(screen.getByText('Loading history...')).toBeInTheDocument()
    expect(screen.queryByText('No history yet.')).not.toBeInTheDocument()
  })

  it('renders a shared attachments section and exposes a view action', () => {
    const onViewAttachments = vi.fn()

    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={[]}
        activities={[]}
        attachments={[
          {
            id: 'att-1',
            ticketId: 't1',
            emailId: 'e1',
            fileName: 'resume.pdf',
            contentType: 'application/pdf',
            size: 2048,
            downloadUrl: '/files/resume.pdf',
            uploadedAt: '2026-03-01T10:00:00Z',
          },
        ]}
        onViewAttachments={onViewAttachments}
        onAssign={vi.fn()}
        onChangeStatus={vi.fn()}
        onChangePriority={vi.fn()}
        onCloseTicket={vi.fn()}
        onReopenTicket={vi.fn()}
        onTransfer={vi.fn()}
      />,
    )

    expect(screen.getByText('Attachments')).toBeInTheDocument()
    expect(screen.getByText('resume.pdf')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'View Attachments' }))
    expect(onViewAttachments).toHaveBeenCalledTimes(1)
  })

  it('shows an attachment loading state before hydrated email attachments arrive', () => {
    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={[]}
        activities={[]}
        attachments={[]}
        isAttachmentLoading
        onViewAttachments={vi.fn()}
        onAssign={vi.fn()}
        onChangeStatus={vi.fn()}
        onChangePriority={vi.fn()}
        onCloseTicket={vi.fn()}
        onReopenTicket={vi.fn()}
        onTransfer={vi.fn()}
      />,
    )

    expect(screen.getByText('Loading attachments...')).toBeInTheDocument()
    expect(screen.queryByText('No attachments on this email.')).not.toBeInTheDocument()
  })

  it('renders the current email empty state only when the selected email has no attachments', () => {
    render(
      <TicketSidePanel
        ticket={baseTicket as any}
        allowedTransitions={[]}
        activities={[]}
        attachments={[]}
        attachmentEmptyMessage="No attachments on this email."
        onViewAttachments={vi.fn()}
        onAssign={vi.fn()}
        onChangeStatus={vi.fn()}
        onChangePriority={vi.fn()}
        onCloseTicket={vi.fn()}
        onReopenTicket={vi.fn()}
        onTransfer={vi.fn()}
      />,
    )

    expect(screen.getByText('No attachments on this email.')).toBeInTheDocument()
  })
})