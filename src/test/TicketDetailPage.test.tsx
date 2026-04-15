import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const invalidateQueries = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const assignmentServiceAssign = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const assignmentServiceReassign = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())

const ticketSidePanelProps = vi.hoisted(() => ({
  last: null as Record<string, unknown> | null,
}))

const emailDetailState = vi.hoisted(() => ({
  byId: {} as Record<string, Record<string, unknown> | null>,
  isLoading: false,
  calls: [] as string[],
  ticketPublicIds: [] as string[],
}))

const ticketEmailThreadState = vi.hoisted(() => ({
  data: [] as Array<Record<string, unknown>>,
  isLoading: false,
}))

const ticketState = vi.hoisted(() => ({
  isUnread: true,
  assignedUserId: null as string | null,
  assignedUserName: null as string | null,
  attachments: [] as Array<Record<string, unknown>>,
}))

const permissionState = vi.hoisted(() => ({
  canViewTicketEmail: false,
  canAssignTickets: false,
}))

const attachmentViewerProps = vi.hoisted(() => ({
  last: null as Record<string, unknown> | null,
}))

const emailDetailDrawerProps = vi.hoisted(() => ({
  last: null as Record<string, unknown> | null,
}))

const workAreaProps = vi.hoisted(() => ({
  last: null as Record<string, unknown> | null,
}))

const emailReplyComposerProps = vi.hoisted(() => ({
  last: null as Record<string, unknown> | null,
}))

const assignmentModalProps = vi.hoisted(() => ({
  last: null as Record<string, unknown> | null,
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries }),
  }
})

vi.mock('@/services/assignment.service', () => ({
  assignmentService: {
    assign: assignmentServiceAssign,
    reassign: assignmentServiceReassign,
  },
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}))

vi.mock('@/hooks/useTicketDetail', () => ({
  useTicketDetail: () => ({
    ticket: {
      id: 't1',
      publicId: '550e8400-e29b-41d4-a716-446655440000',
      ticketNo: 'TK-1',
      subject: 'Unread ticket subject',
      customerId: 'c1',
      customerName: 'Acme',
      groupId: 'g1',
      groupName: 'Support',
      assignedUserId: ticketState.assignedUserId,
      assignedUserName: ticketState.assignedUserName,
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
      attachments: ticketState.attachments,
    },
    messages: [],
    transfers: [],
    allowedStatusTransitions: [],
    isLoading: false,
    addNote: vi.fn(),
    changeStatus: vi.fn(),
    changePriority: vi.fn(),
    close: vi.fn(),
    reopen: vi.fn(),
    isAddingNote: false,
    isTransferring: false,
    isClosing: false,
  }),
}))

vi.mock('@/hooks/useTicketEmails', () => ({
  useTicketEmailThread: () => ({ data: ticketEmailThreadState.data, isLoading: ticketEmailThreadState.isLoading }),
  useTicketEmailDetailByDirection: (ticketPublicId: string, detailId: string) => {
    if (ticketPublicId && !emailDetailState.ticketPublicIds.includes(ticketPublicId)) {
      emailDetailState.ticketPublicIds.push(ticketPublicId)
    }

    if (detailId && !emailDetailState.calls.includes(detailId)) {
      emailDetailState.calls.push(detailId)
    }

    return {
      data: detailId ? (emailDetailState.byId[detailId] ?? null) : null,
      isLoading: detailId ? emailDetailState.isLoading : false,
    }
  },
}))

vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({ users: [], groups: [] }),
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canAssignTickets: permissionState.canAssignTickets,
    canTransferTickets: false,
    canSendTicketEmailReply: false,
    canViewTicketEmail: permissionState.canViewTicketEmail,
    canCloseTickets: false,
  }),
}))

vi.mock('@/components/ticket-detail/TicketDetailLayout', () => ({
  TicketDetailLayout: ({ left, right }: { left: ReactNode; right: ReactNode }) => (
    <div>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  ),
}))

vi.mock('@/components/ticket-detail/TicketWorkArea', () => ({
  TicketWorkArea: (props: Record<string, unknown>) => {
    workAreaProps.last = props
    return <div>Work Area</div>
  },
}))

vi.mock('@/components/ticket-detail/EmailThread', () => ({
  EmailThread: ({ emails, onSelectEmail }: { emails: Array<Record<string, unknown>>; onSelectEmail?: (email: Record<string, unknown>) => void }) => (
    <div>
      {emails.map((email, index) => (
        <button key={String(email.id)} type="button" onClick={() => onSelectEmail?.(email)}>
          {`Select Email ${index + 1}`}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('@/components/ticket-detail/EmailDetailDrawer', () => ({
  EmailDetailDrawer: (props: Record<string, unknown>) => {
    emailDetailDrawerProps.last = props
    return null
  },
}))

vi.mock('@/components/ticket-detail/TicketSidePanel', () => ({
  TicketSidePanel: (props: Record<string, unknown>) => {
    ticketSidePanelProps.last = props
    return <div>Side Panel</div>
  },
}))

vi.mock('@/components/ticket-detail/EmailReplyComposer', () => ({
  EmailReplyComposer: (props: Record<string, unknown>) => {
    emailReplyComposerProps.last = props
    return null
  },
}))

vi.mock('@/components/ticket-detail/TicketTagsCard', () => ({
  TicketTagsCard: () => <div>Ticket Tags Card</div>,
}))

vi.mock('@/components/modals/AssignmentModal', () => ({
  AssignmentModal: (props: Record<string, unknown>) => {
    assignmentModalProps.last = props
    return null
  },
}))

vi.mock('@/components/modals/TransferModal', () => ({
  TransferModal: () => null,
}))

vi.mock('@/components/modals/CloseConfirmModal', () => ({
  CloseConfirmModal: () => null,
}))

vi.mock('@/components/ticket-detail/AttachmentViewerModal', () => ({
  AttachmentViewerModal: (props: Record<string, unknown>) => {
    attachmentViewerProps.last = props
    return null
  },
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

function makeThreadEmail(overrides: Record<string, unknown> = {}) {
  const detailId = overrides.detailId ?? overrides.emailDocumentId ?? overrides.id ?? 'email-74'
  const detailType = overrides.detailType ?? 'INBOUND'

  return {
    id: 'evt-74',
    emailDocumentId: 'email-74',
    detailType,
    detailId,
    ticketId: 't1',
    threadKey: null,
    messageId: '<m1>',
    providerMessageId: null,
    mailboxId: null,
    mailboxName: null,
    sourceEventId: 74,
    direction: 'INBOUND',
    subject: 'Need help',
    from: 'customer@test.com',
    to: ['support@test.com'],
    cc: [],
    bcc: [],
    bodyText: null,
    bodyHtml: null,
    sanitizedHtmlBody: null,
    rawHtmlBody: null,
    bodyPreview: 'Need help',
    sentAt: null,
    receivedAt: '2026-04-01T00:00:00Z',
    processingStatus: null,
    dispatchStatus: null,
    attachmentCount: 1,
    attachments: [],
    ...overrides,
  } as Record<string, unknown>
}

function makeEmailDetail(emailId: string, fileName?: string) {
  return {
    id: emailId,
    emailDocumentId: emailId,
    detailType: 'INBOUND',
    detailId: emailId,
    ticketId: 't1',
    threadKey: null,
    messageId: `<${emailId}@mail.test>`,
    providerMessageId: null,
    mailboxId: null,
    mailboxName: null,
    sourceEventId: Number(String(emailId).replace(/\D+/g, '')) || 74,
    direction: 'INBOUND',
    subject: 'Need help',
    from: 'customer@test.com',
    to: ['support@test.com'],
    cc: [],
    bcc: [],
    bodyText: 'Attachment included',
    bodyHtml: null,
    sanitizedHtmlBody: null,
    rawHtmlBody: null,
    bodyPreview: 'Attachment included',
    sentAt: null,
    receivedAt: '2026-04-01T00:00:00Z',
    processingStatus: null,
    dispatchStatus: null,
    attachmentCount: fileName ? 1 : 0,
    attachments: fileName
      ? [
          {
            id: `att-${emailId}`,
            fileName,
            contentType: 'application/pdf',
            size: 2048,
            sizeBytes: 2048,
            downloadUrl: `/api/tickets/t1/emails/${emailId}/attachments/att-${emailId}/content`,
          },
        ]
      : [],
  }
}

describe('TicketDetailPage', () => {
  beforeEach(() => {
    ticketSidePanelProps.last = null
    attachmentViewerProps.last = null
    emailDetailDrawerProps.last = null
    workAreaProps.last = null
    emailReplyComposerProps.last = null
    assignmentModalProps.last = null
    invalidateQueries.mockClear()
    assignmentServiceAssign.mockClear()
    assignmentServiceReassign.mockClear()
    toastSuccess.mockClear()
    toastError.mockClear()
    emailDetailState.byId = {}
    emailDetailState.isLoading = false
    emailDetailState.calls = []
    emailDetailState.ticketPublicIds = []
    ticketEmailThreadState.data = []
    ticketEmailThreadState.isLoading = false
    ticketState.isUnread = true
    ticketState.attachments = []
    permissionState.canViewTicketEmail = false
    permissionState.canAssignTickets = false
  })

  it('only requests the real email document id and never the legacy numeric id', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = [makeThreadEmail({ id: '74', emailDocumentId: '69d239-real-email-id' })]
    emailDetailState.byId = {
      '69d239-real-email-id': makeEmailDetail('69d239-real-email-id'),
    }

    renderPage()

    expect(emailDetailState.calls).toContain('69d239-real-email-id')
    expect(emailDetailState.calls).not.toContain('74')
    expect(emailDetailState.ticketPublicIds).toContain('550e8400-e29b-41d4-a716-446655440000')
    expect(workAreaProps.last).toMatchObject({
      attachmentEmptyMessage: 'No attachments on this email.',
    })
  })

  it('makes exactly one email detail request for the selected email document id', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = [makeThreadEmail({ id: '74', emailDocumentId: '69d239-real-email-id' })]
    emailDetailState.byId = {
      '69d239-real-email-id': makeEmailDetail('69d239-real-email-id', 'resume.pdf'),
    }

    renderPage()

    expect(emailDetailState.calls).toEqual(['69d239-real-email-id'])
  })

  it('auto-selects the first thread email that has a real emailDocumentId for the side panel', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = [
      makeThreadEmail({ id: '79', emailDocumentId: null, detailId: null }),
      makeThreadEmail({ id: '74', emailDocumentId: '69d24d0179e5e872075434c8' }),
    ]
    emailDetailState.byId = {
      '69d24d0179e5e872075434c8': makeEmailDetail('69d24d0179e5e872075434c8', 'resume.pdf'),
    }

    renderPage()

    expect(emailDetailState.calls).toContain('69d24d0179e5e872075434c8')
    expect(emailDetailState.calls).not.toContain('79')
    expect(workAreaProps.last).toMatchObject({
      attachments: [expect.objectContaining({ fileName: 'resume.pdf' })],
    })
  })

  it('attachments panel renders attachments from selected email detail', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = [
      makeThreadEmail({
        id: '74',
        emailDocumentId: '69d239-real-email-id',
      }),
    ]
    emailDetailState.byId = {
      '69d239-real-email-id': makeEmailDetail('69d239-real-email-id', 'resume.pdf'),
    }

    renderPage()

    expect(workAreaProps.last).toMatchObject({
      attachments: [expect.objectContaining({ fileName: 'resume.pdf' })],
      attachmentEmptyMessage: 'No attachments on this email.',
    })
    expect(attachmentViewerProps.last).toMatchObject({
      title: 'Email Attachments',
      attachments: [expect.objectContaining({ fileName: 'resume.pdf' })],
    })
  })

  it('loading state appears while email detail is loading', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = [makeThreadEmail({ id: '74', emailDocumentId: '69d239-real-email-id' })]
    emailDetailState.isLoading = true
    emailDetailState.byId = {
      '69d239-real-email-id': null,
    }

    renderPage()

    expect(workAreaProps.last).toMatchObject({
      attachments: [],
      isAttachmentLoading: true,
    })
  })

  it('changing selected email updates the attachments panel', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = [
      makeThreadEmail({ id: '74', emailDocumentId: 'email-74', subject: 'First' }),
      makeThreadEmail({ id: '75', emailDocumentId: 'email-75', subject: 'Second' }),
    ]
    emailDetailState.byId = {
      'email-74': makeEmailDetail('email-74', 'first.pdf'),
      'email-75': makeEmailDetail('email-75', 'second.pdf'),
    }

    renderPage()

    expect(workAreaProps.last).toMatchObject({
      attachments: [expect.objectContaining({ fileName: 'first.pdf' })],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Select Email 2' }))

    expect(workAreaProps.last).toMatchObject({
      attachments: [expect.objectContaining({ fileName: 'second.pdf' })],
    })
  })

  it('empty state only appears when selected email has zero attachments', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = [
      makeThreadEmail({ id: '74', emailDocumentId: '69d239-real-email-id', attachmentCount: 1 }),
    ]
    emailDetailState.byId = {
      '69d239-real-email-id': makeEmailDetail('69d239-real-email-id'),
    }

    renderPage()

    expect(workAreaProps.last).toMatchObject({
      attachments: [],
      attachmentEmptyMessage: 'No attachments on this email.',
    })
  })

  it('select-email state only appears when there is genuinely no selected email', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = []

    renderPage()

    expect(workAreaProps.last).toMatchObject({
      attachments: [],
      attachmentEmptyMessage: 'Select an email to inspect attachments.',
    })
  })

  it('detail drawer uses the same selected email detail source', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = [makeThreadEmail({ id: '74', emailDocumentId: '69d239-real-email-id' })]
    emailDetailState.byId = {
      '69d239-real-email-id': makeEmailDetail('69d239-real-email-id', 'resume.pdf'),
    }

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Select Email 1' }))

    expect(emailDetailDrawerProps.last).toMatchObject({
      isOpen: true,
    })
    expect(emailDetailDrawerProps.last?.email).toBe(emailDetailState.byId['69d239-real-email-id'])
    expect(emailDetailState.calls).toContain('69d239-real-email-id')
    expect(emailDetailState.calls).not.toContain('74')
  })

  it('preserves selected inbound sourceEventId when detail omits it', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = [
      makeThreadEmail({
        id: '74',
        emailDocumentId: 'email-74',
        sourceEventId: 7401,
        mailboxId: '12',
        messageId: '<summary-74@mail.test>',
      }),
    ]
    emailDetailState.byId = {
      'email-74': {
        ...makeEmailDetail('email-74'),
        sourceEventId: null,
        mailboxId: null,
        messageId: '<detail-74@mail.test>',
      },
    }

    renderPage()

    expect(emailReplyComposerProps.last).toMatchObject({
      replySourceEmail: expect.objectContaining({
        sourceEventId: 7401,
        mailboxId: '12',
        messageId: '<summary-74@mail.test>',
      }),
      lastInbound: expect.objectContaining({
        sourceEventId: 7401,
      }),
    })
  })

  it('uses the queue-style assignment payload from ticket detail', async () => {
    permissionState.canAssignTickets = true

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Assign' }))

    await act(async () => {
      await (assignmentModalProps.last as { onAssign: (userId: string | null, userName: string | null, note?: string) => Promise<unknown> })
        .onAssign('u77', 'Agent Queue Style', 'ignored note')
    })

    expect(assignmentServiceAssign).toHaveBeenCalledWith({
      ticketId: 't1',
      assignedUserId: 'u77',
    })
    expect(assignmentServiceReassign).not.toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['ticket', 't1'], refetchType: 'all' })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['tickets'], refetchType: 'all' })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['queue'], refetchType: 'all' })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['queue-stats'], refetchType: 'all' })
    expect(toastSuccess).toHaveBeenCalledWith('Ticket Agent Queue Style adına atandı')
  })

  it('uses reassign directly when the ticket already has an active assignee', async () => {
    permissionState.canAssignTickets = true
    ticketState.assignedUserId = 'u11'
    ticketState.assignedUserName = 'Current Agent'

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Reassign' }))

    await act(async () => {
      await (assignmentModalProps.last as { onAssign: (userId: string | null, userName: string | null, note?: string) => Promise<unknown> })
        .onAssign('u77', 'Agent Queue Style', 'ignored note')
    })

    expect(assignmentServiceReassign).toHaveBeenCalledWith({
      ticketId: 't1',
      newUserId: 'u77',
      newGroupId: 'g1',
    })
    expect(assignmentServiceAssign).not.toHaveBeenCalled()
  })

  it('attachment URLs use downloadPath fallback when explicit urls are absent', () => {
    permissionState.canViewTicketEmail = true
    ticketEmailThreadState.data = [makeThreadEmail({ id: '74', emailDocumentId: 'email-74' })]
    emailDetailState.byId = {
      'email-74': {
        ...makeEmailDetail('email-74', 'resume.pdf'),
        attachments: [
          {
            id: 'att-email-74',
            fileName: 'resume.pdf',
            contentType: 'application/pdf',
            size: 2048,
            sizeBytes: 2048,
            downloadPath: '/api/tickets/t1/emails/email-74/attachments/att-email-74/content',
            downloadUrl: null,
            previewUrl: null,
            openUrl: null,
          },
        ],
      },
    }

    renderPage()

    expect(workAreaProps.last).toMatchObject({
      attachments: [
        expect.objectContaining({
          emailId: 'email-74',
          previewUrl: '/api/tickets/t1/emails/email-74/attachments/att-email-74/content',
          openUrl: '/api/tickets/t1/emails/email-74/attachments/att-email-74/content',
          downloadUrl: '/api/tickets/t1/emails/email-74/attachments/att-email-74/content',
        }),
      ],
    })
    expect(attachmentViewerProps.last).toMatchObject({
      attachments: [
        expect.objectContaining({
          previewUrl: '/api/tickets/t1/emails/email-74/attachments/att-email-74/content',
          openUrl: '/api/tickets/t1/emails/email-74/attachments/att-email-74/content',
          downloadUrl: '/api/tickets/t1/emails/email-74/attachments/att-email-74/content',
        }),
      ],
    })
  })
})
