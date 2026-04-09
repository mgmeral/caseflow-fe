import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

const mockMutate = vi.hoisted(() => vi.fn())
const mockSuccess = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())
const mockInfo = vi.hoisted(() => vi.fn())
const mockTemplatesError = vi.hoisted(() => ({ value: false }))
const mockScheduleMutate = vi.hoisted(() => vi.fn())
const mockReplyPreviewState = vi.hoisted(() => ({
  data: {
    subject: 'Preview Subject',
    bodyHtml: '<p>Preview HTML</p>',
    bodyText: 'Preview text',
    derivedToAddress: 'customer@example.com',
    derivedFromAddress: 'support@caseflow.com',
    warnings: [],
    placeholderDiagnostics: [],
    mailboxName: 'Main',
    mailboxAddress: 'support@caseflow.com',
    isEditable: true,
  } as {
    subject: string
    bodyHtml: string
    bodyText: string
    derivedToAddress: string
    derivedFromAddress: string
    warnings: string[]
    placeholderDiagnostics: Array<{ placeholder: string; status: 'EMPTY' | 'UNKNOWN'; message: string }>
    mailboxName: string
    mailboxAddress: string
    isEditable: boolean
  } | undefined,
  isLoading: false,
  isError: false,
}))
const previewHookCalls = vi.hoisted(() => [] as Array<{ ticketPublicId: string; enabled: boolean }>)

vi.mock('@/hooks/useTicketEmails', () => ({
  useSendTicketReply: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useTicketReplyPreview: (ticketPublicId: string, _payload: unknown, enabled = true) => (
    previewHookCalls.push({ ticketPublicId, enabled }),
    {
      data: mockReplyPreviewState.data,
      isLoading: mockReplyPreviewState.isLoading,
      isError: mockReplyPreviewState.isError,
    }
  ),
}))

vi.mock('@/hooks/useIntegrations', () => ({
  useCreateScheduledEmail: () => ({
    mutate: mockScheduleMutate,
    isPending: false,
  }),
}))

vi.mock('@/hooks/useMailboxes', () => ({
  useMailboxes: () => ({
    data: {
      items: [
        { id: '1', name: 'Main', address: 'support@caseflow.com' },
      ],
    },
  }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: mockSuccess, error: mockError, info: mockInfo }),
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
}))

const { EmailReplyComposer } = await import('@/components/ticket-detail/EmailReplyComposer')

function buildInboundReplyContext() {
  return {
    id: 'e1',
    emailDocumentId: 'email-1',
    ticketId: 't1',
    threadKey: null,
    messageId: '<m1>',
    providerMessageId: null,
    mailboxId: '1',
    mailboxName: 'Main',
    sourceEventId: 'evt-1',
    resolvedReplyTarget: 'customer@example.com',
    replyContext: {
      sourceEventId: 'evt-1',
      sourceEmailDocumentId: 'email-1',
      resolvedReplyTarget: 'customer@example.com',
    },
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
    mockInfo.mockReset()
    mockTemplatesError.value = false
    mockScheduleMutate.mockReset()
    mockReplyPreviewState.data = {
      subject: 'Preview Subject',
      bodyHtml: '<p>Preview HTML</p>',
      bodyText: 'Preview text',
      derivedToAddress: 'customer@example.com',
      derivedFromAddress: 'support@caseflow.com',
      warnings: [],
      placeholderDiagnostics: [],
      mailboxName: 'Main',
      mailboxAddress: 'support@caseflow.com',
      isEditable: true,
    }
    mockReplyPreviewState.isLoading = false
    mockReplyPreviewState.isError = false
    previewHookCalls.length = 0
  })

  it('hides unsupported fields, removes manual To entry, and submits a source-event reply payload', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
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
        mailboxId: '1',
        sourceEventId: 'evt-1',
        subject: 'Preview Subject',
        textBody: 'Reply body',
        inReplyToMessageId: '<m1>',
        contentWasEdited: true,
        templateId: null,
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
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
      />,
    )

    expect(screen.getByText('No inbound email context is available. This screen only supports real threaded replies, so direct outreach is not enabled here.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })

  it('schedules an email using the ticket public id workflow extension', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Scheduled body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }))
    fireEvent.change(screen.getByLabelText('Send Not Before'), { target: { value: '2026-04-10T09:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Schedule' }))

    expect(mockScheduleMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mailboxId: 1,
        toAddress: 'customer@example.com',
        subject: 'Preview Subject',
        textBody: 'Scheduled body',
        sourceEventId: 'evt-1',
        templateId: null,
        contentWasEdited: true,
      }),
      expect.any(Object),
    )
  })

  it('disables scheduling safely when the ticket is closed', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
        isTicketClosed
      />,
    )

    expect(screen.getByText('Scheduled send is disabled because the ticket is closed.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeDisabled()
  })

  it('shows queued feedback for accepted replies', () => {
    const onClose = vi.fn()

    render(
      <EmailReplyComposer
        isOpen
        onClose={onClose}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Queued body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const queuedOptions = mockMutate.mock.calls[0][1]
    act(() => {
      queuedOptions.onSuccess({ requestId: 'r1', ticketId: 't1', outboundEmailId: null, mailboxId: '1', status: 'QUEUED', acceptedAt: null, message: null })
    })

    expect(screen.getByText('Reply queued for delivery.')).toBeInTheDocument()
    expect(mockInfo).toHaveBeenCalledWith('Reply queued for delivery.')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows sent feedback when delivery is already confirmed', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Sent body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const sentOptions = mockMutate.mock.calls[0][1]
    act(() => {
      sentOptions.onSuccess({ requestId: 'r2', ticketId: 't1', outboundEmailId: 'o1', mailboxId: '1', status: 'SENT', acceptedAt: null, message: null })
    })

    expect(mockSuccess).toHaveBeenCalledWith('Reply sent.')
  })

  it('shows dispatched feedback without overstating final delivery', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Dispatched body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const dispatchedOptions = mockMutate.mock.calls[0][1]
    act(() => {
      dispatchedOptions.onSuccess({ requestId: 'r2', ticketId: 't1', outboundEmailId: 'o1', mailboxId: '1', status: 'DISPATCHED', acceptedAt: null, message: null })
    })

    expect(mockInfo).toHaveBeenCalledWith('Reply dispatched to outbound delivery.')
  })

  it('shows failed feedback without pretending the reply was sent', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Failure body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const failedOptions = mockMutate.mock.calls[0][1]
    act(() => {
      failedOptions.onSuccess({ requestId: 'r3', ticketId: 't1', outboundEmailId: null, mailboxId: '1', status: 'FAILED', acceptedAt: null, message: 'Mailbox unavailable' })
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
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'tpl-1' } })

    expect(screen.getByDisplayValue('Preview Subject')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Preview text')).toBeInTheDocument()
    expect(screen.getByText('Using backend reply preview for subject, body, and recipient resolution.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /preview/i }))

    expect(screen.getByText('Preview Subject')).toBeInTheDocument()
    expect(screen.getAllByText('Preview text').length).toBeGreaterThan(0)
  })

  it('shows an honest template availability error when backend template list is unavailable', () => {
    mockTemplatesError.value = true

    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    expect(screen.getByText('Template list is unavailable for this session.')).toBeInTheDocument()
  })

  it('falls back to saved template content when preview is unavailable', () => {
    mockReplyPreviewState.data = undefined
    mockReplyPreviewState.isError = true

    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'tpl-1' } })

    expect(screen.getByDisplayValue('Template Subject')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Template body')).toBeInTheDocument()
    expect(screen.getByText('Template preview is unavailable. Using saved template content.')).toBeInTheDocument()
  })

  it('uses ticketPublicId for preview calls', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="53"
        ticketPublicId="550e8400-e29b-41d4-a716-446655440000"
        ticketSubject="Need help"
        lastInbound={buildInboundReplyContext()}
      />,
    )

    expect(previewHookCalls).toContainEqual({
      ticketPublicId: '550e8400-e29b-41d4-a716-446655440000',
      enabled: true,
    })
  })
})