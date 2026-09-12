import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useCustomerEmailAdminCustomers,
  useCustomerEmailSettings,
  useCustomerRoutingRules,
} from '@/hooks/useCustomerEmailSettings'
import { useMailboxes } from '@/hooks/useMailboxes'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { customerEmailSettingsService } from '@/services/customerEmailSettings.service'
import type { UpsertCustomerEmailSettingsRequest, UpsertCustomerEmailRoutingRuleRequest } from '@/types/api.types'
import type { CustomerEmailRoutingRule } from '@/types/email.types'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Badge } from '@/components/shared/Badge'
import { FieldHint, HelpDrawer, PageIntro, SectionHelp, WarningCallout } from '@/components/shared/help'
import { customerEmailSettingsHelp } from '@/help/customer-email-settings.help'
import {
  ShieldOff, Mail, Save, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, Search,
} from 'lucide-react'

const UNKNOWN_SENDER_POLICIES = ['MANUAL_REVIEW', 'IGNORE', 'REJECT'] as const

export function CustomerEmailSettingsPage() {
  const { canManageEmailConfig } = usePermissions()
  const { success, error } = useToast()
  const queryClient = useQueryClient()

  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')

  const { data: customers = [], isLoading: loadingCustomers } = useCustomerEmailAdminCustomers()
  const { data: settings, isLoading: loadingSettings } = useCustomerEmailSettings(selectedCustomerId)
  const { data: rules = [], isLoading: loadingRules } = useCustomerRoutingRules(selectedCustomerId)
  const { data: mailboxData } = useMailboxes()
  const mailboxes = mailboxData?.items ?? []

  // Settings form
  const [settingsForm, setSettingsForm] = useState<UpsertCustomerEmailSettingsRequest | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  // Rule modal
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
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  if (!canManageEmailConfig) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to manage customer email settings."
        />
      </div>
    )
  }

  const filteredCustomers = customerSearch
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.id.toLowerCase().includes(customerSearch.toLowerCase()),
      )
    : customers

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId)
    setSettingsForm(null)
  }

  const beginEditSettings = () => {
    if (!settings) {
      setSettingsForm({
        isEnabled: true,
        allowSubdomains: false,
        unknownSenderPolicy: 'MANUAL_REVIEW',
        defaultGroupId: null,
        defaultPriority: null,
      })
    } else {
      setSettingsForm({
        isEnabled: settings.isEnabled,
        allowSubdomains: settings.allowSubdomains,
        unknownSenderPolicy: UNKNOWN_SENDER_POLICIES.includes(settings.unknownSenderPolicy as (typeof UNKNOWN_SENDER_POLICIES)[number])
          ? settings.unknownSenderPolicy
          : 'MANUAL_REVIEW',
        defaultGroupId: settings.defaultGroupId,
        defaultPriority: settings.defaultPriority?.toString() ?? null,
      })
    }
  }

  const handleSaveSettings = async () => {
    if (!settingsForm || !selectedCustomerId) return
    setSavingSettings(true)
    try {
      await customerEmailSettingsService.upsert(selectedCustomerId, settingsForm)
      await queryClient.invalidateQueries({ queryKey: ['customer-email-settings', selectedCustomerId] })
      setSettingsForm(null)
      success('Email settings saved')
    } catch (err) {
      error(getErrorMessage(err, 'Failed to save settings'))
    } finally {
      setSavingSettings(false)
    }
  }

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
    if (!isValidMatchValue || !selectedCustomerId) return
    setSavingRule(true)
    try {
      const payload: UpsertCustomerEmailRoutingRuleRequest = {
        ...ruleForm,
        senderMatchValue: ruleForm.senderMatchValue.trim().toLowerCase(),
      }
      if (ruleModal === 'create') {
        await customerEmailSettingsService.createRoutingRule(selectedCustomerId, payload)
        success('Routing rule created')
      } else if (editingRule) {
        await customerEmailSettingsService.updateRoutingRule(selectedCustomerId, editingRule.id, payload)
        success('Routing rule updated')
      }
      await queryClient.invalidateQueries({ queryKey: ['customer-email-routing-rules', selectedCustomerId] })
      setRuleModal(null)
    } catch (err) {
      error(getErrorMessage(err, 'Failed to save rule'))
    } finally {
      setSavingRule(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await customerEmailSettingsService.deleteRoutingRule(selectedCustomerId, ruleId)
      await queryClient.invalidateQueries({ queryKey: ['customer-email-routing-rules', selectedCustomerId] })
      success('Rule deleted')
    } catch (err) {
      error(getErrorMessage(err, 'Failed to delete rule'))
    } finally {
      setDeletingRuleId(null)
    }
  }

  const handleToggleRule = async (rule: CustomerEmailRoutingRule) => {
    try {
      if (rule.isActive) {
        await customerEmailSettingsService.deactivateRoutingRule(selectedCustomerId, rule.id)
        success('Rule deactivated')
      } else {
        await customerEmailSettingsService.updateRoutingRule(selectedCustomerId, rule.id, {
          senderMatchType: rule.senderMatchType,
          senderMatchValue: rule.senderMatchValue,
          recipientMailboxId: rule.recipientMailboxId,
          priority: rule.priority,
          isActive: true,
          notes: rule.notes,
        })
        success('Rule activated')
      }
      await queryClient.invalidateQueries({ queryKey: ['customer-email-routing-rules', selectedCustomerId] })
    } catch (err) {
      error(getErrorMessage(err, 'Toggle failed'))
    }
  }

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header relative z-10">
        <div>
          <h1 className="admin-page-title">Customer Email Settings</h1>
          <p className="admin-page-subtitle">Configure inbound email behavior and sender-based routing per customer.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setIsHelpOpen(true)}>
          Help
        </Button>
      </div>

      <PageIntro summary={customerEmailSettingsHelp.summary} />

      <div className="grid grid-cols-12 gap-6">
        {/* Customer list */}
        <div className="col-span-4">
          <div className="admin-panel overflow-hidden">
            <div className="border-b border-white/10 p-3">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers…"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="ui-input ui-input-with-icon pr-3"
                />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/10">
              {loadingCustomers ? (
                <div className="p-4"><SkeletonRow colCount={1} /></div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-6 text-center text-xs text-blue-100/48">No customers found</div>
              ) : (
                filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c.id)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/[0.06] ${
                      selectedCustomerId === c.id ? 'border-l-2 border-[#7eb5ff] bg-white/[0.08]' : ''
                    }`}
                  >
                    <div className="font-medium text-white">{c.name}</div>
                    {c.code && <div className="text-xs text-blue-100/48">{c.code}</div>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Settings & rules detail */}
        <div className="col-span-8 space-y-6">
          {!selectedCustomerId ? (
            <EmptyState
              icon={<Mail className="w-8 h-8 text-gray-400" />}
              title="Select a customer"
              description="Choose a customer from the list to view or edit their email settings."
            />
          ) : loadingSettings ? (
            <div className="admin-panel p-6">
              <SkeletonRow colCount={3} />
            </div>
          ) : (
            <>
              {/* Email settings card */}
              <div className="admin-panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <span className="text-sm font-semibold text-blue-50">Email Settings</span>
                  {settingsForm === null && (
                    <Button variant="secondary" size="sm" leftIcon={<Pencil size={12} />} onClick={beginEditSettings}>
                      Edit
                    </Button>
                  )}
                </div>
                <div className="px-5 pt-4">
                  <SectionHelp title={customerEmailSettingsHelp.sections.settings.title} description={customerEmailSettingsHelp.sections.settings.description} />
                </div>

                {settingsForm === null ? (
                  /* Read-only view */
                  <div className="space-y-3 px-5 py-4 text-sm">
                    <Row label="Enabled" value={settings?.isEnabled ? 'Yes' : 'No'} />
                    <Row label="Unknown Sender Policy" value={settings?.unknownSenderPolicy ?? '—'} />
                    <Row label="Allow Subdomains" value={settings?.allowSubdomains ? 'Yes' : 'No'} />
                    <Row label="Default Group" value={settings?.defaultGroupName ?? '—'} />
                    <Row label="Default Priority" value={settings?.defaultPriority?.toString() ?? '—'} />
                  </div>
                ) : (
                  /* Edit form */
                  <div className="px-5 py-4 space-y-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={settingsForm.isEnabled} onChange={(e) => setSettingsForm((f) => f && ({ ...f, isEnabled: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
                      Email Integration Enabled
                    </label>
                    <FieldHint className="mt-0" text={customerEmailSettingsHelp.fieldHints.isEnabled} />

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Unknown Sender Policy</label>
                      <select
                        value={settingsForm.unknownSenderPolicy}
                        onChange={(e) => setSettingsForm((f) => f && ({ ...f, unknownSenderPolicy: e.target.value as UpsertCustomerEmailSettingsRequest['unknownSenderPolicy'] }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {UNKNOWN_SENDER_POLICIES.map((p) => (
                          <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <FieldHint text={customerEmailSettingsHelp.fieldHints.unknownSenderPolicy} />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={settingsForm.allowSubdomains} onChange={(e) => setSettingsForm((f) => f && ({ ...f, allowSubdomains: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
                      Allow Subdomains
                    </label>
                    <FieldHint className="mt-0" text={customerEmailSettingsHelp.fieldHints.allowSubdomains} />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Default Group ID</label>
                        <input
                          value={settingsForm.defaultGroupId ?? ''}
                          onChange={(e) => setSettingsForm((f) => f && ({ ...f, defaultGroupId: e.target.value || null }))}
                          placeholder="Optional"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <FieldHint text={customerEmailSettingsHelp.fieldHints.defaultGroupId} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Default Priority</label>
                        <input
                          value={settingsForm.defaultPriority ?? ''}
                          onChange={(e) => setSettingsForm((f) => f && ({ ...f, defaultPriority: e.target.value || null }))}
                          placeholder="Optional"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <FieldHint text={customerEmailSettingsHelp.fieldHints.defaultPriority} />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="secondary" size="sm" onClick={() => setSettingsForm(null)}>Cancel</Button>
                      <Button variant="primary" size="sm" leftIcon={<Save size={12} />} onClick={handleSaveSettings} isLoading={savingSettings}>
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Routing rules */}
              <div className="admin-table-shell overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <span className="text-sm font-semibold text-blue-50">Routing Rules</span>
                  <Button variant="secondary" size="sm" leftIcon={<Plus size={12} />} onClick={openCreateRule}>
                    Add Rule
                  </Button>
                </div>

                <div className="px-5 pt-4 space-y-4">
                  <SectionHelp title={customerEmailSettingsHelp.sections.rules.title} description={customerEmailSettingsHelp.sections.rules.description} />
                  <WarningCallout title={customerEmailSettingsHelp.warnings[0].title}>
                    {customerEmailSettingsHelp.warnings[0].description.defaultMessage}
                  </WarningCallout>
                </div>

                {loadingRules ? (
                  <div className="p-4"><SkeletonRow colCount={5} /></div>
                ) : rules.length === 0 ? (
                  <div className="py-8">
                    <EmptyState
                      icon={<Mail className="w-6 h-6 text-gray-400" />}
                      title="No routing rules"
                      description="Add rules to route emails by sender address or domain."
                    />
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="admin-table-head">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-100/72">Match Type</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-100/72">Match Value</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-100/72">Mailbox</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-100/72">Priority</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-100/72">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-blue-100/72">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="admin-table-striped divide-y divide-white/10">
                      {rules.map((rule) => (
                        <tr key={rule.id} className="transition-colors hover:bg-white/[0.08]">
                          <td className="px-4 py-2">
                            <Badge variant={rule.senderMatchType === 'EXACT_EMAIL' ? 'info' : 'default'} size="sm">
                              {rule.senderMatchType === 'EXACT_EMAIL' ? 'Exact' : 'Domain'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-blue-50/90">{rule.senderMatchValue}</td>
                          <td className="px-4 py-2 text-xs text-blue-100/72">{rule.recipientMailboxName ?? '—'}</td>
                          <td className="px-4 py-2 text-xs text-blue-100/72">{rule.priority}</td>
                          <td className="px-4 py-2">
                            {rule.isActive ? (
                              <Badge variant="success" size="sm">Active</Badge>
                            ) : (
                              <Badge variant="default" size="sm">Inactive</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEditRule(rule)} className="rounded p-1 text-blue-100/52 hover:bg-white/[0.08] hover:text-white" title="Edit">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => handleToggleRule(rule)} className="rounded p-1 text-blue-100/52 hover:bg-white/[0.08]" title={rule.isActive ? 'Deactivate' : 'Activate'}>
                                {rule.isActive ? <ToggleRight size={13} className="text-green-500" /> : <ToggleLeft size={13} />}
                              </button>
                              <button onClick={() => setDeletingRuleId(rule.id)} className="rounded p-1 text-blue-100/52 hover:bg-red-500/12 hover:text-red-200" title="Delete">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Routing rule modal */}
      <Modal
        isOpen={ruleModal !== null}
        onClose={() => setRuleModal(null)}
        title={ruleModal === 'create' ? 'New Routing Rule' : `Edit Rule — ${editingRule?.senderMatchValue ?? ''}`}
        variant="admin"
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
            <FieldHint text={customerEmailSettingsHelp.fieldHints.senderMatchType} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sender Match Value *</label>
            <input
              value={ruleForm.senderMatchValue}
              onChange={(e) => setRuleForm((f) => ({ ...f, senderMatchValue: e.target.value }))}
              placeholder={ruleForm.senderMatchType === 'EXACT_EMAIL' ? 'user@example.com' : '@example.com'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <FieldHint text={customerEmailSettingsHelp.fieldHints.senderMatchValue} />
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
            <FieldHint text={customerEmailSettingsHelp.fieldHints.recipientMailboxId} />
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
            <FieldHint text={customerEmailSettingsHelp.fieldHints.priority} />
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
            <FieldHint text={customerEmailSettingsHelp.fieldHints.notes} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={ruleForm.isActive ?? true} onChange={(e) => setRuleForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
            Active
          </label>
          <FieldHint className="mt-0" text={customerEmailSettingsHelp.fieldHints.ruleActive} />
          <WarningCallout title={customerEmailSettingsHelp.warnings[1].title}>
            {customerEmailSettingsHelp.warnings[1].description.defaultMessage}
          </WarningCallout>
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
        variant="admin"
      />

      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} config={customerEmailSettingsHelp} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-blue-100/58">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}
