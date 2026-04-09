import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const cancelMutate = vi.hoisted(() => vi.fn())
const scheduledState = vi.hoisted(() => ({
  data: [
    {
      id: 1,
      ticketId: 100,
      mailboxId: 1,
      mailboxName: 'Main',
      mailboxAddress: 'support@caseflow.com',
      fromAddress: 'support@caseflow.com',
      resolvedRecipient: 'customer@example.com',
      toAddress: 'customer@example.com',
      subject: 'Follow-up',
      status: 'PENDING',
      failureReason: null,
      failureCategory: null,
      sendNotBefore: '2026-04-10T09:00:00Z',
      canceledAt: null,
      sentAt: null,
      createdAt: '2026-04-06T10:00:00Z',
    },
    {
      id: 2,
      ticketId: 100,
      mailboxId: 1,
      mailboxName: 'Main',
      mailboxAddress: 'support@caseflow.com',
      fromAddress: 'support@caseflow.com',
      resolvedRecipient: 'customer@example.com',
      toAddress: 'customer@example.com',
      subject: 'Reminder',
      status: 'FAILED',
      failureReason: 'Mailbox unavailable',
      failureCategory: 'SMTP_AUTH',
      sendNotBefore: '2026-04-09T09:00:00Z',
      canceledAt: null,
      sentAt: null,
      createdAt: '2026-04-06T10:00:00Z',
    },
  ],
  isLoading: false,
  isError: false,
  error: null as Error | null,
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canManageScheduledEmail: true }),
}))

vi.mock('@/hooks/useIntegrations', () => ({
  useScheduledEmails: () => scheduledState,
  useCancelScheduledEmail: () => ({ mutate: cancelMutate, isPending: false }),
}))

const { ScheduledEmailsCard } = await import('@/components/ticket-detail/ScheduledEmailsCard')

describe('ScheduledEmailsCard', () => {
  beforeEach(() => {
    cancelMutate.mockReset()
  })

  it('renders upcoming and historical scheduled email states', () => {
    render(<ScheduledEmailsCard ticketPublicId="ticket-public-1" ticketStatus="ASSIGNED" />)

    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Follow-up')).toBeInTheDocument()
    expect(screen.getByText('Reminder')).toBeInTheDocument()
    expect(screen.getAllByText('Mailbox Main (support@caseflow.com)').length).toBeGreaterThan(0)
    expect(screen.getAllByText('From support@caseflow.com').length).toBeGreaterThan(0)
    expect(screen.getByText('Failure reason: Mailbox unavailable')).toBeInTheDocument()
    expect(screen.getByText('Failure category: SMTP_AUTH')).toBeInTheDocument()
  })

  it('cancels pending scheduled emails with the dispatch id', () => {
    render(<ScheduledEmailsCard ticketPublicId="ticket-public-1" ticketStatus="ASSIGNED" />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel Schedule' }))
    expect(cancelMutate).toHaveBeenCalledWith(1)
  })
})