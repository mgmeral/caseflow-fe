import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ShieldOff,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  PlugZap,
  AlertTriangle,
} from 'lucide-react'
import { useMailboxes } from '@/hooks/useMailboxes'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { normalizeInitialSyncStrategy } from '@/services/email-platform.normalizers'
import { mailboxService, type MailboxListFilters } from '@/services/mailbox.service'
import type { Mailbox } from '@/types/email.types'
import type {
  CreateMailboxRequest,
  InitialSyncStrategy,
  MailboxConnectionTestResponse,
  MailboxProtocolTestResult,
  UpdateMailboxRequest,
} from '@/types/api.types'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { Badge } from '@/components/shared/Badge'

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

interface MailboxFormState {
  name: string
  address: string
  displayName: string
  imapHost: string
  imapPort: string
  imapUsername: string
  imapPassword: string
  imapFolder: string
  imapUseSsl: boolean
  pollingEnabled: boolean
  pollIntervalSeconds: string
  initialSyncStrategy: InitialSyncStrategy
  useCustomSmtp: boolean
  smtpHost: string
  smtpPort: string
  smtpUsername: string
  smtpPassword: string
  smtpUseSsl: boolean
  defaultGroupId: string
  defaultPriority: string
}

const EMPTY_FORM: MailboxFormState = {
  name: '',
  address: '',
  displayName: '',
  imapHost: '',
  imapPort: '993',
  imapUsername: '',
  imapPassword: '',
  imapFolder: 'INBOX',
  imapUseSsl: true,
  pollingEnabled: true,
  pollIntervalSeconds: '60',
  initialSyncStrategy: 'NEW_MESSAGES_ONLY',
  useCustomSmtp: false,
  smtpHost: '',
  smtpPort: '587',
  smtpUsername: '',
  smtpPassword: '',
  smtpUseSsl: true,
  defaultGroupId: '',
  defaultPriority: '',
}

const POLLING_STATUSES = ['RUNNING', 'IDLE', 'PAUSED', 'ERROR']

function pollingBadge(status: string): { variant: 'success' | 'warning' | 'error' | 'default'; label: string } {
  switch (status) {
    case 'RUNNING': return { variant: 'success', label: 'Running' }
    case 'IDLE': return { variant: 'default', label: 'Idle' }
    case 'PAUSED': return { variant: 'warning', label: 'Paused' }
    case 'ERROR': return { variant: 'error', label: 'Error' }
    default: return { variant: 'default', label: status }
  }
}

function formatTimestamp(value: string | null): string {
  return value ? format(new Date(value), 'MMM d, HH:mm') : '—'
}

function buildMailboxPayload(form: MailboxFormState, currentMailbox?: Mailbox | null): CreateMailboxRequest {
  const pollInterval = Math.min(86_400, Math.max(30, parseInt(form.pollIntervalSeconds, 10) || 60))

  return {
    name: form.name.trim(),
    displayName: form.displayName.trim() || null,
    address: form.address.trim(),
    providerType: 'IMAP',
    inboundMode: 'POLLING',
    outboundMode: 'SMTP',
    isActive: currentMailbox?.isActive ?? true,
    imapHost: form.imapHost.trim(),
    imapPort: parseInt(form.imapPort, 10) || 993,
    imapUsername: form.imapUsername.trim(),
    imapPassword: form.imapPassword.trim() || null,
    imapUseSsl: form.imapUseSsl,
    imapFolder: form.imapFolder.trim() || 'INBOX',
    pollingEnabled: form.pollingEnabled,
    pollIntervalSeconds: pollInterval,
    initialSyncStrategy: form.initialSyncStrategy,
    smtpHost: form.useCustomSmtp ? (form.smtpHost.trim() || null) : null,
    smtpPort: form.useCustomSmtp ? (parseInt(form.smtpPort, 10) || 587) : null,
    smtpUsername: form.useCustomSmtp ? (form.smtpUsername.trim() || null) : null,
    smtpPassword: form.useCustomSmtp ? (form.smtpPassword.trim() || null) : null,
    smtpUseSsl: form.useCustomSmtp ? form.smtpUseSsl : null,
    defaultGroupId: form.defaultGroupId ? Number(form.defaultGroupId) : null,
    defaultPriority: form.defaultPriority || null,
  }
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
    ].some((value) => value.toLowerCase().includes(query))
  })

  const currentConnectionResult = editingMailbox ? connectionResults[editingMailbox.id] : undefined
  const currentImapTestResult = getConnectionTestResult(currentConnectionResult, 'imap')
  const currentSmtpTestResult = getConnectionTestResult(currentConnectionResult, 'smtp')
  const smtpTestAvailable = Boolean(editingMailbox?.smtpHost || editingMailbox?.smtpPort || editingMailbox?.smtpUsername)
  const selectedInitialSyncOption = INITIAL_SYNC_OPTIONS.find((option) => option.value === normalizeInitialSyncStrategy(form.initialSyncStrategy))

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingMailbox(null)
    setModalMode('create')
  }

  const openEdit = (mailbox: Mailbox) => {
    setForm({
      name: mailbox.name,
      address: mailbox.address,
      displayName: mailbox.displayName ?? '',
      imapHost: mailbox.imapHost ?? '',
      imapPort: String(mailbox.imapPort ?? 993),
      imapUsername: mailbox.imapUsername ?? '',
      imapPassword: '',
      imapFolder: mailbox.imapFolder ?? 'INBOX',
      imapUseSsl: mailbox.imapUseSsl ?? true,
      pollingEnabled: mailbox.pollingEnabled,
      pollIntervalSeconds: String(mailbox.pollIntervalSeconds),
      initialSyncStrategy: normalizeInitialSyncStrategy(mailbox.initialSyncStrategy) ?? 'NEW_MESSAGES_ONLY',
      useCustomSmtp: Boolean(mailbox.smtpHost || mailbox.smtpPort || mailbox.smtpUsername),
      smtpHost: mailbox.smtpHost ?? '',
      smtpPort: String(mailbox.smtpPort ?? 587),
      smtpUsername: mailbox.smtpUsername ?? '',
      smtpPassword: '',
      smtpUseSsl: mailbox.smtpUseSsl ?? true,
      defaultGroupId: mailbox.defaultGroupId ?? '',
      defaultPriority: mailbox.defaultPriority?.toString() ?? '',
    })
    setEditingMailbox(mailbox)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingMailbox(null)
    setForm(EMPTY_FORM)
  }

  const executeSave = async () => {
    const requiresImapPassword = modalMode === 'create'
    const requiresSmtpPassword = modalMode === 'create' && form.useCustomSmtp

    if (!form.name.trim() || !form.address.trim() || !form.imapHost.trim() || !form.imapUsername.trim()) return
    if (requiresImapPassword && !form.imapPassword.trim()) return
    if (form.useCustomSmtp && (!form.smtpHost.trim() || !form.smtpUsername.trim())) return
    if (requiresSmtpPassword && !form.smtpPassword.trim()) return

    setSaving(true)
    try {
      const payload = buildMailboxPayload(form, editingMailbox)

      if (modalMode === 'create') {
        await mailboxService.create(payload)
        success('Mailbox created')
      } else if (editingMailbox) {
        await mailboxService.update(editingMailbox.id, payload as UpdateMailboxRequest)
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
          <p className="text-sm text-gray-500 mt-0.5">{filteredMailboxes.length} mailbox{filteredMailboxes.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          New Mailbox
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search mailboxes…"
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
        <select
          value={filters.pollingEnabled === undefined ? '' : String(filters.pollingEnabled)}
          onChange={(event) => setFilters((current) => ({
            ...current,
            pollingEnabled: event.target.value === '' ? undefined : event.target.value === 'true',
            page: 0,
          }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Polling</option>
          <option value="true">Polling On</option>
          <option value="false">Polling Off</option>
        </select>
        <select
          value={filters.pollingStatus ?? ''}
          onChange={(event) => setFilters((current) => ({ ...current, pollingStatus: event.target.value || undefined, page: 0 }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Poll Status</option>
          {POLLING_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
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
                  return (
                    <tr key={mailbox.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{mailbox.name}</div>
                        {mailbox.displayName && <div className="text-xs text-gray-400">{mailbox.displayName}</div>}
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
                          </>
                        ) : (
                          <span className="text-gray-400">Default / not mailbox-specific</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {mailbox.pollingEnabled ? (
                          <div className="space-y-1">
                            <Badge variant={pollingBadge(mailbox.pollingStatus).variant} size="sm">{pollingBadge(mailbox.pollingStatus).label}</Badge>
                            <div className="text-xs text-gray-500">Every {mailbox.pollIntervalSeconds}s</div>
                          </div>
                        ) : (
                          <Badge variant="default" size="sm">Off</Badge>
                        )}
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
        title={modalMode === 'create' ? 'New Mailbox' : `Edit — ${editingMailbox?.name ?? ''}`}
        size="lg"
      >
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email Address *</label>
              <input
                type="email"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                disabled={modalMode === 'edit'}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
            <input
              value={form.displayName}
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">IMAP Polling</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Host *</label>
                <input
                  value={form.imapHost}
                  onChange={(event) => setForm((current) => ({ ...current, imapHost: event.target.value }))}
                  placeholder="imap.example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Port</label>
                <input
                  type="number"
                  value={form.imapPort}
                  onChange={(event) => setForm((current) => ({ ...current, imapPort: event.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Username *</label>
                <input
                  value={form.imapUsername}
                  onChange={(event) => setForm((current) => ({ ...current, imapUsername: event.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Password{modalMode === 'create' ? ' *' : ''}</label>
                <input
                  type="password"
                  value={form.imapPassword}
                  onChange={(event) => setForm((current) => ({ ...current, imapPassword: event.target.value }))}
                  placeholder={modalMode === 'create' ? 'IMAP password' : 'Leave blank to keep existing password'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Folder</label>
                <input
                  value={form.imapFolder}
                  onChange={(event) => setForm((current) => ({ ...current, imapFolder: event.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.imapUseSsl}
                onChange={(event) => setForm((current) => ({ ...current, imapUseSsl: event.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Use SSL/TLS for IMAP
            </label>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Polling</h3>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pollingEnabled}
                  onChange={(event) => setForm((current) => ({ ...current, pollingEnabled: event.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Polling Enabled
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">Interval (sec)</label>
                <input
                  type="number"
                  min="30"
                  max="86400"
                  value={form.pollIntervalSeconds}
                  onChange={(event) => setForm((current) => ({ ...current, pollIntervalSeconds: event.target.value }))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">Initial Sync</label>
                <select
                  value={form.initialSyncStrategy}
                  onChange={(event) => setForm((current) => ({ ...current, initialSyncStrategy: event.target.value as MailboxFormState['initialSyncStrategy'] }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {INITIAL_SYNC_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
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
              Saving stores mailbox configuration only. Activation and inbound polling remain separate controls. IMAP and SMTP tests are separate checks and IMAP success alone does not confirm outbound send health.
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SMTP Delivery</h3>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.useCustomSmtp}
                  onChange={(event) => setForm((current) => ({ ...current, useCustomSmtp: event.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Use mailbox-specific SMTP
              </label>
            </div>

            {form.useCustomSmtp ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host *</label>
                  <input
                    value={form.smtpHost}
                    onChange={(event) => setForm((current) => ({ ...current, smtpHost: event.target.value }))}
                    placeholder="smtp.example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Port</label>
                  <input
                    type="number"
                    value={form.smtpPort}
                    onChange={(event) => setForm((current) => ({ ...current, smtpPort: event.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Username *</label>
                  <input
                    value={form.smtpUsername}
                    onChange={(event) => setForm((current) => ({ ...current, smtpUsername: event.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Password{modalMode === 'create' ? ' *' : ''}</label>
                  <input
                    type="password"
                    value={form.smtpPassword}
                    onChange={(event) => setForm((current) => ({ ...current, smtpPassword: event.target.value }))}
                    placeholder={modalMode === 'create' ? 'SMTP password' : 'Leave blank to keep existing password'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.smtpUseSsl}
                    onChange={(event) => setForm((current) => ({ ...current, smtpUseSsl: event.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Use STARTTLS / SSL
                </label>
              </div>
            ) : (
              <p className="text-xs text-gray-500">SMTP fields stay hidden unless this mailbox uses mailbox-specific outbound delivery.</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Defaults</h3>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Default Group ID</label>
                <input
                  value={form.defaultGroupId}
                  onChange={(event) => setForm((current) => ({ ...current, defaultGroupId: event.target.value }))}
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Default Priority</label>
                <input
                  value={form.defaultPriority}
                  onChange={(event) => setForm((current) => ({ ...current, defaultPriority: event.target.value }))}
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
              <Button variant="ghost" size="sm" leftIcon={<PlugZap size={14} />} onClick={handleTestImapConnection} isLoading={testingConnection.imap}>
                Test IMAP Connection
              </Button>
            )}
            {editingMailbox && (
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
            )}
            <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={saving}
              disabled={
                !form.name.trim()
                || !form.address.trim()
                || !form.imapHost.trim()
                || !form.imapUsername.trim()
                || (modalMode === 'create' && !form.imapPassword.trim())
                || (form.useCustomSmtp && !form.smtpHost.trim())
                || (form.useCustomSmtp && !form.smtpUsername.trim())
              }
            >
              {modalMode === 'create' ? 'Create' : 'Save'}
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
