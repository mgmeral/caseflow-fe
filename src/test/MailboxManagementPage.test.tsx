import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockSuccess = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())
const mockTestImapConnection = vi.hoisted(() => vi.fn())
const mockTestSmtpConnection = vi.hoisted(() => vi.fn())
const mockActivate = vi.hoisted(() => vi.fn())
const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canManageEmailConfig: true }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}))

vi.mock('@/hooks/useMailboxes', () => ({
  useMailboxes: () => ({
    data: {
      items: [
        {
          id: 'm1',
          name: 'Main',
          address: 'support@caseflow.com',
          displayName: 'Support',
          providerType: 'IMAP',
          inboundMode: 'POLLING',
          outboundMode: 'SMTP',
          imapHost: 'imap.caseflow.com',
          imapPort: 993,
          imapUsername: 'support@caseflow.com',
          imapUseSsl: true,
          imapFolder: 'INBOX',
          smtpHost: null,
          smtpPort: null,
          smtpUsername: null,
          smtpUseSsl: null,
          pollingEnabled: true,
          pollIntervalSeconds: 60,
          initialSyncStrategy: 'START_FROM_LATEST',
          cursorInitStrategy: null,
          lastSeenUid: null,
          activationState: null,
          pollingStatus: 'IDLE',
          isActive: true,
          defaultGroupId: null,
          defaultPriority: null,
          lastPollAt: null,
          lastPollError: 'Authentication failed',
          lastSuccessfulInboundAt: null,
          lastSuccessfulOutboundAt: null,
          createdAt: null,
          updatedAt: null,
        },
        {
          id: 'm2',
          name: 'Archive',
          address: 'archive@caseflow.com',
          displayName: 'Archive',
          providerType: 'IMAP',
          inboundMode: 'POLLING',
          outboundMode: 'SMTP',
          imapHost: 'imap.caseflow.com',
          imapPort: 993,
          imapUsername: 'archive@caseflow.com',
          imapUseSsl: true,
          imapFolder: 'INBOX',
          smtpHost: 'smtp.caseflow.com',
          smtpPort: 587,
          smtpUsername: 'archive@caseflow.com',
          smtpUseSsl: true,
          pollingEnabled: true,
          pollIntervalSeconds: 60,
          initialSyncStrategy: 'SCAN_FROM_START',
          cursorInitStrategy: 'SCAN_FROM_START',
          lastSeenUid: '44',
          activationState: 'INACTIVE',
          pollingStatus: 'IDLE',
          isActive: false,
          defaultGroupId: null,
          defaultPriority: null,
          lastPollAt: null,
          lastPollError: null,
          lastSuccessfulInboundAt: null,
          lastSuccessfulOutboundAt: null,
          createdAt: null,
          updatedAt: null,
        },
      ],
      totalPages: 1,
      page: 0,
      size: 20,
      total: 2,
    },
    isLoading: false,
  }),
}))

vi.mock('@/services/mailbox.service', () => ({
  mailboxService: {
    testImapConnection: mockTestImapConnection,
    testSmtpConnection: mockTestSmtpConnection,
    create: mockCreate,
    update: vi.fn(),
    activate: mockActivate,
    deactivate: vi.fn(),
  },
}))

const { MailboxManagementPage } = await import('@/pages/admin/MailboxManagementPage')

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MailboxManagementPage />
    </QueryClientProvider>,
  )
}

describe('MailboxManagementPage', () => {
  beforeEach(() => {
    mockSuccess.mockReset()
    mockError.mockReset()
    mockTestImapConnection.mockReset()
    mockTestSmtpConnection.mockReset()
    mockActivate.mockReset()
    mockCreate.mockReset()
  })

  it('defaults the mailbox form to New messages only', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'New Mailbox' }))

    expect(screen.getByDisplayValue('New messages only')).toBeInTheDocument()
  })

  it('shows a strong warning when scan from start is selected', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'New Mailbox' }))
    fireEvent.change(screen.getByDisplayValue('New messages only'), { target: { value: 'SCAN_FROM_START' } })

    expect(screen.getByText('Scan from start can process old inbox history.')).toBeInTheDocument()
  })

  it('keeps SMTP fields hidden until mailbox-specific SMTP is enabled', () => {
    renderPage()

    fireEvent.click(screen.getAllByTitle('Edit')[0])

    expect(screen.getByText('SMTP fields stay hidden unless this mailbox uses mailbox-specific outbound delivery.')).toBeInTheDocument()
    expect(screen.queryByText('SMTP Host *')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Use mailbox-specific SMTP'))

    expect(screen.getByText('SMTP Host *')).toBeInTheDocument()
    expect(screen.getByText('SMTP Username *')).toBeInTheDocument()
  })

  it('runs IMAP and SMTP connection tests separately and renders them distinctly from poll errors', async () => {
    mockTestImapConnection.mockResolvedValueOnce({
      success: true,
      message: 'IMAP connected',
      testedAt: '2026-03-29T00:00:00Z',
    })
    mockTestSmtpConnection.mockResolvedValueOnce({
      success: false,
      message: 'SMTP auth failed',
      testedAt: '2026-03-29T00:05:00Z',
    })

    renderPage()

    expect(screen.getAllByText('Last poll error:').length).toBeGreaterThan(0)
    expect(screen.getAllByText('IMAP test:').length).toBeGreaterThan(0)
    expect(screen.getAllByText('SMTP test:').length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByTitle('Edit')[1])
    fireEvent.click(screen.getByRole('button', { name: 'Test IMAP Connection' }))
    fireEvent.click(screen.getByRole('button', { name: 'Test SMTP Connection' }))

    await waitFor(() => {
      expect(mockTestImapConnection).toHaveBeenCalledWith('m2')
      expect(mockTestSmtpConnection).toHaveBeenCalledWith('m2')
      expect(mockSuccess).toHaveBeenCalledWith('IMAP connection test succeeded')
      expect(mockError).toHaveBeenCalledWith('SMTP connection test failed')
      expect(screen.getByText('IMAP connection test succeeded')).toBeInTheDocument()
      expect(screen.getByText('SMTP connection test failed')).toBeInTheDocument()
      expect(screen.getAllByText('IMAP connected').length).toBeGreaterThan(0)
      expect(screen.getAllByText('SMTP auth failed').length).toBeGreaterThan(0)
    })
  })

  it('requires confirmation before activating a mailbox with a historical sync strategy', async () => {
    mockActivate.mockResolvedValueOnce({ id: 'm2' })

    renderPage()

    fireEvent.click(screen.getByTitle('Activate'))

    expect(screen.getByText('Historical inbox processing can ingest unrelated personal or marketing emails if mailbox rules are broad or missing.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Activate Mailbox' }))

    await waitFor(() => {
      expect(mockActivate).toHaveBeenCalledWith('m2')
    })
  })

  it('requires confirmation before creating a mailbox with polling enabled and a historical scan strategy', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'New Mailbox' }))

    const dialog = screen.getByRole('dialog', { name: 'New Mailbox' })
    const textboxes = within(dialog).getAllByRole('textbox')

    fireEvent.change(textboxes[0], { target: { value: 'Risky mailbox' } })
    fireEvent.change(textboxes[1], { target: { value: 'risk@example.com' } })
    fireEvent.change(textboxes[3], { target: { value: 'imap.caseflow.com' } })
    fireEvent.change(textboxes[4], { target: { value: 'risk@example.com' } })
    fireEvent.change(within(dialog).getByPlaceholderText('IMAP password'), { target: { value: 'secret' } })
    fireEvent.change(within(dialog).getByDisplayValue('New messages only'), { target: { value: 'SCAN_LAST_3_DAYS' } })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

    expect(screen.getByText('Saving this mailbox with polling enabled can allow historical inbox scanning as soon as the mailbox is activated and polling runs.')).toBeInTheDocument()
  })
})