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
        id: '1',
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
    sourceEventId: 101,
    resolvedReplyTarget: 'customer@example.com',
    replyContext: {
      sourceEventId: 101,
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
    expect(screen.queryByText(/^Cc$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Bcc$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Attachments$/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('combobox')).toHaveLength(1)

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Reply body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(mockMutate).toHaveBeenCalledWith(
      {
        mailboxId: 1,
        sourceEventId: 101,
        subject: 'Preview Subject',
        textBody: 'Reply body',
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

  it('shows a specific warning when inbound email exists but numeric source event id is missing', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={{
          ...buildInboundReplyContext(),
          sourceEventId: null,
          replyContext: {
            sourceEventId: null,
            sourceEmailDocumentId: '69d8325094ebbe5f95845795',
            resolvedReplyTarget: 'customer@example.com',
          },
        }}
      />,
    )

    expect(screen.getByText('This message cannot be replied to because its inbound event reference is missing.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })

  it('does not show the missing inbound event warning when merged selected context keeps sourceEventId', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        replySourceEmail={{
          ...buildInboundReplyContext(),
          sourceEventId: 202,
          replyContext: {
            sourceEventId: null,
            sourceEmailDocumentId: 'email-selected',
            resolvedReplyTarget: 'customer@example.com',
          },
        }}
        lastInbound={{
          ...buildInboundReplyContext(),
          sourceEventId: 101,
        }}
      />,
    )

    expect(screen.queryByText('This message cannot be replied to because its inbound event reference is missing.')).not.toBeInTheDocument()
    expect(screen.queryByText('Reply target is derived from the selected inbound email context. Manual To entry is disabled in real reply mode.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled()
  })

  it('uses the selected merged source context for send and schedule eligibility', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        replySourceEmail={{
          ...buildInboundReplyContext(),
          sourceEventId: 303,
          mailboxId: '1',
          subject: 'Selected inbound subject',
          replyContext: {
            sourceEventId: null,
            sourceEmailDocumentId: 'email-selected',
            resolvedReplyTarget: 'customer@example.com',
          },
        }}
        lastInbound={{
          ...buildInboundReplyContext(),
          sourceEventId: 101,
          subject: 'Last inbound subject',
        }}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Reply body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mailboxId: 1,
        sourceEventId: 303,
        subject: 'Preview Subject',
        textBody: 'Reply body',
      }),
      expect.any(Object),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }))
    fireEvent.change(screen.getByLabelText('Send Not Before'), { target: { value: '2099-04-10T09:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Schedule' }))

    expect(mockScheduleMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mailboxId: 1,
        sourceEventId: 303,
      }),
      expect.any(Object),
    )
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
    fireEvent.change(screen.getByLabelText('Send Not Before'), { target: { value: '2099-04-10T09:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Schedule' }))

    expect(mockScheduleMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mailboxId: 1,
        toAddress: 'customer@example.com',
        subject: 'Preview Subject',
        textBody: 'Scheduled body',
        sourceEventId: 101,
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

  it('translates malformed backend reply errors into actionable guidance', () => {
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

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Reply body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const failedOptions = mockMutate.mock.calls[0][1]
    act(() => {
      failedOptions.onError(new Error('Request body is missing or malformed'))
    })

    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('The backend rejected this reply request.'))
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('mailbox selected (Main (support@caseflow.com))'))
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('reply source valid'))
  })

  it('allows send attempts even when the preview request failed', () => {
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

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Reply body despite preview failure' } })

    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
      mailboxId: 1,
      sourceEventId: 101,
      textBody: 'Reply body despite preview failure',
    }), expect.any(Object))
  })

  it('shows the schedule disabled reason when mailbox is missing', () => {
    render(
      <EmailReplyComposer
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketPublicId="ticket-public-1"
        ticketSubject="Need help"
        lastInbound={{
          ...buildInboundReplyContext(),
          mailboxId: null,
        }}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Body' } })

    expect(screen.getByRole('button', { name: 'Schedule' })).toBeDisabled()
    expect(screen.getByText('Schedule unavailable: Select a mailbox.')).toBeInTheDocument()
  })

  it('does not block schedule opening when recipient preview is unresolved but source event is valid', () => {
    mockReplyPreviewState.data = {
      ...mockReplyPreviewState.data!,
      derivedToAddress: '',
    }

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

    expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled()
    expect(screen.getByText('Recipient preview is unavailable right now. The backend will resolve the reply target from the source email when you schedule it.')).toBeInTheDocument()
  })

  it('shows the missing schedule time reason inside the modal before confirmation', () => {
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

    expect(screen.getByRole('button', { name: 'Confirm Schedule' })).toBeDisabled()
    expect(screen.getByText('Schedule is blocked until: Choose a schedule time.')).toBeInTheDocument()
  })

  it('schedules even when recipient preview is unresolved by deferring resolution to the backend', () => {
    mockReplyPreviewState.data = {
      ...mockReplyPreviewState.data!,
      derivedToAddress: '',
    }

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
    fireEvent.change(screen.getByLabelText('Send Not Before'), { target: { value: '2099-04-10T09:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Schedule' }))

    expect(mockScheduleMutate).toHaveBeenCalledWith(expect.objectContaining({
      mailboxId: 1,
      toAddress: null,
      sourceEventId: 101,
    }), expect.any(Object))
  })

  it('maps backend reply error codes into user-friendly guidance', () => {
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

    fireEvent.change(screen.getByPlaceholderText('Type your reply…'), { target: { value: 'Reply body' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    const failedOptions = mockMutate.mock.calls[0][1]
    act(() => {
      failedOptions.onError({ code: 'SOURCE_EVENT_NOT_FOUND', message: 'source event lookup failed' })
    })

    expect(mockError).toHaveBeenCalledWith('The source email for this reply could not be found. Refresh the thread and try again.')
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

    // Quick macro pill click is the primary selection surface
    fireEvent.click(screen.getByRole('button', { name: 'Acknowledgement' }))

    expect(screen.getByDisplayValue('Preview Subject')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Preview text')).toBeInTheDocument()

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

    fireEvent.click(screen.getByRole('button', { name: 'Acknowledgement' }))

    expect(screen.getByDisplayValue('Template Subject')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Template body')).toBeInTheDocument()
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

  it('renders template as quick macro pill alongside write from scratch option', () => {
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

    // Write from scratch is the highlighted default
    expect(screen.getByRole('button', { name: 'Write from scratch' })).toBeInTheDocument()
    // Template pill appears as quick macro
    expect(screen.getByRole('button', { name: 'Acknowledgement' })).toBeInTheDocument()
    // No usageType group header rows in the quick picks area
    expect(screen.queryByText('General')).not.toBeInTheDocument()
  })

  it('shows applied template context card after selecting a quick-pick pill', async () => {
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

    const pill = screen.getByRole('button', { name: 'Acknowledgement' })
    await act(async () => { fireEvent.click(pill) })

    // Compact card shows template name and code; Write from scratch and pill are gone
    expect(screen.getByText('ACK')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Write from scratch' })).not.toBeInTheDocument()
  })

  it('single selection model: only mailbox combobox exists, no template dropdown', () => {
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

    expect(screen.getAllByRole('combobox')).toHaveLength(1)
    expect(screen.queryByRole('option', { name: /blank compose/i })).not.toBeInTheDocument()
  })

  it('advanced template search panel toggles open and filters results', () => {
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

    fireEvent.click(screen.getByText('Search templates\u2026'))
    expect(screen.getByPlaceholderText('Search by name or code\u2026')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search by name or code\u2026'), { target: { value: 'Ack' } })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Acknowledgement' })).toBeInTheDocument()
  })

  it('selecting a template via search populates content and dismisses the search panel', () => {
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

    fireEvent.click(screen.getByText('Search templates\u2026'))
    fireEvent.change(screen.getByPlaceholderText('Search by name or code\u2026'), { target: { value: 'Ack' } })
    fireEvent.click(screen.getByRole('option', { name: 'Acknowledgement' }))

    // Search panel dismissed, compact card replaces quick macro row
    expect(screen.queryByPlaceholderText('Search by name or code\u2026')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Write from scratch' })).not.toBeInTheDocument()
    expect(screen.getByText('Acknowledgement')).toBeInTheDocument()
  })

  it('write from scratch closes the search panel without clearing a composed body', () => {
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

    // Type a body first
    fireEvent.change(screen.getByPlaceholderText('Type your reply\u2026'), { target: { value: 'My reply content' } })

    // Open search panel then dismiss it via Write from scratch
    fireEvent.click(screen.getByText('Search templates\u2026'))
    expect(screen.getByPlaceholderText('Search by name or code\u2026')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Write from scratch' }))
    expect(screen.queryByPlaceholderText('Search by name or code\u2026')).not.toBeInTheDocument()

    // Composed body is intact
    expect(screen.getByDisplayValue('My reply content')).toBeInTheDocument()
  })

  it('clearing a selected template via compact card restores the quick macro row', async () => {
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

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Acknowledgement' })) })
    // Compact card visible
    expect(screen.getByRole('button', { name: 'Clear template' })).toBeInTheDocument()

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Clear template' })) })
    // Quick macro row restored
    expect(screen.getByRole('button', { name: 'Write from scratch' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Acknowledgement' })).toBeInTheDocument()
  })

  it('send and schedule eligibility logic is not regressed by template UI refactor', () => {
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

    // Reply CTAs are present in the footer
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument()

    // Typing body and sending works
    fireEvent.change(screen.getByPlaceholderText('Type your reply\u2026'), { target: { value: 'Some content' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ textBody: 'Some content', sourceEventId: 101 }),
      expect.any(Object),
    )
  })
})