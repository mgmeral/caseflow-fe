import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomerDetail, useCustomerTickets } from '@/hooks/useCustomers'
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
import type { UpsertCustomerEmailSettingsRequest, UpsertCustomerEmailRoutingRuleRequest } from '@/types/api.types'
import type { CustomerEmailRoutingRule } from '@/types/email.types'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  ArrowLeft, Ticket, Mail, Settings, Plus, Pencil, Trash2,
  ToggleLeft, ToggleRight, Save, Globe, AtSign,
} from 'lucide-react'
import { format } from 'date-fns'

const UNKNOWN_SENDER_POLICIES = ['MANUAL_REVIEW', 'CREATE_UNMATCHED_TICKET', 'IGNORE', 'REJECT'] as const

export function CustomerDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const { canManageEmailConfig, canViewEmailConfig } = usePermissions()

  const { customer, isLoading } = useCustomerDetail(id)
  const { tickets, isLoading: ticketsLoading } = useCustomerTickets(id)
  const { data: emailSettings, isLoading: settingsLoading } = useCustomerEmailSettings(id)
  const { data: routingRules = [], isLoading: rulesLoading } = useCustomerRoutingRules(id)
  const upsertSettings = useUpsertCustomerEmailSettings(id)
  const createRule = useCreateCustomerRoutingRule(id)
  const updateRule = useUpdateCustomerRoutingRule(id)
  const deactivateRule = useDeactivateCustomerRoutingRule(id)
  const deleteRule = useDeleteCustomerRoutingRule(id)
  const { data: mailboxData } = useMailboxes()
  const { data: groups = [] } = useGroupsQuery()
  const mailboxes = mailboxData?.items ?? []

  // Tab state
  type TabId = 'overview' | 'email' | 'tickets'
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

  const supportsDefaultStatus = emailSettings != null && Object.prototype.hasOwnProperty.call(emailSettings, 'defaultStatus')

  if (isLoading) {
    return (
      <div className="p-6">
        <table className="w-full"><tbody><SkeletonRow colCount={3} /></tbody></table>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6">
        <EmptyState title="Customer not found" description="This customer doesn't exist." />
      </div>
    )
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
          unknownSenderPolicy: 'CREATE_UNMATCHED_TICKET',
          defaultGroupId: null,
          defaultPriority: null,
          ...(supportsDefaultStatus ? { defaultStatus: null } : {}),
        })
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

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    ...(showEmailTab ? [{ id: 'email' as const, label: 'Email Settings' }] : []),
    { id: 'tickets' as const, label: 'Tickets' },
  ]

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={14} />
        Back to Customers
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
              <Badge variant="outline" size="sm">{customer.code}</Badge>
              {customer.isActive
                ? <Badge variant="success" size="sm">Active</Badge>
                : <Badge variant="default" size="sm">Inactive</Badge>}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Created {format(new Date(customer.createdAt), 'MMM d, yyyy')}
              {customer.updatedAt && ` · Updated ${format(new Date(customer.updatedAt), 'MMM d, yyyy')}`}
            </div>
          </div>
          {/* Quick status indicators */}
          <div className="flex items-center gap-3">
            {showEmailTab && emailSettings && (
              <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${emailSettings.isEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <Mail size={12} />
                Email {emailSettings.isEnabled ? 'Enabled' : 'Disabled'}
              </div>
            )}
            {routingRules.length > 0 && showEmailTab && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                <Globe size={12} />
                {routingRules.filter((r) => r.isActive).length} routing rule{routingRules.filter((r) => r.isActive).length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Customer Information</h2>
            <div className="space-y-3 text-sm">
              <InfoRow label="Customer ID" value={customer.id} />
              <InfoRow label="Code" value={customer.code} />
              <InfoRow label="Status" value={customer.isActive ? 'Active' : 'Inactive'} />
              <InfoRow label="Created" value={format(new Date(customer.createdAt), 'dd MMM yyyy, HH:mm')} />
              <InfoRow label="Last Updated" value={format(new Date(customer.updatedAt), 'dd MMM yyyy, HH:mm')} />
            </div>
          </div>

          {/* Email routing summary card */}
          {showEmailTab && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Email Routing</h2>
                <button onClick={() => setActiveTab('email')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Manage →</button>
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
                      <div className="text-xs text-gray-500 mb-1.5">Sender Patterns ({routingRules.filter((r) => r.isActive).length} active)</div>
                      <div className="flex flex-wrap gap-1.5">
                        {routingRules.filter((r) => r.isActive).slice(0, 5).map((r) => (
                          <span key={r.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-mono">
                            {r.senderMatchType === 'DOMAIN_SUFFIX' ? <Globe size={10} /> : <AtSign size={10} />}
                            {r.senderMatchValue}
                          </span>
                        ))}
                        {routingRules.filter((r) => r.isActive).length > 5 && (
                          <span className="text-xs text-gray-400">+{routingRules.filter((r) => r.isActive).length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent tickets card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Recent Tickets</h2>
              <button onClick={() => setActiveTab('tickets')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View all →</button>
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
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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

      {/* Email Settings tab */}
      {activeTab === 'email' && showEmailTab && (
        <div className="space-y-6">
          {/* Email Settings card */}
          <div className="bg-white rounded-xl border border-gray-200">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
          <div className="bg-white rounded-xl border border-gray-200">
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
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Type</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Pattern</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Mailbox</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Priority</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Status</th>
                    {canManageEmailConfig && <th className="px-4 py-2 text-right font-semibold text-gray-600 text-xs">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {routingRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <Badge variant={rule.senderMatchType === 'EXACT_EMAIL' ? 'info' : 'default'} size="sm">
                          {rule.senderMatchType === 'EXACT_EMAIL' ? 'Exact Email' : 'Domain'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">{rule.senderMatchValue}</td>
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
                            <button onClick={() => openEditRule(rule)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600" title="Edit"><Pencil size={13} /></button>
                            <button onClick={() => handleToggleRule(rule)} className="p-1 rounded hover:bg-gray-100 text-gray-500" title={rule.isActive ? 'Deactivate' : 'Activate'}>
                              {rule.isActive ? <ToggleRight size={13} className="text-green-500" /> : <ToggleLeft size={13} />}
                            </button>
                            <button onClick={() => setDeletingRuleId(rule.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600" title="Delete"><Trash2 size={13} /></button>
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Subject</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Priority</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={ruleForm.notes ?? ''}
              onChange={(e) => setRuleForm((f) => ({ ...f, notes: e.target.value || null }))}
              rows={2}
              placeholder="Optional notes…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}
