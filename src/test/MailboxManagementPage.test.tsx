import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockSuccess = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())
const mockTestImapConnection = vi.hoisted(() => vi.fn())
const mockTestSmtpConnection = vi.hoisted(() => vi.fn())
const mockActivate = vi.hoisted(() => vi.fn())
const mockCreate = vi.hoisted(() => vi.fn())
const mockUpdate = vi.hoisted(() => vi.fn())

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
          mailProvider: 'GMAIL',
          authType: 'PASSWORD',
          providerType: 'IMAP',
          inboundMode: 'POLLING',
          outboundMode: 'SMTP',
          oauthTenantId: null,
          oauthClientId: null,
          oauthConfigured: null,
          imapHost: 'imap.gmail.com',
          imapPort: 993,
          imapUsername: 'support@caseflow.com',
          imapUseSsl: true,
          imapFolder: 'INBOX',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUsername: 'support@caseflow.com',
          smtpStarttls: true,
          smtpUseSsl: true,
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
          mailProvider: 'OUTLOOK',
          authType: 'OAUTH2',
          providerType: 'IMAP',
          inboundMode: 'POLLING',
          outboundMode: 'SMTP',
          oauthTenantId: 'tenant-1',
          oauthClientId: 'client-1',
          oauthConfigured: true,
          imapHost: 'outlook.office365.com',
          imapPort: 993,
          imapUsername: 'archive@caseflow.com',
          imapUseSsl: true,
          imapFolder: 'INBOX',
          smtpHost: 'smtp-mail.outlook.com',
          smtpPort: 587,
          smtpUsername: 'archive@caseflow.com',
          smtpStarttls: true,
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
    update: mockUpdate,
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
    mockUpdate.mockReset()
  })

  it('renders provider and auth badges in the mailbox list', () => {
    renderPage()

    expect(screen.getByText('Gmail')).toBeInTheDocument()
    expect(screen.getByText('Outlook / Microsoft 365')).toBeInTheDocument()
    expect(screen.getAllByText('Password').length).toBeGreaterThan(0)
    expect(screen.getByText('OAuth ready')).toBeInTheDocument()
  })

  it('defaults the mailbox form to Other IMAP with password auth', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'New Mailbox' }))

    expect(screen.getByRole('button', { name: 'Other IMAP' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Password')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Arm polling after activation' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Save Mailbox' })).toBeInTheDocument()
  })

  it('keeps only backend-backed status filtering controls in the list toolbar', () => {
    renderPage()

    expect(screen.getByPlaceholderText('Filter current page...')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.queryByText('All Polling')).not.toBeInTheDocument()
    expect(screen.queryByText('All Poll Status')).not.toBeInTheDocument()
    expect(screen.getByText('Status filtering is backed by the backend. Polling state indicators below are informational only, and the quick filter applies to the currently loaded page.')).toBeInTheDocument()
  })

  it('switches to Gmail presets and keeps OAuth fields hidden', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'New Mailbox' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gmail' }))
    fireEvent.click(screen.getByRole('button', { name: /Advanced Settings/i }))

    expect(screen.getByText('Gmail bağlantısı')).toBeInTheDocument()
    expect(screen.getByText('Normal Gmail şifrenizi değil, App Password kullanın. App Password oluşturmak için Google hesabınızda 2 Adımlı Doğrulama açık olmalıdır.')).toBeInTheDocument()
    expect(screen.getByText('Genelde IMAP Username ve SMTP Username alanlarına email adresiniz yazılır.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('imap.gmail.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('smtp.gmail.com')).toBeInTheDocument()
    expect(screen.queryByLabelText('Tenant ID *')).not.toBeInTheDocument()
  })

  it('switches to Outlook OAuth2 fields and hides the IMAP password input', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'New Mailbox' }))
    fireEvent.click(screen.getByRole('button', { name: 'Outlook / Microsoft 365' }))

    expect(screen.getByText('Microsoft 365 bağlantısı')).toBeInTheDocument()
    expect(screen.getByText('Bu ekranda Outlook hesabınıza giriş yapmazsınız. Normal mailbox şifresi yerine, Microsoft 365 admin tarafından sağlanan bağlantı bilgilerini girersiniz.')).toBeInTheDocument()
    expect(screen.getByText('Gerekli bilgiler: IMAP Username, Tenant ID, Client ID ve Client Secret.')).toBeInTheDocument()
    expect(screen.getByLabelText('Tenant ID *')).toBeInTheDocument()
    expect(screen.getByLabelText('Client ID *')).toBeInTheDocument()
    expect(screen.getByLabelText('Client Secret *')).toBeInTheDocument()
    expect(screen.queryByLabelText('IMAP Password *')).not.toBeInTheDocument()
  })

  it('shows manual guidance for Other IMAP provider', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'New Mailbox' }))

    expect(screen.getByText('Host, port, username ve password alanlarını mail sağlayıcınızın verdiği bilgilere göre doldurun.')).toBeInTheDocument()
    expect(screen.getByLabelText('IMAP Password *')).toBeInTheDocument()
  })

  it('clears provider-specific secrets when switching providers', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'New Mailbox' }))
    fireEvent.click(screen.getByRole('button', { name: 'Outlook / Microsoft 365' }))
    fireEvent.change(screen.getByLabelText('Client Secret *'), { target: { value: 'outlook-secret' } })

    fireEvent.click(screen.getByRole('button', { name: 'Gmail' }))

    expect(screen.queryByDisplayValue('outlook-secret')).not.toBeInTheDocument()
    expect(screen.getByLabelText('IMAP Password *')).toHaveValue('')
  })

  it('shows validation when Outlook OAuth2 fields are missing', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'New Mailbox' }))
    fireEvent.click(screen.getByRole('button', { name: 'Outlook / Microsoft 365' }))
    fireEvent.change(screen.getByLabelText('Mailbox Name *'), { target: { value: 'Outlook Box' } })
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'helpdesk@contoso.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Mailbox' }))

    expect(await screen.findByText('Tenant ID is required for OAuth2.')).toBeInTheDocument()
    expect(screen.getByText('Client ID is required for OAuth2.')).toBeInTheDocument()
    expect(screen.getByText('Client secret is required for OAuth2.')).toBeInTheDocument()
  })

  it('sends null secrets on edit when secrets stay blank', async () => {
    mockUpdate.mockResolvedValueOnce({ id: 'm2' })
    renderPage()

    fireEvent.click(screen.getAllByTitle('Edit')[1])
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('m2', expect.objectContaining({
        oauthClientSecret: null,
        imapPassword: null,
        smtpPassword: null,
      }))
    })
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
    fireEvent.click(screen.getByRole('button', { name: 'Gmail' }))

    fireEvent.change(screen.getByLabelText('Mailbox Name *'), { target: { value: 'Risky mailbox' } })
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'risk@example.com' } })
    fireEvent.change(screen.getByLabelText('IMAP Username *'), { target: { value: 'risk@example.com' } })
    fireEvent.change(screen.getByLabelText('IMAP Password *'), { target: { value: 'secret' } })
    fireEvent.change(screen.getByLabelText('Initial Sync'), { target: { value: 'SCAN_LAST_3_DAYS' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Arm polling after activation' }))

    fireEvent.click(screen.getByRole('button', { name: 'Save Mailbox' }))

    expect(screen.getByText('Saving this mailbox with polling enabled can allow historical inbox scanning as soon as the mailbox is activated and polling runs.')).toBeInTheDocument()
  })

  it('shows an honest recovery note instead of fake admin mail operations', () => {
    renderPage()

    fireEvent.click(screen.getAllByTitle('Edit')[0])

    expect(screen.getByText('Operational Recovery')).toBeInTheDocument()
    expect(screen.getByText('Poll-now, cursor reset, ingress event retry, quarantine, and release actions are not exposed by the backend admin contract yet, so this screen does not simulate them.')).toBeInTheDocument()
  })

  it('keeps the existing secret placeholder text in edit mode', () => {
    renderPage()

    fireEvent.click(screen.getAllByTitle('Edit')[1])

    expect(screen.getAllByPlaceholderText('Boş bırakırsanız mevcut değer korunur').length).toBeGreaterThan(0)
  })

  it('shows field helper text for the main credential inputs', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'New Mailbox' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gmail' }))

    expect(screen.getByText('Dinlenecek gerçek mailbox adresi.')).toBeInTheDocument()
    expect(screen.getByText('Çoğu durumda mailbox adresiyle aynıdır.')).toBeInTheDocument()
    expect(screen.getByText('Gmail için normal şifre değil, App Password kullanın.')).toBeInTheDocument()
    expect(screen.getByText('Genelde mailbox adresiyle aynıdır.')).toBeInTheDocument()
    expect(screen.getByText('İlk kurulumda eski maillerin taranıp taranmayacağını belirler. Güvenli başlangıç için New messages only önerilir.')).toBeInTheDocument()
  })
})