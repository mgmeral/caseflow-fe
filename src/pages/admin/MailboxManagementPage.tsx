import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Mail,
  Pencil,
  PlugZap,
  Plus,
  Search,
  ShieldOff,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useMailboxes } from '@/hooks/useMailboxes'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { normalizeInitialSyncStrategy } from '@/services/email-platform.normalizers'
import { mailboxService, type MailboxListFilters } from '@/services/mailbox.service'
import type { Mailbox } from '@/types/email.types'
import type {
  InitialSyncStrategy,
  MailProvider,
  MailboxConnectionTestResponse,
  MailboxProtocolTestResult,
} from '@/types/api.types'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { Badge } from '@/components/shared/Badge'
import {
  applyAuthTypeSelection,
  applyProviderSelection,
  buildMailboxPayload,
  createMailboxFormState,
  EMPTY_FORM,
  getAuthTypeLabel,
  getProviderLabel,
  type MailboxFormState,
  validateMailboxForm,
} from './mailboxForm'

const SAFE_INITIAL_SYNC_STRATEGY: InitialSyncStrategy = 'NEW_MESSAGES_ONLY'

const INITIAL_SYNC_OPTIONS: Array<{ value: InitialSyncStrategy; label: string; description: string }> = [
  {
    value: 'NEW_MESSAGES_ONLY',
    label: 'New messages only',
    description: 'Safest. Starts from new mail after activation without scanning historical inbox messages.',
  },
  {
    value: 'SCAN_FROM_START',
    label: 'Scan from start',
    description: 'Highest risk. Scans the full inbox history and can create a large backlog.',
  },
  {
    value: 'SCAN_LAST_1_DAY',
    label: 'Scan last 1 day',
    description: 'Safer than a full scan, but still processes recent historical inbox mail.',
  },
  {
    value: 'SCAN_LAST_3_DAYS',
    label: 'Scan last 3 days',
    description: 'Safer than a full scan, but still processes recent historical inbox mail.',
  },
  {
    value: 'SCAN_LAST_7_DAYS',
    label: 'Scan last 7 days',
    description: 'Safer than a full scan, but still processes recent historical inbox mail.',
  },
]

const PROVIDER_OPTIONS: Array<{ value: MailProvider; label: string; description: string }> = [
  { value: 'GMAIL', label: 'Gmail', description: 'App Password ile kurulur.' },
  { value: 'OUTLOOK', label: 'Outlook / Microsoft 365', description: 'OAuth2 ile kurulur.' },
  { value: 'OTHER', label: 'Other IMAP', description: 'Baglanti bilgilerini manuel girin.' },
]

const SECRET_PLACEHOLDER = 'Boş bırakırsanız mevcut değer korunur'

const PROVIDER_GUIDANCE: Record<MailProvider, { title: string; body: string; footnote?: string }> = {
  GMAIL: {
    title: 'Gmail bağlantısı',
    body: 'Normal Gmail şifrenizi değil, App Password kullanın. App Password oluşturmak için Google hesabınızda 2 Adımlı Doğrulama açık olmalıdır.',
    footnote: 'Genelde IMAP Username ve SMTP Username alanlarına email adresiniz yazılır.',
  },
  OUTLOOK: {
    title: 'Microsoft 365 bağlantısı',
    body: 'Bu ekranda Outlook hesabınıza giriş yapmazsınız. Normal mailbox şifresi yerine, Microsoft 365 admin tarafından sağlanan bağlantı bilgilerini girersiniz.',
    footnote: 'Gerekli bilgiler: IMAP Username, Tenant ID, Client ID ve Client Secret.',
  },
  OTHER: {
    title: 'Manual IMAP bağlantısı',
    body: 'Host, port, username ve password alanlarını mail sağlayıcınızın verdiği bilgilere göre doldurun.',
  },
}

const PROVIDER_STEPS: Partial<Record<MailProvider, string[]>> = {
  GMAIL: [
    'Mailbox adresini girin',
    'App Password oluşturun',
    'Username ve password alanlarını doldurun',
    'Test Connection ile doğrulayın',
    'Kaydedin',
  ],
  OUTLOOK: [
    'Mailbox adresini girin',
    'IT / admin’den Tenant ID, Client ID ve Client Secret alın',
    'Gerekli alanları doldurun',
    'Test Connection ile doğrulayın',
    'Kaydedin',
  ],
}

const FIELD_HELPERS = {
  mailboxName: 'Uygulama içinde görünen isim.',
  address: 'Dinlenecek gerçek mailbox adresi.',
  imapUsername: 'Çoğu durumda mailbox adresiyle aynıdır.',
  imapPassword: 'Gmail için normal şifre değil, App Password kullanın.',
  smtpUsername: 'Genelde mailbox adresiyle aynıdır.',
  smtpPassword: 'Boş bırakırsanız mevcut değer korunur.',
  oauthTenantId: 'Microsoft 365 kuruluş kimliği.',
  oauthClientId: 'Bağlantı için kullanılan uygulama kimliği.',
  oauthClientSecret: 'Bağlantı için kullanılan gizli anahtar. Boş bırakırsanız mevcut değer korunur.',
  imapFolder: 'Genelde INBOX kullanılır.',
  pollingEnabled: 'Yeni mailboxlar polling kapalı kaydedilir. Bu seçenek yalnızca mailbox daha sonra aktive edildiğinde polling davranışını hazırlar.',
  initialSyncStrategy: 'İlk kurulumda eski maillerin taranıp taranmayacağını belirler. Güvenli başlangıç için New messages only önerilir.',
} as const

function getInitialSyncStrategyLabel(value: InitialSyncStrategy | null | undefined): string {
  const normalized = normalizeInitialSyncStrategy(value)
  return INITIAL_SYNC_OPTIONS.find((option) => option.value === normalized)?.label ?? (normalized ?? 'Unknown')
}

function isHistoricalSyncStrategy(value: InitialSyncStrategy | null | undefined): boolean {
  const normalized = normalizeInitialSyncStrategy(value)
  return Boolean(normalized && normalized !== SAFE_INITIAL_SYNC_STRATEGY)
}

function isFullScanStrategy(value: InitialSyncStrategy | null | undefined): boolean {
  return normalizeInitialSyncStrategy(value) === 'SCAN_FROM_START'
}

function getConnectionTestResult(result: MailboxConnectionTestResponse | undefined, protocol: 'imap' | 'smtp') {
  if (!result) return undefined
  if (protocol === 'imap') return result.imap ?? result
  return result.smtp ?? undefined
}

function getProtocolTestStatusLabel(mailbox: Mailbox, protocol: 'imap' | 'smtp', result: MailboxProtocolTestResult | undefined) {
  if (result) {
    return {
      tone: result.success ? 'text-green-600' : 'text-red-600',
      label: result.success ? 'Success' : 'Failure',
    }
  }

  if (protocol === 'smtp' && !mailbox.smtpHost) {
    return {
      tone: 'text-gray-400',
      label: 'Not configured',
    }
  }

  return {
    tone: 'text-gray-400',
    label: 'Not tested',
  }
}

function getRiskSummary(strategy: InitialSyncStrategy | null | undefined): string {
  if (isFullScanStrategy(strategy)) {
    return 'Scan from start may process old inbox messages, ingest unrelated email, and create a large backlog before normal polling settles.'
  }

  return 'This mailbox is configured to scan historical inbox mail before settling into new-message polling.'
}

function pollingBadge(enabled: boolean): { variant: 'success' | 'default'; label: string } {
  return enabled
    ? { variant: 'success', label: 'Polling On' }
    : { variant: 'default', label: 'Polling Off' }
}

function formatTimestamp(value: string | null): string {
  return value ? format(new Date(value), 'MMM d, HH:mm') : '—'
}

function getProviderBadgeVariant(mailProvider: MailProvider | null | undefined): 'info' | 'success' | 'default' {
  switch (mailProvider) {
    case 'OUTLOOK': return 'info'
    case 'GMAIL': return 'success'
    default: return 'default'
  }
}

function getOauthConfiguredBadge(mailbox: Mailbox): { variant: 'success' | 'warning'; label: string } | null {
  if (mailbox.authType !== 'OAUTH2') return null
  return mailbox.oauthConfigured
    ? { variant: 'success', label: 'OAuth ready' }
    : { variant: 'warning', label: 'OAuth incomplete' }
}

function FieldError({ message, visible }: { message?: string; visible: boolean }) {
  if (!visible || !message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

function FieldHelper({ text }: { text: string }) {
  return <p className="mt-1 text-xs leading-5 text-gray-500">{text}</p>
}

export function MailboxManagementPage() {
  const { canManageEmailConfig } = usePermissions()
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [filters, setFilters] = useState<MailboxListFilters>({ page: 0, size: 20 })
  const [search, setSearch] = useState('')
  const { data, isLoading } = useMailboxes({ ...filters })

  const mailboxes = data?.items ?? []
  const totalPages = data?.totalPages ?? 0
  const currentPage = filters.page ?? 0

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingMailbox, setEditingMailbox] = useState<Mailbox | null>(null)
  const [form, setForm] = useState<MailboxFormState>(EMPTY_FORM)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [providerHelpOpen, setProviderHelpOpen] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState<{ imap: boolean; smtp: boolean }>({ imap: false, smtp: false })
  const [connectionResults, setConnectionResults] = useState<Record<string, MailboxConnectionTestResponse>>({})
  const [riskConfirmation, setRiskConfirmation] = useState<
    | {
      action: 'save'
      mailboxName: string
      strategy: InitialSyncStrategy
    }
    | {
      action: 'activate'
      mailbox: Mailbox
      strategy: InitialSyncStrategy
    }
    | null
  >(null)

  const validationErrors = useMemo(
    () => validateMailboxForm(form, modalMode ?? 'create', editingMailbox),
    [editingMailbox, form, modalMode],
  )

  if (!canManageEmailConfig) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to manage mailboxes."
        />
      </div>
    )
  }

  const filteredMailboxes = mailboxes.filter((mailbox) => {
    const query = search.trim().toLowerCase()
    if (!query) return true

    return [
      mailbox.name,
      mailbox.address,
      mailbox.displayName ?? '',
      mailbox.imapHost ?? '',
      mailbox.smtpHost ?? '',
      getProviderLabel(mailbox.mailProvider),
      getAuthTypeLabel(mailbox.authType),
    ].some((value) => value.toLowerCase().includes(query))
  })

  const currentConnectionResult = editingMailbox ? connectionResults[editingMailbox.id] : undefined
  const currentImapTestResult = getConnectionTestResult(currentConnectionResult, 'imap')
  const currentSmtpTestResult = getConnectionTestResult(currentConnectionResult, 'smtp')
  const smtpTestAvailable = Boolean(editingMailbox?.smtpHost || editingMailbox?.smtpPort || editingMailbox?.smtpUsername)
  const selectedInitialSyncOption = INITIAL_SYNC_OPTIONS.find((option) => option.value === normalizeInitialSyncStrategy(form.initialSyncStrategy))
  const oauthConfiguredBadge = editingMailbox ? getOauthConfiguredBadge(editingMailbox) : null
  const showProviderAuthSelector = form.mailProvider === 'OTHER'
  const showOauthFields = form.authType === 'OAUTH2'
  const showSmtpCredentials = form.mailProvider !== 'OUTLOOK'
  const providerGuidance = PROVIDER_GUIDANCE[form.mailProvider]
  const providerSteps = PROVIDER_STEPS[form.mailProvider] ?? []
  const authSummaryLabel = form.mailProvider === 'OUTLOOK'
    ? 'Authentication: OAuth2'
    : form.mailProvider === 'GMAIL'
      ? 'Authentication: Password / App Password'
      : `Authentication: ${getAuthTypeLabel(form.authType)}`
  const quickFilterActive = search.trim().length > 0
  const headerCountLabel = quickFilterActive
    ? `${filteredMailboxes.length} of ${mailboxes.length} mailboxes on this page`
    : `${filteredMailboxes.length} mailbox${filteredMailboxes.length !== 1 ? 'es' : ''}`

  const updateForm = (updater: (current: MailboxFormState) => MailboxFormState) => {
    setForm((current) => updater(current))
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingMailbox(null)
    setAdvancedOpen(false)
    setProviderHelpOpen(false)
    setShowValidation(false)
    setModalMode('create')
  }

  const openEdit = (mailbox: Mailbox) => {
    setForm(createMailboxFormState(mailbox))
    setEditingMailbox(mailbox)
    setAdvancedOpen(mailbox.mailProvider === 'OTHER')
    setProviderHelpOpen(false)
    setShowValidation(false)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingMailbox(null)
    setForm(EMPTY_FORM)
    setAdvancedOpen(false)
    setProviderHelpOpen(false)
    setShowValidation(false)
  }

  const handleCopyItRequest = async () => {
    const mailboxAddress = form.address.trim() || '[email address]'
    const copyText = `CaseFlow üzerinden Outlook / Microsoft 365 mailbox bağlantısı kurmam gerekiyor.
Lütfen aşağıdaki bilgileri paylaşır mısınız?
- Tenant ID
- Client ID
- Client Secret
- Gerekli IMAP OAuth izinlerinin tanımlandığı bilgisi
Mailbox adresi: ${mailboxAddress}`

    if (!navigator.clipboard) {
      error('Kopyalama bu tarayıcıda desteklenmiyor')
      return
    }

    try {
      await navigator.clipboard.writeText(copyText)
      success('IT isteği panoya kopyalandı')
    } catch {
      error('Kopyalama başarısız oldu')
    }
  }

  const executeSave = async () => {
    setSaving(true)
    try {
      const payload = buildMailboxPayload(form, editingMailbox)

      if (modalMode === 'create') {
        await mailboxService.create(payload)
        success('Mailbox created')
      } else if (editingMailbox) {
        await mailboxService.update(editingMailbox.id, payload)
        success('Mailbox updated')
      }

      await queryClient.invalidateQueries({ queryKey: ['mailboxes'] })
      closeModal()
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to save mailbox')
    } finally {
      setSaving(false)
    }
  }

  const shouldConfirmRiskOnSave = (): boolean => {
    if (!form.pollingEnabled || !isHistoricalSyncStrategy(form.initialSyncStrategy)) return false
    if (modalMode === 'create') return true
    if (!editingMailbox) return false

    return editingMailbox.isActive && !editingMailbox.pollingEnabled
  }

  const handleSave = async () => {
    setShowValidation(true)
    if (Object.keys(validationErrors).length > 0) return

    if (shouldConfirmRiskOnSave()) {
      setRiskConfirmation({
        action: 'save',
        mailboxName: form.name.trim() || editingMailbox?.name || 'This mailbox',
        strategy: normalizeInitialSyncStrategy(form.initialSyncStrategy) ?? 'NEW_MESSAGES_ONLY',
      })
      return
    }

    await executeSave()
  }

  const executeToggleActive = async (mailbox: Mailbox) => {
    setToggling(mailbox.id)
    try {
      if (mailbox.isActive) {
        await mailboxService.deactivate(mailbox.id)
        success(`"${mailbox.name}" deactivated`)
      } else {
        await mailboxService.activate(mailbox.id)
        success(`"${mailbox.name}" activated`)
      }

      await queryClient.invalidateQueries({ queryKey: ['mailboxes'] })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Toggle failed')
    } finally {
      setToggling(null)
    }
  }

  const handleToggleActive = async (mailbox: Mailbox) => {
    if (!mailbox.isActive && mailbox.pollingEnabled && isHistoricalSyncStrategy(mailbox.initialSyncStrategy)) {
      setRiskConfirmation({
        action: 'activate',
        mailbox,
        strategy: normalizeInitialSyncStrategy(mailbox.initialSyncStrategy) ?? 'NEW_MESSAGES_ONLY',
      })
      return
    }

    await executeToggleActive(mailbox)
  }

  const updateConnectionResult = (mailboxId: string, protocol: 'imap' | 'smtp', result: MailboxProtocolTestResult) => {
    setConnectionResults((current) => ({
      ...current,
      [mailboxId]: {
        ...(current[mailboxId] ?? {}),
        [protocol]: result,
      },
    }))
  }

  const handleTestImapConnection = async () => {
    if (!editingMailbox) return

    setTestingConnection((current) => ({ ...current, imap: true }))
    try {
      const result = await mailboxService.testImapConnection(editingMailbox.id)
      updateConnectionResult(editingMailbox.id, 'imap', result)
      if (result.success) {
        success('IMAP connection test succeeded')
      } else {
        error('IMAP connection test failed')
      }
    } catch (err) {
      const result: MailboxProtocolTestResult = {
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
        testedAt: new Date().toISOString(),
      }
      updateConnectionResult(editingMailbox.id, 'imap', result)
      error(result.message)
    } finally {
      setTestingConnection((current) => ({ ...current, imap: false }))
    }
  }

  const handleTestSmtpConnection = async () => {
    if (!editingMailbox || !smtpTestAvailable) return

    setTestingConnection((current) => ({ ...current, smtp: true }))
    try {
      const result = await mailboxService.testSmtpConnection(editingMailbox.id)
      updateConnectionResult(editingMailbox.id, 'smtp', result)
      if (result.success) {
        success('SMTP connection test succeeded')
      } else {
        error('SMTP connection test failed')
      }
    } catch (err) {
      const result: MailboxProtocolTestResult = {
        success: false,
        message: err instanceof Error ? err.message : 'SMTP connection test failed',
        testedAt: new Date().toISOString(),
      }
      updateConnectionResult(editingMailbox.id, 'smtp', result)
      error(result.message)
    } finally {
      setTestingConnection((current) => ({ ...current, smtp: false }))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mailboxes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{headerCountLabel}</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          New Mailbox
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter current page..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setFilters((current) => ({ ...current, page: 0 }))
              }}
              className="w-64 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <select
            value={filters.active === undefined ? '' : String(filters.active)}
            onChange={(event) => setFilters((current) => ({
              ...current,
              active: event.target.value === '' ? undefined : event.target.value === 'true',
              page: 0,
            }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          Status filtering is backed by the backend. Polling state indicators below are informational only, and the quick filter applies to the currently loaded page.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Address</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">IMAP</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">SMTP</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Polling</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Inbound</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Outbound</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Diagnostics</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <>
                  <SkeletonRow colCount={10} />
                  <SkeletonRow colCount={10} />
                  <SkeletonRow colCount={10} />
                </>
              ) : filteredMailboxes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12">
                    <EmptyState
                      icon={<Mail className="w-8 h-8 text-gray-400" />}
                      title="No mailboxes"
                      description="Create your first mailbox to start receiving email."
                    />
                  </td>
                </tr>
              ) : (
                filteredMailboxes.map((mailbox) => {
                  const connectionResult = connectionResults[mailbox.id]
                  const imapTestResult = getConnectionTestResult(connectionResult, 'imap')
                  const smtpTestResult = getConnectionTestResult(connectionResult, 'smtp')
                  const imapStatus = getProtocolTestStatusLabel(mailbox, 'imap', imapTestResult)
                  const smtpStatus = getProtocolTestStatusLabel(mailbox, 'smtp', smtpTestResult)
                  const oauthBadge = getOauthConfiguredBadge(mailbox)

                  return (
                    <tr key={mailbox.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{mailbox.name}</div>
                        {mailbox.displayName && <div className="text-xs text-gray-400">{mailbox.displayName}</div>}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant={getProviderBadgeVariant(mailbox.mailProvider)} size="sm">{getProviderLabel(mailbox.mailProvider)}</Badge>
                          <Badge variant="outline" size="sm">{getAuthTypeLabel(mailbox.authType)}</Badge>
                          {oauthBadge && <Badge variant={oauthBadge.variant} size="sm">{oauthBadge.label}</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{mailbox.address}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div className="font-mono">{mailbox.imapHost ?? '—'}:{mailbox.imapPort ?? '—'}</div>
                        <div>{mailbox.imapUsername ?? '—'}</div>
                        <div className="text-gray-400">Folder: {mailbox.imapFolder ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {mailbox.smtpHost ? (
                          <>
                            <div className="font-mono">{mailbox.smtpHost}:{mailbox.smtpPort ?? '—'}</div>
                            <div>{mailbox.smtpUsername ?? '—'}</div>
                            {mailbox.smtpStarttls != null && <div className="text-gray-400">STARTTLS: {mailbox.smtpStarttls ? 'On' : 'Off'}</div>}
                          </>
                        ) : (
                          <span className="text-gray-400">Default / not mailbox-specific</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <Badge variant={pollingBadge(mailbox.pollingEnabled).variant} size="sm">{pollingBadge(mailbox.pollingEnabled).label}</Badge>
                          <div className="text-xs text-gray-500">
                            {mailbox.pollingEnabled ? `Configured interval ${mailbox.pollIntervalSeconds}s` : 'No polling schedule armed'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {mailbox.isActive ? (
                          <Badge variant="success" size="sm">Active</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div>Last successful inbound: {formatTimestamp(mailbox.lastSuccessfulInboundAt)}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div>Last successful outbound: {formatTimestamp(mailbox.lastSuccessfulOutboundAt)}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div>
                          <span className="font-medium text-gray-600">Initial sync:</span>{' '}
                          <span className="text-gray-700">{getInitialSyncStrategyLabel(mailbox.initialSyncStrategy)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Last poll:</span>{' '}
                          <span className="text-gray-700">{formatTimestamp(mailbox.lastPollAt)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Last poll error:</span>{' '}
                          <span className={mailbox.lastPollError ? 'text-red-600' : 'text-gray-400'}>{mailbox.lastPollError ?? 'None'}</span>
                        </div>
                        {mailbox.pollingStatus && (
                          <div>
                            <span className="font-medium text-gray-600">Backend poll state:</span>{' '}
                            <span className="text-gray-700">{mailbox.pollingStatus}</span>
                          </div>
                        )}
                        <div className="mt-1">
                          <span className="font-medium text-gray-600">IMAP test:</span>{' '}
                          <span className={imapStatus.tone}>{imapStatus.label}</span>
                        </div>
                        <div className="mt-1">
                          <span className="font-medium text-gray-600">SMTP test:</span>{' '}
                          <span className={smtpStatus.tone}>{smtpStatus.label}</span>
                        </div>
                        {connectionResult && (
                          <div className="mt-1 text-gray-500">
                            {imapTestResult && (
                              <>
                                <div>IMAP: {imapTestResult.message}</div>
                                <div>IMAP tested: {format(new Date(imapTestResult.testedAt), 'MMM d, HH:mm')}</div>
                              </>
                            )}
                            {smtpTestResult && <div>SMTP: {smtpTestResult.message}</div>}
                          </div>
                        )}
                        {mailbox.activationState && (
                          <div className="mt-1 text-gray-500">Activation: {mailbox.activationState}</div>
                        )}
                        {mailbox.cursorInitStrategy && (
                          <div className="mt-1 text-gray-500">Cursor init: {getInitialSyncStrategyLabel(mailbox.cursorInitStrategy as InitialSyncStrategy)}</div>
                        )}
                        {mailbox.lastSeenUid && (
                          <div className="mt-1 text-gray-500">Last seen UID: {mailbox.lastSeenUid}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(mailbox)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(mailbox)}
                            disabled={toggling === mailbox.id}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600"
                            title={mailbox.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {mailbox.isActive ? <ToggleRight size={14} className="text-green-500" /> : <ToggleLeft size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            <span>Page {currentPage + 1} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 0}
                onClick={() => setFilters((current) => ({ ...current, page: currentPage - 1 }))}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setFilters((current) => ({ ...current, page: currentPage + 1 }))}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'New Mailbox' : `Edit - ${editingMailbox?.name ?? ''}`}
        size="xl"
      >
        <div className="space-y-4 p-1">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Mailbox Provider</div>
                <p className="mt-1 text-sm text-gray-600">Choose the provider first so the form only shows fields that make sense.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getProviderBadgeVariant(form.mailProvider)} size="sm">{getProviderLabel(form.mailProvider)}</Badge>
                <Badge variant="outline" size="sm">{getAuthTypeLabel(form.authType)}</Badge>
                {oauthConfiguredBadge && <Badge variant={oauthConfiguredBadge.variant} size="sm">{oauthConfiguredBadge.label}</Badge>}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {PROVIDER_OPTIONS.map((option) => {
                const selected = form.mailProvider === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    onClick={() => {
                      updateForm((current) => applyProviderSelection(current, option.value))
                      setAdvancedOpen(option.value === 'OTHER')
                      setProviderHelpOpen(false)
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${selected ? 'border-indigo-400 bg-white shadow-sm ring-2 ring-indigo-100' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                    <div className="mt-1 text-xs leading-5 text-gray-500">{option.description}</div>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
              <div className="text-sm font-semibold text-sky-900">{providerGuidance.title}</div>
              <p className="mt-1 text-sm leading-6 text-sky-900">{providerGuidance.body}</p>
              {providerGuidance.footnote ? (
                <p className="mt-2 text-xs leading-5 text-sky-700">{providerGuidance.footnote}</p>
              ) : null}
              {form.mailProvider === 'OUTLOOK' ? (
                <>
                  <p className="mt-2 text-xs leading-5 text-sky-700">Bu bilgiler genelde IT / Microsoft 365 admin tarafından sağlanır.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProviderHelpOpen((current) => !current)}
                      className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
                    >
                      Bu bilgileri nereden alırım?
                      {providerHelpOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <Button variant="secondary" size="sm" onClick={handleCopyItRequest}>IT için isteği kopyala</Button>
                  </div>
                  {providerHelpOpen ? (
                    <div className="mt-3 rounded-xl border border-sky-200 bg-white px-3 py-3 text-xs leading-5 text-sky-900">
                      <div>Tenant ID: Microsoft 365 / Entra tenant kimliği</div>
                      <div>Client ID: Entra App Registration uygulama kimliği</div>
                      <div>Client Secret: Entra App Registration secret değeri</div>
                      <div>Bu bilgiler genelde IT / Microsoft 365 admin tarafından sağlanır</div>
                      <div className="mt-2 font-medium">Bu bilgileri bilmiyorsanız, şirketinizin Microsoft 365 yöneticisinden istemeniz gerekir.</div>
                    </div>
                  ) : null}
                </>
              ) : null}
              {providerSteps.length > 0 ? (
                <div className="mt-3 rounded-xl border border-sky-200/80 bg-white/70 px-3 py-3">
                  <div className="text-xs font-semibold text-sky-900">Bağlantı adımları</div>
                  <div className="mt-2 space-y-1.5 text-xs leading-5 text-sky-900">
                    {providerSteps.map((step, index) => (
                      <div key={step}>{index + 1}. {step}</div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mailbox Name *</label>
              <input
                aria-label="Mailbox Name *"
                value={form.name}
                onChange={(event) => updateForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <FieldHelper text={FIELD_HELPERS.mailboxName} />
              <FieldError message={validationErrors.name} visible={showValidation} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email Address *</label>
              <input
                aria-label="Email Address *"
                type="email"
                value={form.address}
                onChange={(event) => updateForm((current) => ({
                  ...current,
                  address: event.target.value,
                  imapUsername: current.imapUsername || event.target.value,
                  smtpUsername: current.smtpUsername || event.target.value,
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                disabled={modalMode === 'edit'}
              />
              <FieldHelper text={FIELD_HELPERS.address} />
              <FieldError message={validationErrors.address} visible={showValidation} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
            <input
              aria-label="Display Name"
              value={form.displayName}
              onChange={(event) => updateForm((current) => ({ ...current, displayName: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Authentication</h3>
                <p className="mt-1 text-xs text-gray-500">Provider seçimine göre yalnızca gerekli giriş alanları gösterilir.</p>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
                <span className="inline-flex w-fit rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">{authSummaryLabel}</span>
                {showProviderAuthSelector && (
                  <div className="w-full max-w-xs md:w-auto">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Auth Type</label>
                    <select
                      aria-label="Auth Type"
                      value={form.authType}
                      onChange={(event) => updateForm((current) => applyAuthTypeSelection(current, event.target.value as 'PASSWORD' | 'OAUTH2'))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="PASSWORD">Password</option>
                      <option value="OAUTH2">OAuth2</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Username *</label>
                <input
                  aria-label="IMAP Username *"
                  value={form.imapUsername}
                  onChange={(event) => updateForm((current) => ({ ...current, imapUsername: event.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <FieldHelper text={FIELD_HELPERS.imapUsername} />
                <FieldError message={validationErrors.imapUsername} visible={showValidation} />
              </div>

              {!showOauthFields ? (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Password{modalMode === 'create' ? ' *' : ''}</label>
                  <input
                    aria-label={`IMAP Password${modalMode === 'create' ? ' *' : ''}`}
                    type="password"
                    value={form.imapPassword}
                    onChange={(event) => updateForm((current) => ({ ...current, imapPassword: event.target.value }))}
                    placeholder={modalMode === 'create' ? 'IMAP password' : SECRET_PLACEHOLDER}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <FieldHelper text={FIELD_HELPERS.imapPassword} />
                  <FieldError message={validationErrors.imapPassword} visible={showValidation} />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tenant ID *</label>
                    <input
                      aria-label="Tenant ID *"
                      value={form.oauthTenantId}
                      onChange={(event) => updateForm((current) => ({ ...current, oauthTenantId: event.target.value }))}
                      placeholder="Entra tenant ID"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <FieldHelper text={FIELD_HELPERS.oauthTenantId} />
                    <FieldError message={validationErrors.oauthTenantId} visible={showValidation} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client ID *</label>
                    <input
                      aria-label="Client ID *"
                      value={form.oauthClientId}
                      onChange={(event) => updateForm((current) => ({ ...current, oauthClientId: event.target.value }))}
                      placeholder="Application (client) ID"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <FieldHelper text={FIELD_HELPERS.oauthClientId} />
                    <FieldError message={validationErrors.oauthClientId} visible={showValidation} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Client Secret{modalMode === 'create' || editingMailbox?.oauthConfigured !== true ? ' *' : ''}</label>
                    <input
                      aria-label={`Client Secret${modalMode === 'create' || editingMailbox?.oauthConfigured !== true ? ' *' : ''}`}
                      type="password"
                      value={form.oauthClientSecret}
                      onChange={(event) => updateForm((current) => ({ ...current, oauthClientSecret: event.target.value }))}
                      placeholder={modalMode === 'create' ? 'Client secret' : SECRET_PLACEHOLDER}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <FieldHelper text={FIELD_HELPERS.oauthClientSecret} />
                    <FieldError message={validationErrors.oauthClientSecret} visible={showValidation} />
                  </div>
                </>
              )}

              {showSmtpCredentials && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Username</label>
                    <input
                      aria-label="SMTP Username"
                      value={form.smtpUsername}
                      onChange={(event) => updateForm((current) => ({ ...current, smtpUsername: event.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <FieldHelper text={FIELD_HELPERS.smtpUsername} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Password</label>
                    <input
                      aria-label="SMTP Password"
                      type="password"
                      value={form.smtpPassword}
                      onChange={(event) => updateForm((current) => ({ ...current, smtpPassword: event.target.value }))}
                      placeholder={modalMode === 'create' ? 'SMTP password' : SECRET_PLACEHOLDER}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <FieldHelper text={FIELD_HELPERS.smtpPassword} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">IMAP Polling</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Folder</label>
                <input
                  aria-label="IMAP Folder"
                  value={form.imapFolder}
                  onChange={(event) => updateForm((current) => ({ ...current, imapFolder: event.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <FieldHelper text={FIELD_HELPERS.imapFolder} />
                <FieldError message={validationErrors.imapFolder} visible={showValidation} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Interval (sec)</label>
                <input
                  aria-label="Interval (sec)"
                  type="number"
                  min="30"
                  max="86400"
                  value={form.pollIntervalSeconds}
                  onChange={(event) => updateForm((current) => ({ ...current, pollIntervalSeconds: event.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Initial Sync</label>
                <select
                  aria-label="Initial Sync"
                  value={form.initialSyncStrategy}
                  onChange={(event) => updateForm((current) => ({ ...current, initialSyncStrategy: event.target.value as MailboxFormState['initialSyncStrategy'] }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {INITIAL_SYNC_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FieldHelper text={FIELD_HELPERS.initialSyncStrategy} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pollingEnabled}
                  onChange={(event) => updateForm((current) => ({ ...current, pollingEnabled: event.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Arm polling after activation
              </label>
              <FieldHelper text={FIELD_HELPERS.pollingEnabled} />
            </div>

            {selectedInitialSyncOption && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                {selectedInitialSyncOption.description}
              </div>
            )}
            {isFullScanStrategy(form.initialSyncStrategy) && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-900">
                <div className="flex items-start gap-2 font-medium">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>Scan from start can process old inbox history.</span>
                </div>
                <div className="mt-2 text-xs leading-5">
                  This may process old inbox messages, ingest unrelated emails, and create a large backlog before the mailbox reaches steady-state polling.
                </div>
              </div>
            )}
            {!isFullScanStrategy(form.initialSyncStrategy) && isHistoricalSyncStrategy(form.initialSyncStrategy) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Recent-day scans are safer than a full scan, but they still process historical inbox messages within the selected lookback window.
              </div>
            )}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
              Saving stores mailbox configuration only. New mailboxes are saved inactive and polling off by default. Activation remains a separate operator action, and polling only starts if this mailbox is later activated with polling armed. IMAP and SMTP tests are separate checks and IMAP success alone does not confirm outbound send health.
            </div>
          </div>

          {editingMailbox && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">Operational Recovery</div>
              <div className="mt-1">Available in this environment: activate or deactivate the mailbox, then run IMAP and SMTP connection tests against the saved configuration.</div>
              <div className="mt-1">Poll-now, cursor reset, ingress event retry, quarantine, and release actions are not exposed by the backend admin contract yet, so this screen does not simulate them.</div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-5 space-y-3">
            <button
              type="button"
              onClick={() => setAdvancedOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Advanced Settings</div>
                <div className="mt-1 text-sm text-gray-600">Host, port ve güvenlik ayarları burada tutulur.</div>
              </div>
              {advancedOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>

            {advancedOpen && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Host *</label>
                    <input
                      aria-label="IMAP Host *"
                      value={form.imapHost}
                      onChange={(event) => updateForm((current) => ({ ...current, imapHost: event.target.value }))}
                      placeholder="imap.example.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <FieldError message={validationErrors.imapHost} visible={showValidation} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Port *</label>
                    <input
                      aria-label="IMAP Port *"
                      type="number"
                      value={form.imapPort}
                      onChange={(event) => updateForm((current) => ({ ...current, imapPort: event.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <FieldError message={validationErrors.imapPort} visible={showValidation} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.imapUseSsl}
                      onChange={(event) => updateForm((current) => ({ ...current, imapUseSsl: event.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Use SSL/TLS for IMAP
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.smtpStarttls}
                      onChange={(event) => updateForm((current) => ({ ...current, smtpStarttls: event.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Use STARTTLS for SMTP
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host</label>
                    <input
                      aria-label="SMTP Host"
                      value={form.smtpHost}
                      onChange={(event) => updateForm((current) => ({ ...current, smtpHost: event.target.value }))}
                      placeholder="smtp.example.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Port</label>
                    <input
                      aria-label="SMTP Port"
                      type="number"
                      value={form.smtpPort}
                      onChange={(event) => updateForm((current) => ({ ...current, smtpPort: event.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.smtpUseSsl}
                    onChange={(event) => updateForm((current) => ({ ...current, smtpUseSsl: event.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Require secure SMTP transport
                </label>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Provider Type</label>
                    <input
                      aria-label="Provider Type"
                      value={form.providerType}
                      onChange={(event) => updateForm((current) => ({ ...current, providerType: event.target.value as MailboxFormState['providerType'] }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Inbound Mode</label>
                    <input
                      aria-label="Inbound Mode"
                      value={form.inboundMode}
                      onChange={(event) => updateForm((current) => ({ ...current, inboundMode: event.target.value as MailboxFormState['inboundMode'] }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Outbound Mode</label>
                    <input
                      aria-label="Outbound Mode"
                      value={form.outboundMode}
                      onChange={(event) => updateForm((current) => ({ ...current, outboundMode: event.target.value as MailboxFormState['outboundMode'] }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  Test Connection buttons use the saved mailbox configuration. Save changes before using them to verify updated advanced settings.
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Defaults</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-1">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Default Group ID</label>
                <input
                  aria-label="Default Group ID"
                  value={form.defaultGroupId}
                  onChange={(event) => updateForm((current) => ({ ...current, defaultGroupId: event.target.value }))}
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Default Priority</label>
                <input
                  aria-label="Default Priority"
                  value={form.defaultPriority}
                  onChange={(event) => updateForm((current) => ({ ...current, defaultPriority: event.target.value }))}
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          </div>

          {editingMailbox && (currentImapTestResult || currentSmtpTestResult) && (
            <div className="space-y-2">
              {currentImapTestResult && (
                <div className={`rounded-lg border px-3 py-2 text-sm ${currentImapTestResult.success ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                  <div className="font-medium">{currentImapTestResult.success ? 'IMAP connection test succeeded' : 'IMAP connection test failed'}</div>
                  <div>{currentImapTestResult.message}</div>
                  <div className="text-xs opacity-80 mt-1">Tested at {format(new Date(currentImapTestResult.testedAt), 'yyyy-MM-dd HH:mm:ss')}</div>
                </div>
              )}
              {currentSmtpTestResult && (
                <div className={`rounded-lg border px-3 py-2 text-sm ${currentSmtpTestResult.success ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                  <div className="font-medium">{currentSmtpTestResult.success ? 'SMTP connection test succeeded' : 'SMTP connection test failed'}</div>
                  <div>{currentSmtpTestResult.message}</div>
                  <div className="text-xs opacity-80 mt-1">Tested at {format(new Date(currentSmtpTestResult.testedAt), 'yyyy-MM-dd HH:mm:ss')}</div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {editingMailbox && (
              <div className="flex flex-col items-end gap-1">
                <Button variant="ghost" size="sm" leftIcon={<PlugZap size={14} />} onClick={handleTestImapConnection} isLoading={testingConnection.imap}>
                  Test IMAP Connection
                </Button>
                <span className="text-[11px] text-gray-500">Bilgileri girdikten sonra bağlantıyı test edin.</span>
              </div>
            )}
            {editingMailbox && (
              <div className="flex flex-col items-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<PlugZap size={14} />}
                  onClick={handleTestSmtpConnection}
                  isLoading={testingConnection.smtp}
                  disabled={!smtpTestAvailable}
                  title={!smtpTestAvailable ? 'Save mailbox-specific SMTP settings before running an SMTP connection test.' : undefined}
                >
                  Test SMTP Connection
                </Button>
                <span className="text-[11px] text-gray-500">Bilgileri girdikten sonra bağlantıyı test edin.</span>
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
              {modalMode === 'create' ? 'Save Mailbox' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={riskConfirmation !== null}
        onClose={() => setRiskConfirmation(null)}
        title={riskConfirmation?.action === 'activate' ? 'Confirm Mailbox Activation' : 'Confirm Historical Mail Scan'}
        size="md"
        footer={(
          <>
            <Button variant="secondary" size="sm" onClick={() => setRiskConfirmation(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                if (!riskConfirmation) return

                const pendingConfirmation = riskConfirmation
                setRiskConfirmation(null)

                if (pendingConfirmation.action === 'activate') {
                  await executeToggleActive(pendingConfirmation.mailbox)
                  return
                }

                await executeSave()
              }}
            >
              {riskConfirmation?.action === 'activate' ? 'Activate Mailbox' : 'Save and Continue'}
            </Button>
          </>
        )}
      >
        {riskConfirmation && (
          <div className="space-y-3 text-sm text-gray-700">
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-red-900">
              <div className="flex items-start gap-2 font-medium">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{getRiskSummary(riskConfirmation.strategy)}</span>
              </div>
            </div>
            <p>
              Historical inbox processing can ingest unrelated personal or marketing emails if mailbox rules are broad or missing.
            </p>
            <p>
              Strategy: <span className="font-medium">{getInitialSyncStrategyLabel(riskConfirmation.strategy)}</span>
            </p>
            {riskConfirmation.action === 'activate' ? (
              <p>
                Activating this mailbox will allow polling to start with the configured historical scan behavior.
              </p>
            ) : (
              <p>
                Saving this mailbox with polling enabled can allow historical inbox scanning as soon as the mailbox is activated and polling runs.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}