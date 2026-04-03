import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EmailDetailDrawer } from '@/components/ticket-detail/EmailDetailDrawer'

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
})