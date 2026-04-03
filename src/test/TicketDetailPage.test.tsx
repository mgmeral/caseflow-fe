import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const ticketState = vi.hoisted(() => ({
  isUnread: true,
}))

vi.mock('@/hooks/useTicketDetail', () => ({
  useTicketDetail: () => ({
    ticket: {
      id: 't1',
      ticketNo: 'TK-1',
      subject: 'Unread ticket subject',
      customerId: 'c1',
      customerName: 'Acme',
      groupId: 'g1',
      groupName: 'Support',
      assignedUserId: null,
      assignedUserName: null,
      status: 'ASSIGNED',
      priority: 'medium',
      sourceType: 'email',
      isUnread: ticketState.isUnread,
      isTransferred: false,
      transferredFromGroup: null,
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T01:00:00Z',
      lastActionAt: '2026-04-01T01:00:00Z',
      lastActionSummary: 'Updated',
      openDurationMinutes: 60,
      slaDeadlineAt: null,
      slaBreached: false,
      messageCount: 0,
      internalNoteCount: 0,
      tags: [],
      attachments: [],
    },
    messages: [],
    transfers: [],
    allowedStatusTransitions: [],
    isLoading: false,
    addNote: vi.fn(),
    assign: vi.fn(),
    changeStatus: vi.fn(),
    changePriority: vi.fn(),
    transfer: vi.fn(),
    close: vi.fn(),
    reopen: vi.fn(),
    isAddingNote: false,
    isAssigning: false,
    isTransferring: false,
    isClosing: false,
  }),
}))

vi.mock('@/hooks/useTicketEmails', () => ({
  useTicketEmailThread: () => ({ data: [], isLoading: false }),
  useTicketEmailDetailByDirection: () => ({ data: null, isLoading: false }),
}))

vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({ users: [], groups: [] }),
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canAssignTickets: false,
    canTransferTickets: false,
    canSendTicketEmailReply: false,
    canViewTicketEmail: false,
  }),
}))

vi.mock('@/components/ticket-detail/TicketDetailLayout', () => ({
  TicketDetailLayout: ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) => (
    <div>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  ),
}))

vi.mock('@/components/ticket-detail/ConversationThread', () => ({
  ConversationThread: () => <div>Conversation</div>,
}))

vi.mock('@/components/ticket-detail/EmailThread', () => ({
  EmailThread: () => <div>Email Thread</div>,
}))

vi.mock('@/components/ticket-detail/EmailDetailDrawer', () => ({
  EmailDetailDrawer: () => null,
}))

vi.mock('@/components/ticket-detail/ComposeArea', () => ({
  ComposeArea: () => <div>Compose</div>,
}))

vi.mock('@/components/ticket-detail/TicketSidePanel', () => ({
  TicketSidePanel: () => <div>Side Panel</div>,
}))

vi.mock('@/components/ticket-detail/EmailReplyComposer', () => ({
  EmailReplyComposer: () => null,
}))

vi.mock('@/components/modals/AssignmentModal', () => ({
  AssignmentModal: () => null,
}))

vi.mock('@/components/modals/TransferModal', () => ({
  TransferModal: () => null,
}))

vi.mock('@/components/modals/CloseConfirmModal', () => ({
  CloseConfirmModal: () => null,
}))

const { TicketDetailPage } = await import('@/pages/TicketDetailPage')

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/tickets/t1']}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TicketDetailPage', () => {
  it('shows an unread marker when the backend ticket is unread', () => {
    ticketState.isUnread = true

    renderPage()

    expect(screen.getByLabelText('Unread ticket')).toBeInTheDocument()
    expect(screen.getByText('Unread')).toBeInTheDocument()
  })

  it('does not show the unread marker when the backend ticket is read', () => {
    ticketState.isUnread = false

    renderPage()

    expect(screen.queryByLabelText('Unread ticket')).not.toBeInTheDocument()
    expect(screen.queryByText('Unread')).not.toBeInTheDocument()
  })
})