import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EmailThread } from '@/components/ticket-detail/EmailThread'

const sampleEmail = {
  id: 'e1',
  ticketId: 't1',
  threadKey: null,
  messageId: '<m1>',
  providerMessageId: null,
  mailboxId: 'm1',
  mailboxName: 'Main',
  sourceEventId: 'evt-1',
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
  it('calls onSelectEmail when Detail is clicked', () => {
    const onSelectEmail = vi.fn()

    render(<EmailThread emails={[sampleEmail]} onSelectEmail={onSelectEmail} />)

    fireEvent.click(screen.getByRole('button', { name: /open email detail/i }))

    expect(onSelectEmail).toHaveBeenCalledTimes(1)
    expect(onSelectEmail).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }))
  })

  it('renders attachment links when metadata is available', () => {
    render(
      <EmailThread
        emails={[
          {
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
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { name: 'View Attachments' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'View Attachments' }))

    expect(screen.getAllByText('Email Attachments')[0]).toBeInTheDocument()
    expect(screen.getAllByText('invoice.pdf').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Open' }).closest('a')).toHaveAttribute('href', '/files/invoice.pdf')
    expect(screen.getByRole('button', { name: 'Download' }).closest('a')).toHaveAttribute('href', '/files/invoice.pdf')
  })

  it('shows an honest placeholder when attachment count exists without metadata', () => {
    render(
      <EmailThread
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
    fireEvent.click(screen.getByRole('button', { name: 'View Attachments' }))

    expect(screen.getByText('Attachment metadata is not available for this message.')).toBeInTheDocument()
  })

  it('shows outbound statuses without overstating delivery', () => {
    render(
      <EmailThread
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
})
