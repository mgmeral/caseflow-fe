import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { TicketMessage } from '@/types/ticket.types'

const hydratedDetailState = vi.hoisted(() => ({
  data: null as any,
  isLoading: false,
}))

const detailHookCalls = vi.hoisted(() => [] as Array<{ ticketPublicId: string; emailId: string; direction?: 'INBOUND' | 'OUTBOUND'; enabled?: boolean }>)

vi.mock('@/hooks/useTicketEmails', () => ({
  useTicketEmailDetailByDirection: (ticketPublicId: string, emailId: string, direction?: 'INBOUND' | 'OUTBOUND', enabled = true) => (
    detailHookCalls.push({ ticketPublicId, emailId, direction, enabled }),
    enabled
      ? hydratedDetailState
      : { data: null, isLoading: false }
  ),
}))

const { EmailThread } = await import('@/components/ticket-detail/EmailThread')

const sampleEmail = {
  id: 'e1',
  emailDocumentId: 'e1',
  ticketId: 't1',
  detailType: 'INBOUND' as const,
  detailId: 'e1',
  threadKey: null,
  messageId: '<m1>',
  providerMessageId: null,
  mailboxId: 'm1',
  mailboxName: 'Main',
  sourceEventId: 101,
  direction: 'INBOUND' as const,
  subject: 'Need help',
  from: 'customer@akbank.com',
  to: ['support@caseflow.com'],
  cc: [],
  bcc: [],
  bodyText: 'Body',
  bodyHtml: null,
  sanitizedHtmlBody: null,
  rawHtmlBody: null,
  bodyPreview: 'Body',
  sentAt: null,
  receivedAt: '2026-03-01T10:00:00Z',
  processingStatus: null,
  dispatchStatus: null,
  attachmentCount: 0,
  attachments: [],
}

describe('EmailThread', () => {
  beforeEach(() => {
    hydratedDetailState.data = null
    hydratedDetailState.isLoading = false
    detailHookCalls.length = 0
  })

  it('hydrates detail with the real email document id instead of the thread event id', () => {
    render(
      <EmailThread
        ticketPublicId="ticket-public-1"
        emails={[
          {
            ...sampleEmail,
            id: '74',
            emailDocumentId: 'email-74',
            detailId: 'email-74',
            bodyText: null,
            bodyPreview: 'Preview only',
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button'))

    expect(detailHookCalls).toContainEqual(
      expect.objectContaining({ ticketPublicId: 'ticket-public-1', emailId: 'email-74', direction: 'INBOUND', enabled: true }),
    )
    expect(detailHookCalls).not.toContainEqual(
      expect.objectContaining({ emailId: '74', enabled: true }),
    )
  })

  it('calls onSelectEmail when Detail is clicked', () => {
    const onSelectEmail = vi.fn()

    render(<EmailThread ticketPublicId="ticket-public-1" emails={[sampleEmail]} onSelectEmail={onSelectEmail} />)

    fireEvent.click(screen.getByRole('button', { name: /open email detail/i }))

    expect(onSelectEmail).toHaveBeenCalledTimes(1)
    expect(onSelectEmail).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }))
  })

  it('shows attachment count metadata without rendering an inline attachment action', () => {
    hydratedDetailState.data = {
      ...sampleEmail,
      attachmentCount: 1,
      attachments: [
        {
          id: 'a1',
          fileName: 'invoice.pdf',
          contentType: 'application/pdf',
          size: 2048,
          sizeBytes: 2048,
          downloadUrl: '/files/invoice.pdf',
        },
      ],
    }

    render(
      <EmailThread
        ticketPublicId="ticket-public-1"
        emails={[
          {
            ...sampleEmail,
            attachmentCount: 1,
            attachments: [],
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('button', { name: 'View Attachments' })).not.toBeInTheDocument()
  })

  it('prefers hydrated sanitized HTML over preview text in the expanded body', () => {
    hydratedDetailState.data = {
      ...sampleEmail,
      sanitizedHtmlBody: '<p>Sanitized thread body</p>',
      bodyText: 'Plain fallback',
    }

    render(<EmailThread ticketPublicId="ticket-public-1" emails={[{ ...sampleEmail, bodyText: null, sanitizedHtmlBody: null, bodyPreview: 'Preview only' }]} />)

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('Sanitized thread body')).toBeInTheDocument()
    expect(screen.queryByText('Preview only')).not.toBeInTheDocument()
  })

  it('uses conversation message content as a fallback when email body fields are empty', () => {
    const fallbackMessages: TicketMessage[] = [
      {
        id: 'msg-1',
        ticketId: 't1',
        type: 'public_inbound',
        authorId: null,
        authorName: 'customer@akbank.com',
        content: 'Tamam abi tesekkur ediyorum',
        createdAt: '2026-03-01T10:00:00Z',
        attachments: [],
      },
    ]

    render(
      <EmailThread
        ticketPublicId="ticket-public-1"
        emails={[
          {
            ...sampleEmail,
            bodyText: null,
            bodyPreview: null,
            sanitizedHtmlBody: null,
          },
        ]}
        messageFallbacks={fallbackMessages}
      />,
    )

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('Tamam abi tesekkur ediyorum')).toBeInTheDocument()
    expect(screen.queryByText('No body content available.')).not.toBeInTheDocument()
  })

  it('does not show an inline attachment action when attachment metadata exists', () => {
    render(
      <EmailThread
        ticketPublicId="ticket-public-1"
        emails={[
          {
            ...sampleEmail,
            attachmentCount: 2,
            attachments: [],
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button'))

    expect(screen.queryByRole('button', { name: 'View Attachments' })).not.toBeInTheDocument()
  })

  it('shows outbound statuses without overstating delivery', () => {
    render(
      <EmailThread
        ticketPublicId="ticket-public-1"
        emails={[
          {
            ...sampleEmail,
            id: 'e2',
            direction: 'OUTBOUND',
            from: 'support@caseflow.com',
            to: ['customer@akbank.com'],
            sentAt: '2026-03-01T10:05:00Z',
            receivedAt: null,
            dispatchStatus: 'DISPATCHED',
          },
        ]}
      />,
    )

    expect(screen.getByText('Dispatched')).toBeInTheDocument()
    expect(screen.queryByText('Delivered')).not.toBeInTheDocument()
  })

  it('shows a clear failure reason when the backend exposes one', () => {
    hydratedDetailState.data = {
      ...sampleEmail,
      id: 'e2',
      direction: 'OUTBOUND',
      from: 'support@caseflow.com',
      to: ['customer@akbank.com'],
      sentAt: '2026-03-01T10:05:00Z',
      receivedAt: null,
      dispatchStatus: 'FAILED',
      failureReason: 'Mailbox unavailable',
    }

    render(
      <EmailThread
        ticketPublicId="ticket-public-1"
        emails={[
          {
            ...sampleEmail,
            id: 'e2',
            direction: 'OUTBOUND',
            from: 'support@caseflow.com',
            to: ['customer@akbank.com'],
            sentAt: '2026-03-01T10:05:00Z',
            receivedAt: null,
            dispatchStatus: 'FAILED',
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('Delivery failed: Mailbox unavailable')).toBeInTheDocument()
  })
})
