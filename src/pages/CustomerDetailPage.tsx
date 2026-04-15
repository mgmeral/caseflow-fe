import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useActivateCustomer,
  useCustomerDetail,
  useCustomerTickets,
  useDeactivateCustomer,
  useDeleteCustomer,
  useUpdateCustomer,
} from '@/hooks/useCustomers'
import { useCustomerReport } from '@/hooks/useReports'
import {
  useCreateCustomerRoutingRule,
  useCustomerEmailSettings,
  useCustomerRoutingRules,
  useDeactivateCustomerRoutingRule,
  useDeleteCustomerRoutingRule,
  useUpdateCustomerRoutingRule,
  useUpsertCustomerEmailSettings,
} from '@/hooks/useCustomerEmailSettings'
import { useMailboxes } from '@/hooks/useMailboxes'
import { useGroupsQuery } from '@/hooks/useUsers'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { exportCustomerReportPdf } from '@/lib/reportPdf'
import type {
  UpdateCustomerRequest,
  UpsertCustomerEmailSettingsRequest,
  UpsertCustomerEmailRoutingRuleRequest,
} from '@/types/api.types'
import type { CustomerEmailRoutingRule } from '@/types/email.types'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { ColorField, normalizeOptionalHexColor } from '@/components/shared/ColorField'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  ArrowLeft, Ticket, Mail, Settings, Plus, Pencil, Trash2,
  ToggleLeft, ToggleRight, Save, Globe, AtSign, BarChart2, Download,
} from 'lucide-react'
import { format } from 'date-fns'
import { ReportDateFilter } from '@/components/reports/ReportDateFilter'
import { buildReportDateRange, type ReportDateRange } from '@/lib/reportDateRange'

const UNKNOWN_SENDER_POLICIES = ['MANUAL_REVIEW', 'IGNORE', 'REJECT'] as const

function getRoutingRuleTypeLabel(type: CustomerEmailRoutingRule['senderMatchType']) {
  return type === 'EXACT_EMAIL' ? 'Exact Email' : 'Domain'
}

function getRoutingRuleAllowSubdomains(rule: CustomerEmailRoutingRule, inheritedAllowSubdomains: boolean | null) {
  if (rule.allowSubdomains != null) return rule.allowSubdomains ? 'Yes' : 'No'
  if (rule.senderMatchType === 'DOMAIN_SUFFIX') return inheritedAllowSubdomains ? 'Yes' : 'No'
  return '—'
}

function formatCustomerTimestamp(value: string | null | undefined, pattern: string) {
  return value ? format(new Date(value), pattern) : '—'
}

function CustomerColorDot({ colorHex, size = 'md' }: { colorHex: string | null; size?: 'sm' | 'md' }) {
  return (
    <span
      className={size === 'sm' ? 'h-3 w-3 rounded-full border border-gray-200' : 'h-4 w-4 rounded-full border border-gray-200'}
      style={{ backgroundColor: colorHex ?? '#e5e7eb' }}
      aria-hidden="true"
    />
  )
}

export function CustomerDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const { canManageEmailConfig, canViewEmailConfig, canExport } = usePermissions()

  const [customerReportRange, setCustomerReportRange] = useState<ReportDateRange>(() => buildReportDateRange('last30'))
  const { customer, isLoading } = useCustomerDetail(id)
  const { tickets, isLoading: ticketsLoading } = useCustomerTickets(id)
  const {
    data: customerReport,
    isLoading: customerReportLoading,
    isError: customerReportError,
    error: customerReportQueryError,
  } = useCustomerReport(id, {
    dateFrom: customerReportRange.dateFrom,
    dateTo: customerReportRange.dateTo,
  })
  const { data: emailSettings, isLoading: settingsLoading } = useCustomerEmailSettings(id)
  const { data: routingRules = [], isLoading: rulesLoading } = useCustomerRoutingRules(id)
  const updateCustomer = useUpdateCustomer()
  const activateCustomer = useActivateCustomer()
  const deactivateCustomer = useDeactivateCustomer()
  const deleteCustomer = useDeleteCustomer()
  const upsertSettings = useUpsertCustomerEmailSettings(id)
  const createRule = useCreateCustomerRoutingRule(id)
  const updateRule = useUpdateCustomerRoutingRule(id)
  const deactivateRule = useDeactivateCustomerRoutingRule(id)
  const deleteRule = useDeleteCustomerRoutingRule(id)
  const { data: mailboxData } = useMailboxes()
  const { data: groups = [] } = useGroupsQuery()
  const mailboxes = mailboxData?.items ?? []

  // Tab state
  type TabId = 'overview' | 'email' | 'report' | 'tickets'
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Email settings form
  type SettingsFormState = UpsertCustomerEmailSettingsRequest & { defaultStatus?: string | null }
  const [settingsForm, setSettingsForm] = useState<SettingsFormState | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  // Routing rule modal
  const [ruleModal, setRuleModal] = useState<'create' | 'edit' | null>(null)
  const [editingRule, setEditingRule] = useState<CustomerEmailRoutingRule | null>(null)
  const [ruleForm, setRuleForm] = useState<UpsertCustomerEmailRoutingRuleRequest>({
    senderMatchType: 'EXACT_EMAIL',
    senderMatchValue: '',
    recipientMailboxId: null,
    priority: 10,
    isActive: true,
    notes: null,
  })
  const [savingRule, setSavingRule] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [showDeleteCustomerConfirm, setShowDeleteCustomerConfirm] = useState(false)
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerCode, setCustomerCode] = useState('')
  const [customerColorHex, setCustomerColorHex] = useState('')

  const supportsDefaultStatus = emailSettings != null && Object.prototype.hasOwnProperty.call(emailSettings, 'defaultStatus')

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="surface-card p-6">
          <table className="w-full"><tbody><SkeletonRow colCount={3} /></tbody></table>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="page-shell">
        <div className="surface-card p-6">
        <EmptyState title="Customer not found" description="This customer doesn't exist." />
        </div>
      </div>
    )
  }

  const normalizedCustomerCode = customerCode.trim().toUpperCase()
  const normalizedCustomerColorHex = normalizeOptionalHexColor(customerColorHex)
  const isCustomerColorValid = !customerColorHex.trim() || Boolean(normalizedCustomerColorHex)
  const canSaveCustomer = customerName.trim().length >= 2 && normalizedCustomerCode.length >= 2 && isCustomerColorValid

  const openEditCustomer = () => {
    setCustomerName(customer.name)
    setCustomerCode(customer.code)
    setCustomerColorHex(customer.colorHex ?? '')
    setIsEditCustomerOpen(true)
  }

  const closeEditCustomer = () => {
    setIsEditCustomerOpen(false)
    setCustomerName('')
    setCustomerCode('')
    setCustomerColorHex('')
  }

  const handleSaveCustomer = async () => {
    if (!canSaveCustomer) return

    const payload: UpdateCustomerRequest = {
      name: customerName.trim(),
      code: normalizedCustomerCode,
      colorHex: normalizedCustomerColorHex,
    }

    try {
      await updateCustomer.mutateAsync({ id, payload })
      success('Customer updated')
      closeEditCustomer()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update customer')
    }
  }

  const handleToggleCustomerStatus = async () => {
    try {
      if (customer.isActive) {
        await deactivateCustomer.mutateAsync(id)
        success('Customer deactivated')
      } else {
        await activateCustomer.mutateAsync(id)
        success('Customer activated')
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update customer status')
    }
  }

  // --- email settings handlers ---
  const beginEditSettings = () => {
    const settingsWithStatus = emailSettings as (typeof emailSettings & { defaultStatus?: string | null }) | null
    setSettingsForm(emailSettings
      ? {
          isEnabled: emailSettings.isEnabled,
          allowSubdomains: emailSettings.allowSubdomains,
          unknownSenderPolicy: UNKNOWN_SENDER_POLICIES.includes(emailSettings.unknownSenderPolicy as (typeof UNKNOWN_SENDER_POLICIES)[number])
            ? emailSettings.unknownSenderPolicy
            : 'MANUAL_REVIEW',
          defaultGroupId: emailSettings.defaultGroupId,
          defaultPriority: emailSettings.defaultPriority?.toString() ?? null,
          ...(supportsDefaultStatus ? { defaultStatus: settingsWithStatus?.defaultStatus ?? null } : {}),
        }
      : {
          isEnabled: true,
          allowSubdomains: false,
          unknownSenderPolicy: 'MANUAL_REVIEW',
          defaultGroupId: null,
          defaultPriority: null,
          ...(supportsDefaultStatus ? { defaultStatus: null } : {}),
        })
  }

  const handleDeleteCustomer = async () => {
    try {
      await deleteCustomer.mutateAsync(id)
      success('Customer deleted')
      navigate('/customers')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete customer')
    } finally {
      setShowDeleteCustomerConfirm(false)
    }
  }

  const handleExportCustomerReport = async () => {
    if (!customerReport || customerReportLoading || customerReportError) return

    try {
      await exportCustomerReportPdf({
        customerName: customer.name,
        report: customerReport,
        range: customerReportRange,
      })
      success('Customer report PDF exported.')
    } catch (exportError) {
      showError(getErrorMessage(exportError, 'Customer report PDF could not be exported.'))
    }
  }

  const handleSaveSettings = async () => {
    if (!settingsForm) return
    setSavingSettings(true)
    try {
      const payload: UpsertCustomerEmailSettingsRequest & { defaultStatus?: string | null } = {
        isEnabled: settingsForm.isEnabled,
        allowSubdomains: settingsForm.allowSubdomains,
        unknownSenderPolicy: settingsForm.unknownSenderPolicy,
        defaultGroupId: settingsForm.defaultGroupId,
        defaultPriority: settingsForm.defaultPriority,
      }
      if (supportsDefaultStatus) {
        payload.defaultStatus = settingsForm.defaultStatus ?? null
      }
      await upsertSettings.mutateAsync(payload)
      setSettingsForm(null)
      success('Email settings saved')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  // --- routing rule handlers ---
  const openCreateRule = () => {
    setRuleForm({ senderMatchType: 'EXACT_EMAIL', senderMatchValue: '', recipientMailboxId: null, priority: 10, isActive: true, notes: null })
    setEditingRule(null)
    setRuleModal('create')
  }

  const openEditRule = (rule: CustomerEmailRoutingRule) => {
    setRuleForm({
      senderMatchType: rule.senderMatchType,
      senderMatchValue: rule.senderMatchValue,
      recipientMailboxId: rule.recipientMailboxId,
      priority: rule.priority,
      isActive: rule.isActive,
      notes: rule.notes,
    })
    setEditingRule(rule)
    setRuleModal('edit')
  }

  const isValidMatchValue = (() => {
    const v = ruleForm.senderMatchValue.trim().toLowerCase()
    if (!v) return false
    if (ruleForm.senderMatchType === 'EXACT_EMAIL') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    if (ruleForm.senderMatchType === 'DOMAIN_SUFFIX') return /^@?[a-z0-9]([a-z0-9-]*\.)+[a-z]{2,}$/i.test(v)
    return true
  })()

  const handleSaveRule = async () => {
    if (!isValidMatchValue) return
    setSavingRule(true)
    try {
      const payload: UpsertCustomerEmailRoutingRuleRequest = {
        ...ruleForm,
        senderMatchValue: ruleForm.senderMatchValue.trim().toLowerCase(),
      }
      if (ruleModal === 'create') {
        await createRule.mutateAsync(payload)
        success('Routing rule created')
      } else if (editingRule) {
        await updateRule.mutateAsync({ ruleId: editingRule.id, payload })
        success('Routing rule updated')
      }
      setRuleModal(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save rule')
    } finally {
      setSavingRule(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRule.mutateAsync(ruleId)
      success('Rule deleted')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete rule')
    } finally {
      setDeletingRuleId(null)
    }
  }

  const handleToggleRule = async (rule: CustomerEmailRoutingRule) => {
    try {
      if (rule.isActive) {
        await deactivateRule.mutateAsync(rule.id)
        success('Rule deactivated')
      } else {
        await updateRule.mutateAsync({ ruleId: rule.id, payload: {
          senderMatchType: rule.senderMatchType,
          senderMatchValue: rule.senderMatchValue,
          recipientMailboxId: rule.recipientMailboxId,
          priority: rule.priority,
          isActive: true,
          notes: rule.notes,
        } })
        success('Rule activated')
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Toggle failed')
    }
  }

  const showEmailTab = canViewEmailConfig || canManageEmailConfig
  const activeRoutingRules = routingRules.filter((rule) => rule.isActive)

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    ...(showEmailTab ? [{ id: 'email' as const, label: 'Email Settings' }] : []),
    { id: 'report' as const, label: 'Report' },
    { id: 'tickets' as const, label: 'Tickets' },
  ]

  return (
    <div className="page-shell">
      <button
        onClick={() => navigate('/customers')}
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 text-sm text-gray-500 transition-colors hover:border-[#d5e2ff] hover:bg-[#eef5ff] hover:text-[#1258e3]"
      >
        <ArrowLeft size={14} />
        Back to Customers
      </button>

      {/* Header */}
      <div className="surface-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <CustomerColorDot colorHex={customer.colorHex} />
              <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
              <Badge variant="outline" size="sm">{customer.code}</Badge>
              {customer.colorHex ? <span className="text-xs font-mono text-gray-400">{customer.colorHex}</span> : null}
              {customer.isActive
                ? <Badge variant="success" size="sm">Active</Badge>
                : <Badge variant="default" size="sm">Inactive</Badge>}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Created {formatCustomerTimestamp(customer.createdAt, 'MMM d, yyyy')}
              {customer.updatedAt && ` · Updated ${formatCustomerTimestamp(customer.updatedAt, 'MMM d, yyyy')}`}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {showEmailTab && emailSettings && (
              <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${emailSettings.isEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <Mail size={12} />
                Email {emailSettings.isEnabled ? 'Enabled' : 'Disabled'}
              </div>
            )}
            {routingRules.length > 0 && showEmailTab && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                <Globe size={12} />
                {activeRoutingRules.length} routing rule{activeRoutingRules.length !== 1 ? 's' : ''}
              </div>
            )}
            <Button variant="secondary" size="sm" leftIcon={<Pencil size={12} />} onClick={openEditCustomer}>
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={customer.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
              onClick={handleToggleCustomerStatus}
              isLoading={activateCustomer.isPending || deactivateCustomer.isPending}
            >
              {customer.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button variant="danger" size="sm" leftIcon={<Trash2 size={12} />} onClick={() => setShowDeleteCustomerConfirm(true)}>
              Delete Customer
            </Button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="surface-tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`surface-tab ${
              activeTab === tab.id
                ? 'surface-tab-active'
                : ''
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer info card */}
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Customer Information</h2>
            <div className="space-y-3 text-sm">
              <InfoRow label="Customer ID" value={customer.id} />
              <InfoRow label="Code" value={customer.code} />
              <InfoRow label="Color" value={customer.colorHex ?? '—'} />
              <InfoRow label="Status" value={customer.isActive ? 'Active' : 'Inactive'} />
              <InfoRow label="Created" value={formatCustomerTimestamp(customer.createdAt, 'dd MMM yyyy, HH:mm')} />
              <InfoRow label="Last Updated" value={formatCustomerTimestamp(customer.updatedAt, 'dd MMM yyyy, HH:mm')} />
            </div>
          </div>

          {/* Email routing summary card */}
          {showEmailTab && (
            <div className="surface-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Email Routing</h2>
                <button onClick={() => setActiveTab('email')} className="rounded-full border border-[#d6e3ff] bg-[#eef5ff] px-3 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-[#e4efff]">Manage</button>
              </div>
              {settingsLoading ? (
                <SkeletonRow colCount={2} />
              ) : !emailSettings ? (
                <p className="text-sm text-gray-400">Not configured yet.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <InfoRow label="Email Integration" value={emailSettings.isEnabled ? 'Enabled' : 'Disabled'} />
                  <InfoRow label="Unknown Sender Policy" value={emailSettings.unknownSenderPolicy.replace(/_/g, ' ')} />
                  <InfoRow label="Allow Subdomains" value={emailSettings.allowSubdomains ? 'Yes' : 'No'} />
                  <InfoRow label="Default Group" value={emailSettings.defaultGroupName ?? '—'} />
                  {supportsDefaultStatus && (
                    <InfoRow
                      label="Default Status"
                      value={((emailSettings as unknown as { defaultStatus?: string | null }).defaultStatus ?? '—').toString()}
                    />
                  )}
                  {routingRules.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Sender Patterns ({activeRoutingRules.length} active)</div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeRoutingRules.slice(0, 5).map((r) => (
                          <span key={r.id} className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(240,245,255,0.8)_100%)] px-2.5 py-1 text-xs font-mono text-gray-700 shadow-soft">
                            {r.senderMatchType === 'DOMAIN_SUFFIX' ? <Globe size={10} /> : <AtSign size={10} />}
                            {r.senderMatchValue}
                          </span>
                        ))}
                        {activeRoutingRules.length > 5 && (
                          <span className="text-xs text-gray-400">+{activeRoutingRules.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent tickets card */}
          <div className="surface-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Recent Tickets</h2>
              <button onClick={() => setActiveTab('tickets')} className="rounded-full border border-[#d6e3ff] bg-[#eef5ff] px-3 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-[#e4efff]">View all</button>
            </div>
            {ticketsLoading ? (
              <SkeletonRow colCount={4} />
            ) : tickets.length === 0 ? (
              <p className="text-sm text-gray-400">No tickets found.</p>
            ) : (
              <div className="space-y-2">
                {tickets.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-white/80 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(243,247,255,0.74)_100%)] hover:shadow-soft"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-gray-400 shrink-0">{t.ticketNo}</span>
                      <span className="text-sm text-gray-800 truncate">{t.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <TicketStatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="space-y-6">
          <ReportDateFilter
            compact
            value={customerReportRange}
            onChange={setCustomerReportRange}
            actions={canExport ? (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download size={14} />}
                onClick={handleExportCustomerReport}
                disabled={customerReportLoading || customerReportError || !customerReport}
              >
                Export PDF
              </Button>
            ) : null}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportStatCard label="Total" value={customerReport?.totalCount ?? 0} isLoading={customerReportLoading} />
            <ReportStatCard label="Open" value={customerReport?.openCount ?? 0} isLoading={customerReportLoading} />
            <ReportStatCard label="Resolved" value={customerReport?.resolvedCount ?? 0} isLoading={customerReportLoading} />
            <ReportStatCard label="Waiting Customer" value={customerReport?.waitingCustomerCount ?? 0} isLoading={customerReportLoading} />
          </div>

          <div className="table-shell overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Customer Report</h2>
            </div>
            {customerReportLoading ? (
              <div className="p-5">
                <table className="w-full">
                  <tbody>
                    <SkeletonRow colCount={3} />
                  </tbody>
                </table>
              </div>
            ) : customerReportError ? (
              <div className="p-5 text-sm text-amber-700">{getErrorMessage(customerReportQueryError, 'Failed to load customer report.')}</div>
            ) : !customerReport ? (
              <div className="p-5 text-sm text-gray-400">No report data available.</div>
            ) : customerReport.totalCount === 0 && customerReport.byTag.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">No customer report data was returned for the selected date range.</div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <InfoRow label="Closed" value={String(customerReport.closedCount)} />
                  <InfoRow label="New" value={String(customerReport.newCount)} />
                  <InfoRow label="In Progress" value={String(customerReport.inProgressCount)} />
                  <InfoRow label="Reopened" value={String(customerReport.reopenedCount)} />
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Tag Breakdown</div>
                  {customerReport.byTag.length === 0 ? (
                    <p className="text-sm text-gray-400">No tag breakdown returned by the backend.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerReport.byTag.map((item) => (
                        <div key={`${item.tagId}:${item.tagCode}`} className="flex items-center justify-between rounded-xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(243,247,255,0.74)_100%)] px-3 py-2 text-sm shadow-soft">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.tagColor ?? '#94a3b8' }} />
                            <span className="truncate text-gray-800">{item.tagName}</span>
                          </div>
                          <span className="font-medium text-gray-700">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Settings tab */}
      {activeTab === 'email' && showEmailTab && (
        <div className="space-y-6">
          {/* Email Settings card */}
          <div className="surface-card">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Settings size={14} className="text-gray-400" />
                Email Settings
              </span>
              {canManageEmailConfig && settingsForm === null && (
                <Button variant="secondary" size="sm" leftIcon={<Pencil size={12} />} onClick={beginEditSettings}>
                  Edit
                </Button>
              )}
            </div>

            {settingsLoading ? (
              <div className="p-4"><SkeletonRow colCount={3} /></div>
            ) : settingsForm === null ? (
              <div className="px-5 py-4 space-y-3 text-sm">
                <InfoRow label="Email Integration" value={emailSettings?.isEnabled ? 'Enabled' : 'Disabled'} />
                <InfoRow label="Unknown Sender Policy" value={emailSettings?.unknownSenderPolicy?.replace(/_/g, ' ') ?? '—'} />
                <InfoRow label="Allow Subdomains" value={emailSettings?.allowSubdomains ? 'Yes' : 'No'} />
                <InfoRow label="Default Group" value={emailSettings?.defaultGroupName ?? '—'} />
                <InfoRow label="Default Priority" value={emailSettings?.defaultPriority?.toString() ?? '—'} />
                {supportsDefaultStatus && (
                  <InfoRow
                    label="Default Status"
                    value={((emailSettings as unknown as { defaultStatus?: string | null })?.defaultStatus ?? '—').toString()}
                  />
                )}
                {!supportsDefaultStatus && (
                  <p className="text-xs text-gray-400 italic">Default status is not supported by the current backend contract.</p>
                )}
                {!emailSettings && (
                  <p className="text-xs text-gray-400 italic">No email settings configured. Click Edit to set up.</p>
                )}
              </div>
            ) : (
              <div className="px-5 py-4 space-y-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.isEnabled}
                    onChange={(e) => setSettingsForm((f) => f && ({ ...f, isEnabled: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  Email Integration Enabled
                </label>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unknown Sender Policy</label>
                  <select
                    value={settingsForm.unknownSenderPolicy}
                    onChange={(e) => setSettingsForm((f) => f && ({ ...f, unknownSenderPolicy: e.target.value }))}
                    className="ui-select"
                  >
                    {UNKNOWN_SENDER_POLICIES.map((p) => (
                      <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.allowSubdomains}
                    onChange={(e) => setSettingsForm((f) => f && ({ ...f, allowSubdomains: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  Allow Subdomains
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Default Group</label>
                    <select
                      value={settingsForm.defaultGroupId ?? ''}
                      onChange={(e) => setSettingsForm((f) => f && ({ ...f, defaultGroupId: e.target.value || null }))}
                      className="ui-select"
                    >
                      <option value="">— None —</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Default Priority</label>
                    <input
                      value={settingsForm.defaultPriority ?? ''}
                      onChange={(e) => setSettingsForm((f) => f && ({ ...f, defaultPriority: e.target.value || null }))}
                      placeholder="Optional"
                      className="ui-input"
                    />
                  </div>
                </div>

                {supportsDefaultStatus && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Default Status</label>
                    <input
                      value={settingsForm.defaultStatus ?? ''}
                      onChange={(e) => setSettingsForm((f) => f && ({ ...f, defaultStatus: e.target.value || null }))}
                      placeholder="Optional"
                      className="ui-input"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setSettingsForm(null)}>Cancel</Button>
                  <Button variant="primary" size="sm" leftIcon={<Save size={12} />} onClick={handleSaveSettings} isLoading={savingSettings}>
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sender Patterns / Routing Rules */}
          <div className="table-shell">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div>
                <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Globe size={14} className="text-gray-400" />
                  Sender Patterns & Routing Rules
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Define which sender emails and domains belong to this customer. Inbound mail matching these patterns routes to this customer.
                </p>
              </div>
              {canManageEmailConfig && (
                <Button variant="secondary" size="sm" leftIcon={<Plus size={12} />} onClick={openCreateRule}>
                  Add Rule
                </Button>
              )}
            </div>

            {rulesLoading ? (
              <div className="p-4"><SkeletonRow colCount={5} /></div>
            ) : routingRules.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={<Mail className="w-6 h-6 text-gray-400" />}
                  title="No routing rules"
                  description="Add sender patterns (e.g. @akbank.com) so inbound email from this customer is routed correctly."
                  action={canManageEmailConfig ? { label: 'Add Sender Pattern', onClick: openCreateRule } : undefined}
                />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.8)_0%,rgba(243,247,255,0.72)_100%)]">
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Type</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Pattern</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Subdomains</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Mailbox</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Priority</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Status</th>
                    {canManageEmailConfig && <th className="px-4 py-2 text-right font-semibold text-gray-600 text-xs">Actions</th>}
                  </tr>
                </thead>
                <tbody className="table-body-striped divide-y divide-white/70">
                  {routingRules.map((rule) => (
                    <tr key={rule.id} className="transition-colors hover:bg-[linear-gradient(90deg,rgba(31,111,255,0.05)_0%,transparent_55%)]">
                      <td className="px-4 py-2">
                        <Badge variant={rule.senderMatchType === 'EXACT_EMAIL' ? 'info' : 'default'} size="sm">
                          {getRoutingRuleTypeLabel(rule.senderMatchType)}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">{rule.senderMatchValue}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs">{getRoutingRuleAllowSubdomains(rule, emailSettings?.allowSubdomains ?? null)}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs">{rule.recipientMailboxName ?? '—'}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs">{rule.priority}</td>
                      <td className="px-4 py-2">
                        {rule.isActive
                          ? <Badge variant="success" size="sm">Active</Badge>
                          : <Badge variant="default" size="sm">Inactive</Badge>}
                      </td>
                      {canManageEmailConfig && (
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditRule(rule)} className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-[#eef5ff] hover:text-indigo-600" title="Edit"><Pencil size={13} /></button>
                            <button onClick={() => handleToggleRule(rule)} className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-[#eef5ff]" title={rule.isActive ? 'Deactivate' : 'Activate'}>
                              {rule.isActive ? <ToggleRight size={13} className="text-green-500" /> : <ToggleLeft size={13} />}
                            </button>
                            <button onClick={() => setDeletingRuleId(rule.id)} className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tickets tab */}
      {activeTab === 'tickets' && (
        <div className="table-shell overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Tickets</h2>
          </div>

          {ticketsLoading ? (
            <table className="w-full"><tbody><SkeletonRow colCount={5} /></tbody></table>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={<Ticket className="w-8 h-8 text-gray-400" />}
              title="No tickets"
              description="No tickets found for this customer."
              action={{ label: 'Go to Ticket List', onClick: () => navigate('/tickets') }}
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.8)_0%,rgba(243,247,255,0.72)_100%)]">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Subject</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Priority</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Updated</th>
                </tr>
              </thead>
              <tbody className="table-body-striped divide-y divide-white/70">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="cursor-pointer transition-colors hover:bg-[linear-gradient(90deg,rgba(31,111,255,0.05)_0%,transparent_55%)]"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{t.ticketNo}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800 truncate max-w-xs">{t.subject}</td>
                    <td className="px-4 py-2.5"><TicketStatusBadge status={t.status} /></td>
                    <td className="px-4 py-2.5"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{format(new Date(t.updatedAt), 'dd MMM, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal
        isOpen={isEditCustomerOpen}
        onClose={closeEditCustomer}
        title="Edit Customer"
        size="md"
      >
        <div className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="e.g. Akbank"
              className="ui-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Code *</label>
            <input
              value={customerCode}
              onChange={(event) => setCustomerCode(event.target.value.toUpperCase())}
              placeholder="e.g. AKBANK"
              className="ui-input font-mono uppercase"
            />
          </div>
          <ColorField value={customerColorHex} onChange={setCustomerColorHex} label="Customer Color" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={closeEditCustomer}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveCustomer} isLoading={updateCustomer.isPending} disabled={!canSaveCustomer}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Routing rule modal */}
      <Modal
        isOpen={ruleModal !== null}
        onClose={() => setRuleModal(null)}
        title={ruleModal === 'create' ? 'New Routing Rule' : `Edit Rule — ${editingRule?.senderMatchValue ?? ''}`}
      >
        <div className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sender Match Type</label>
            <select
              value={ruleForm.senderMatchType}
              onChange={(e) => setRuleForm((f) => ({ ...f, senderMatchType: e.target.value as 'EXACT_EMAIL' | 'DOMAIN_SUFFIX' }))}
              className="ui-select"
            >
              <option value="EXACT_EMAIL">Exact Email</option>
              <option value="DOMAIN_SUFFIX">Domain Suffix</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sender Match Value *</label>
            <input
              value={ruleForm.senderMatchValue}
              onChange={(e) => setRuleForm((f) => ({ ...f, senderMatchValue: e.target.value }))}
              placeholder={ruleForm.senderMatchType === 'EXACT_EMAIL' ? 'user@example.com' : '@example.com'}
              className="ui-input"
            />
            <p className="text-xs text-gray-400 mt-1">
              {ruleForm.senderMatchType === 'EXACT_EMAIL'
                ? 'Full email address (e.g. alerts@bank.com). Will be lowercased.'
                : 'Domain suffix including @ (e.g. @bank.com). Will be lowercased.'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Recipient Mailbox</label>
            <select
              value={ruleForm.recipientMailboxId ?? ''}
              onChange={(e) => setRuleForm((f) => ({ ...f, recipientMailboxId: e.target.value || null }))}
              className="ui-select"
            >
              <option value="">— Default —</option>
              {mailboxes.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.address})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
            <input
              type="number"
              min="0"
              value={ruleForm.priority}
              onChange={(e) => setRuleForm((f) => ({ ...f, priority: parseInt(e.target.value, 10) || 0 }))}
              className="ui-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={ruleForm.notes ?? ''}
              onChange={(e) => setRuleForm((f) => ({ ...f, notes: e.target.value || null }))}
              rows={2}
              placeholder="Optional notes…"
              className="ui-textarea"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={ruleForm.isActive ?? true} onChange={(e) => setRuleForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setRuleModal(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveRule} isLoading={savingRule} disabled={!isValidMatchValue}>
              {ruleModal === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete rule confirm */}
      <ConfirmModal
        isOpen={deletingRuleId !== null}
        onClose={() => setDeletingRuleId(null)}
        title="Delete Routing Rule"
        message="This routing rule will be permanently deleted. Continue?"
        confirmLabel="Delete"
        isDestructive
        onConfirm={() => deletingRuleId && handleDeleteRule(deletingRuleId)}
      />

      <ConfirmModal
        isOpen={showDeleteCustomerConfirm}
        onClose={() => setShowDeleteCustomerConfirm(false)}
        title="Delete Customer"
        message="This customer will be permanently deleted. Continue?"
        confirmLabel="Delete Customer"
        isDestructive
        isLoading={deleteCustomer.isPending}
        onConfirm={handleDeleteCustomer}
      />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-info-row">
      <span className="ui-info-row-label">{label}</span>
      <span className="ui-info-row-value">{value}</span>
    </div>
  )
}

function ReportStatCard({ label, value, isLoading }: { label: string; value: number; isLoading: boolean }) {
  return (
    <div className="premium-stat-card p-4">
      <div className="premium-stat-kicker text-xs tracking-wide">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{isLoading ? '...' : value}</div>
    </div>
  )
}
