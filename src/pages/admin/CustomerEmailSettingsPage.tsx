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
import { customerEmailSettingsService } from '@/services/customerEmailSettings.service'
import type { UpsertCustomerEmailSettingsRequest, UpsertCustomerEmailRoutingRuleRequest } from '@/types/api.types'
import type { CustomerEmailRoutingRule } from '@/types/email.types'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Badge } from '@/components/shared/Badge'
import {
  ShieldOff, Mail, Save, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, Search,
} from 'lucide-react'

const UNKNOWN_SENDER_POLICIES = ['ALLOW', 'REJECT', 'QUARANTINE', 'ROUTE_TO_DEFAULT', 'AUTO_CREATE_CONTACT']

export function CustomerEmailSettingsPage() {
  const { canManageCustomerEmail } = usePermissions()
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
    matchType: 'EXACT_EMAIL',
    matchValue: '',
    mailboxId: null,
    groupId: null,
    priority: null,
    status: null,
    isActive: true,
  })
  const [savingRule, setSavingRule] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)

  if (!canManageCustomerEmail) {
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
        mailboxId: null,
        trustedContactsOnly: false,
        autoCreateContact: true,
        allowSubdomains: false,
        unknownSenderPolicy: 'ROUTE_TO_DEFAULT',
        defaultGroupId: null,
        defaultPriority: null,
        defaultStatus: null,
      })
    } else {
      setSettingsForm({
        mailboxId: settings.mailboxId,
        trustedContactsOnly: settings.trustedContactsOnly,
        autoCreateContact: settings.autoCreateContact,
        allowSubdomains: settings.allowSubdomains,
        unknownSenderPolicy: settings.unknownSenderPolicy,
        defaultGroupId: settings.defaultGroupId,
        defaultPriority: settings.defaultPriority?.toString() ?? null,
        defaultStatus: settings.defaultStatus?.toString() ?? null,
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
      error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const openCreateRule = () => {
    setRuleForm({ matchType: 'EXACT_EMAIL', matchValue: '', mailboxId: null, groupId: null, priority: null, status: null, isActive: true })
    setEditingRule(null)
    setRuleModal('create')
  }

  const openEditRule = (rule: CustomerEmailRoutingRule) => {
    setRuleForm({
      matchType: rule.matchType,
      matchValue: rule.matchValue,
      mailboxId: rule.mailboxId,
      groupId: rule.groupId,
      priority: rule.priority?.toString() ?? null,
      status: rule.status?.toString() ?? null,
      isActive: rule.isActive,
    })
    setEditingRule(rule)
    setRuleModal('edit')
  }

  const handleSaveRule = async () => {
    if (!ruleForm.matchValue.trim() || !selectedCustomerId) return
    setSavingRule(true)
    try {
      if (ruleModal === 'create') {
        await customerEmailSettingsService.createRoutingRule(selectedCustomerId, ruleForm)
        success('Routing rule created')
      } else if (editingRule) {
        await customerEmailSettingsService.updateRoutingRule(selectedCustomerId, editingRule.id, ruleForm)
        success('Routing rule updated')
      }
      await queryClient.invalidateQueries({ queryKey: ['customer-email-routing-rules', selectedCustomerId] })
      setRuleModal(null)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to save rule')
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
      error(err instanceof Error ? err.message : 'Failed to delete rule')
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
          ...ruleForm,
          matchType: rule.matchType,
          matchValue: rule.matchValue,
          isActive: true,
        })
        success('Rule activated')
      }
      await queryClient.invalidateQueries({ queryKey: ['customer-email-routing-rules', selectedCustomerId] })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Toggle failed')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Customer Email Settings</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Customer list */}
        <div className="col-span-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers…"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {loadingCustomers ? (
                <div className="p-4"><SkeletonRow colCount={1} /></div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">No customers found</div>
              ) : (
                filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                      selectedCustomerId === c.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-800">{c.name}</div>
                    {c.code && <div className="text-xs text-gray-400">{c.code}</div>}
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
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <SkeletonRow colCount={3} />
            </div>
          ) : (
            <>
              {/* Email settings card */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">Email Settings</span>
                  {settingsForm === null && (
                    <Button variant="secondary" size="sm" leftIcon={<Pencil size={12} />} onClick={beginEditSettings}>
                      Edit
                    </Button>
                  )}
                </div>

                {settingsForm === null ? (
                  /* Read-only view */
                  <div className="px-5 py-4 space-y-3 text-sm">
                    <Row label="Mailbox" value={settings?.mailboxName ?? '—'} />
                    <Row label="Unknown Sender Policy" value={settings?.unknownSenderPolicy ?? '—'} />
                    <Row label="Trusted Contacts Only" value={settings?.trustedContactsOnly ? 'Yes' : 'No'} />
                    <Row label="Auto-create Contact" value={settings?.autoCreateContact ? 'Yes' : 'No'} />
                    <Row label="Allow Subdomains" value={settings?.allowSubdomains ? 'Yes' : 'No'} />
                    <Row label="Default Group" value={settings?.defaultGroupName ?? '—'} />
                    <Row label="Default Priority" value={settings?.defaultPriority?.toString() ?? '—'} />
                    <Row label="Default Status" value={settings?.defaultStatus?.toString() ?? '—'} />
                  </div>
                ) : (
                  /* Edit form */
                  <div className="px-5 py-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Mailbox</label>
                      <select
                        value={settingsForm.mailboxId ?? ''}
                        onChange={(e) => setSettingsForm((f) => f && ({ ...f, mailboxId: e.target.value || null }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="">— None —</option>
                        {mailboxes.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.emailAddress})</option>
                        ))}
                      </select>
                    </div>

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
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={settingsForm.trustedContactsOnly} onChange={(e) => setSettingsForm((f) => f && ({ ...f, trustedContactsOnly: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
                        Trusted Contacts Only
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={settingsForm.autoCreateContact} onChange={(e) => setSettingsForm((f) => f && ({ ...f, autoCreateContact: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
                        Auto-create Contact
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={settingsForm.allowSubdomains} onChange={(e) => setSettingsForm((f) => f && ({ ...f, allowSubdomains: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
                        Allow Subdomains
                      </label>
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
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">Routing Rules</span>
                  <Button variant="secondary" size="sm" leftIcon={<Plus size={12} />} onClick={openCreateRule}>
                    Add Rule
                  </Button>
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
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Match Type</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Match Value</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Mailbox</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Group</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 text-xs">Status</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-600 text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <Badge variant={rule.matchType === 'EXACT_EMAIL' ? 'info' : 'default'} size="sm">
                              {rule.matchType === 'EXACT_EMAIL' ? 'Exact' : 'Domain'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-gray-700">{rule.matchValue}</td>
                          <td className="px-4 py-2 text-gray-600 text-xs">{rule.mailboxName ?? '—'}</td>
                          <td className="px-4 py-2 text-gray-600 text-xs">{rule.groupName ?? '—'}</td>
                          <td className="px-4 py-2">
                            {rule.isActive ? (
                              <Badge variant="success" size="sm">Active</Badge>
                            ) : (
                              <Badge variant="default" size="sm">Inactive</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEditRule(rule)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600" title="Edit">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => handleToggleRule(rule)} className="p-1 rounded hover:bg-gray-100 text-gray-500" title={rule.isActive ? 'Deactivate' : 'Activate'}>
                                {rule.isActive ? <ToggleRight size={13} className="text-green-500" /> : <ToggleLeft size={13} />}
                              </button>
                              <button onClick={() => setDeletingRuleId(rule.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600" title="Delete">
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
        title={ruleModal === 'create' ? 'New Routing Rule' : `Edit Rule — ${editingRule?.matchValue ?? ''}`}
      >
        <div className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Match Type</label>
            <select
              value={ruleForm.matchType}
              onChange={(e) => setRuleForm((f) => ({ ...f, matchType: e.target.value as 'EXACT_EMAIL' | 'DOMAIN_SUFFIX' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="EXACT_EMAIL">Exact Email</option>
              <option value="DOMAIN_SUFFIX">Domain Suffix</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Match Value *</label>
            <input
              value={ruleForm.matchValue}
              onChange={(e) => setRuleForm((f) => ({ ...f, matchValue: e.target.value }))}
              placeholder={ruleForm.matchType === 'EXACT_EMAIL' ? 'user@example.com' : '@example.com'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mailbox</label>
            <select
              value={ruleForm.mailboxId ?? ''}
              onChange={(e) => setRuleForm((f) => ({ ...f, mailboxId: e.target.value || null }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— Default —</option>
              {mailboxes.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <input
                value={ruleForm.priority ?? ''}
                onChange={(e) => setRuleForm((f) => ({ ...f, priority: e.target.value || null }))}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <input
                value={ruleForm.status ?? ''}
                onChange={(e) => setRuleForm((f) => ({ ...f, status: e.target.value || null }))}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={ruleForm.isActive ?? true} onChange={(e) => setRuleForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-gray-300 text-indigo-600" />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setRuleModal(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveRule} isLoading={savingRule} disabled={!ruleForm.matchValue.trim()}>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}
