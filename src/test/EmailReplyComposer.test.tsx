import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

const mockMutate = vi.hoisted(() => vi.fn())
const mockSuccess = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())
const mockTemplatesError = vi.hoisted(() => ({ value: false }))

vi.mock('@/hooks/useTicketEmails', () => ({
  useSendTicketReply: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

vi.mock('@/hooks/useMailboxes', () => ({
  useMailboxes: () => ({
    data: {
      items: [
        { id: 'm1', name: 'Main', address: 'support@caseflow.com' },
      ],
    },
  }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}))

vi.mock('@/hooks/useTemplates', () => ({
  useTemplates: () => ({
    data: [
      {
        id: 'tpl-1',
        name: 'Acknowledgement',
        code: 'ACK',
        subjectTemplate: 'Template Subject',
        htmlTemplate: '<p>Template HTML</p>',
        plainTextTemplate: 'Template body',
        isActive: true,
        isBuiltIn: false,
        canEdit: true,
        canDelete: true,
        createdAt: null,
        updatedAt: null,
      },
    ],
    isError: mockTemplatesError.value,
  }),
  useTemplatePreview: () => ({
    data: {
      subject: 'Preview Subject',
      html: '<p>Preview HTML</p>',
      plainText: 'Preview text',
    },
    isLoading: false,
    isError: false,
  }),
}))

const { EmailReplyComposer } = await import('@/components/ticket-detail/EmailReplyComposer')

function buildInboundReplyContext() {
  return {
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
    from: 'Customer Name <customer@example.com>',
    to: ['support@caseflow.com'],
    cc: [],
    bcc: [],
    bodyText: 'Hello',
    bodyHtml: null,
    sanitizedHtmlBody: null,
    rawHtmlBody: null,
    bodyPreview: 'Hello',
    sentAt: null,
    receivedAt: '2026-03-01T10:00:00Z',
    processingStatus: 'COMPLETED' as const,
    dispatchStatus: null,
    attachmentCount: 0,
    attachments: [],
  }
}

describe('EmailReplyComposer', () => {
  beforeEach(() => {
    mockMutate.mockReset()
    mockSuccess.mockReset()
    mockError.mockReset()
    mockTemplatesError.value = false
  })

  it('hides unsupported fields, removes manual To entry, and submits a source-event reply payload', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    expect(screen.queryByText('To *')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('recipient@example.com')).not.toBeInTheDocument()
    expect(screen.getByText('Reply target is derived from the selected inbound email context. Manual To entry is disabled in real reply mode.')).toBeInTheDocument()
    expect(screen.getByText('Real mode supports direct replies only. CC, BCC, and attachments are hidden until the backend supports them.')).toBeInTheDocument()
    expect(screen.queryByText(/^Cc$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Bcc$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Attachments$/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('combobox')).toHaveLength(2)

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Reply body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(mockMutate).toHaveBeenCalledWith(
      {
        mailboxId: 'm1',
        sourceEventId: 'evt-1',
        subject: 'Re: Need help',
        textBody: 'Reply body',
        inReplyToMessageId: '<m1>',
      },
      expect.any(Object),
    )
  })

  it('keeps send disabled when there is no inbound reply context', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketSubject="Need help"
      />,
    )

    expect(screen.getByText('No inbound email context is available. This screen only supports real threaded replies, so direct outreach is not enabled here.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })

  it('shows queued feedback for accepted replies', () => {
    const onClose = vi.fn()

    render(
      <EmailReplyComposer
        isOpen
        onClose={onClose}
        ticketId="t1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Queued body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const queuedOptions = mockMutate.mock.calls[0][1]
    act(() => {
      queuedOptions.onSuccess({ requestId: 'r1', ticketId: 't1', outboundEmailId: null, mailboxId: 'm1', status: 'QUEUED', acceptedAt: null, message: null })
    })

    expect(screen.getByText('Reply accepted and queued for delivery.')).toBeInTheDocument()
    expect(mockSuccess).toHaveBeenCalledWith('Reply accepted and queued for delivery.')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows sent feedback when delivery is already confirmed', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Sent body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const sentOptions = mockMutate.mock.calls[0][1]
    act(() => {
      sentOptions.onSuccess({ requestId: 'r2', ticketId: 't1', outboundEmailId: 'o1', mailboxId: 'm1', status: 'SENT', acceptedAt: null, message: null })
    })

    expect(mockSuccess).toHaveBeenCalledWith('Reply sent.')
  })

  it('shows dispatched feedback without overstating final delivery', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Dispatched body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const dispatchedOptions = mockMutate.mock.calls[0][1]
    act(() => {
      dispatchedOptions.onSuccess({ requestId: 'r2', ticketId: 't1', outboundEmailId: 'o1', mailboxId: 'm1', status: 'DISPATCHED', acceptedAt: null, message: null })
    })

    expect(mockSuccess).toHaveBeenCalledWith('Reply dispatched to outbound delivery.')
  })

  it('shows failed feedback without pretending the reply was sent', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Failure body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const failedOptions = mockMutate.mock.calls[0][1]
    act(() => {
      failedOptions.onSuccess({ requestId: 'r3', ticketId: 't1', outboundEmailId: null, mailboxId: 'm1', status: 'FAILED', acceptedAt: null, message: 'Mailbox unavailable' })
    })

    expect(screen.getByText('Mailbox unavailable')).toBeInTheDocument()
    expect(mockError).toHaveBeenCalledWith('Mailbox unavailable')
  })

  it('loads backend templates, applies selection, and opens template preview', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'tpl-1' } })

    expect(screen.getByDisplayValue('Template Subject')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Template body')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /preview/i }))

    expect(screen.getByText('Preview Subject')).toBeInTheDocument()
    expect(screen.getByText('Preview text')).toBeInTheDocument()
  })

  it('shows an honest template availability error when backend template list is unavailable', () => {
    mockTemplatesError.value = true

    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    expect(screen.getByText('Template list is unavailable for this session.')).toBeInTheDocument()
  })
})