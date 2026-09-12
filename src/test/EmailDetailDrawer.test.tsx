import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EmailDetailDrawer } from '@/components/ticket-detail/EmailDetailDrawer'

const sampleEmail = {
  id: 'e1',
  emailDocumentId: 'email-1',
  ticketId: 't1',
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
  bodyText: 'Plain fallback',
  bodyHtml: '<p>Unsafe raw body</p>',
  sanitizedHtmlBody: '<p>Sanitized body</p>',
  rawHtmlBody: '<div>Raw source</div>',
  bodyPreview: 'Preview',
  sentAt: null,
  receivedAt: '2026-03-01T10:00:00Z',
  processingStatus: null,
  dispatchStatus: null,
  attachmentCount: 0,
  attachments: [],
}

describe('EmailDetailDrawer', () => {
  it('prefers sanitized HTML for the default body view and exposes raw HTML in a separate tab', () => {
    render(
      <EmailDetailDrawer
        isOpen
        onClose={() => undefined}
        email={sampleEmail}
        isLoading={false}
      />,
    )

    expect(screen.getByText('Sanitized body')).toBeInTheDocument()
    expect(screen.queryByText('Plain fallback')).not.toBeInTheDocument()
    expect(screen.queryByText('Raw source')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Raw HTML' }))

    expect(screen.getByText((content) => content.includes('Raw source'))).toBeInTheDocument()
  })

  it('renders the backend failure reason when an outbound send failed', () => {
    render(
      <EmailDetailDrawer
        isOpen
        onClose={() => undefined}
        email={{
          ...sampleEmail,
          direction: 'OUTBOUND',
          dispatchStatus: 'FAILED',
          sentAt: '2026-03-01T10:05:00Z',
          receivedAt: null,
          failureReason: 'Mailbox unavailable',
        }}
        isLoading={false}
      />,
    )

    expect(screen.getByText('Delivery failed: Mailbox unavailable')).toBeInTheDocument()
  })

  it('shows the attachment action only when attachment metadata exists', () => {
    const { rerender } = render(
      <EmailDetailDrawer
        isOpen
        onClose={() => undefined}
        email={{
          ...sampleEmail,
          attachmentCount: 2,
          attachments: [],
        }}
        isLoading={false}
      />,
    )

    expect(screen.queryByRole('button', { name: 'View Attachments' })).not.toBeInTheDocument()

    rerender(
      <EmailDetailDrawer
        isOpen
        onClose={() => undefined}
        email={{
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
        }}
        isLoading={false}
      />,
    )

    expect(screen.getByRole('button', { name: 'View Attachments' })).toBeInTheDocument()
  })

  it('does not crash when to/cc/bcc are null, a plain string, or an object', () => {
    const variants: Array<{ to: unknown; cc: unknown; bcc: unknown }> = [
      { to: null, cc: null, bcc: null },
      { to: 'support@example.com', cc: 'a@b.com', bcc: undefined },
      { to: { address: 'support@example.com' }, cc: [], bcc: [] },
    ]
    for (const addr of variants) {
      const { unmount } = render(
        <EmailDetailDrawer
          isOpen
          onClose={() => undefined}
          email={{ ...sampleEmail, ...(addr as Record<string, unknown>) } as typeof sampleEmail}
          isLoading={false}
        />,
      )
      expect(screen.getByText('Need help')).toBeInTheDocument()
      unmount()
    }
  })
})