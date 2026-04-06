import { useEffect, useMemo, useState } from 'react'
import { BellRing, Plus, ShieldOff, Trash2, Pencil } from 'lucide-react'
import { useChannelConfig, useChannelConfigs, useCreateChannelConfig, useDeleteChannelConfig, useUpdateChannelConfig } from '@/hooks/useIntegrations'
import { usePermissions } from '@/hooks/usePermissions'
import { useCustomers } from '@/hooks/useCustomers'
import { useGroupsQuery } from '@/hooks/useUsers'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { Modal } from '@/components/shared/Modal'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { getErrorMessage } from '@/lib/errors'
import type { ChannelConfig, ChannelConfigRequest, ChannelType, NotificationEventType, ScopeType } from '@/types/integration.types'

const EVENT_OPTIONS: Array<{ value: NotificationEventType; label: string }> = [
  { value: 'TICKET_CREATED', label: 'Ticket Created' },
  { value: 'TICKET_ASSIGNED', label: 'Ticket Assigned' },
  { value: 'TICKET_TRANSFERRED', label: 'Ticket Transferred' },
  { value: 'TICKET_RESOLVED', label: 'Ticket Resolved' },
  { value: 'TICKET_CLOSED', label: 'Ticket Closed' },
  { value: 'OUTBOUND_REPLY_FAILED', label: 'Outbound Reply Failed' },
]

interface ChannelFormState {
  name: string
  channelType: ChannelType
  webhookUrl: string
  subscribedEvents: NotificationEventType[]
  scopeType: ScopeType
  scopeId: string
  enabled: boolean
}

const EMPTY_FORM: ChannelFormState = {
  name: '',
  channelType: 'SLACK',
  webhookUrl: '',
  subscribedEvents: ['TICKET_CREATED'],
  scopeType: 'GLOBAL',
  scopeId: '',
  enabled: true,
}

function scopeLabel(scopeType: ScopeType): string {
  switch (scopeType) {
    case 'GROUP':
      return 'Group'
    case 'CUSTOMER':
      return 'Customer'
    default:
      return 'Global'
  }
}

function channelTypeVariant(channelType: ChannelType): 'info' | 'default' {
  return channelType === 'SLACK' ? 'info' : 'default'
}

function webhookPlaceholder(channelType: ChannelType, preserveSavedWebhook: boolean): string {
  if (preserveSavedWebhook) {
    return 'Leave blank to preserve saved webhook'
  }

  return channelType === 'SLACK'
    ? 'https://hooks.slack.com/services/...'
    : 'https://outlook.office.com/webhook/...'
}

function webhookHelpText(channelType: ChannelType, preserveSavedWebhook: boolean): string {
  if (preserveSavedWebhook) {
    return `A saved ${channelType === 'SLACK' ? 'Slack' : 'Teams'} webhook exists. Leave the field blank to preserve it.`
  }

  return channelType === 'SLACK'
    ? 'Paste the incoming Slack webhook URL for the channel that should receive ticket events.'
    : 'Paste the Microsoft Teams incoming webhook URL for the channel that should receive ticket events.'
}

function toFormState(config: ChannelConfig): ChannelFormState {
  return {
    name: config.name,
    channelType: config.channelType,
    webhookUrl: '',
    subscribedEvents: config.subscribedEvents,
    scopeType: config.scopeType,
    scopeId: config.scopeId != null ? String(config.scopeId) : '',
    enabled: config.enabled,
  }
}

export function ChannelIntegrationSettingsPage() {
  const { canManageIntegrationConfig } = usePermissions()
  const channelConfigsQuery = useChannelConfigs()
  const createMutation = useCreateChannelConfig()
  const updateMutation = useUpdateChannelConfig()
  const deleteMutation = useDeleteChannelConfig()
  const { customers } = useCustomers('')
  const groupsQuery = useGroupsQuery()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChannelConfig | null>(null)
  const [form, setForm] = useState<ChannelFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const editingConfigQuery = useChannelConfig(editingId, modalMode === 'edit' && editingId != null)

  useEffect(() => {
    if (modalMode !== 'edit' || !editingConfigQuery.data) return
    setForm(toFormState(editingConfigQuery.data))
    setFormError(null)
  }, [editingConfigQuery.data, modalMode])

  if (!canManageIntegrationConfig) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to manage notification channels."
        />
      </div>
    )
  }

  const groups = groupsQuery.data ?? []
  const isSaving = createMutation.isPending || updateMutation.isPending
  const editingConfig = editingConfigQuery.data ?? null
  const preserveSavedWebhook = modalMode === 'edit' && Boolean(editingConfig?.webhookConfigured)
  const webhookHint = webhookHelpText(form.channelType, preserveSavedWebhook)
  const webhookInputPlaceholder = webhookPlaceholder(form.channelType, preserveSavedWebhook)

  const scopeOptions = form.scopeType === 'GROUP'
    ? groups.map((group) => ({ id: String(group.id), label: group.name }))
    : form.scopeType === 'CUSTOMER'
      ? customers.map((customer) => ({ id: customer.id, label: customer.name }))
      : []

  const openCreate = () => {
    setModalMode('create')
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  const openEdit = (config: ChannelConfig) => {
    setModalMode('edit')
    setEditingId(config.id)
    setForm(toFormState(config))
    setFormError(null)
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  const handleToggleEvent = (value: NotificationEventType) => {
    setForm((current) => ({
      ...current,
      subscribedEvents: current.subscribedEvents.includes(value)
        ? current.subscribedEvents.filter((eventType) => eventType !== value)
        : [...current.subscribedEvents, value],
    }))
    setFormError(null)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setFormError('Channel name is required.')
      return
    }
    if (modalMode === 'create' && !form.webhookUrl.trim()) {
      setFormError('Webhook URL is required when creating a channel config.')
      return
    }
    if (form.subscribedEvents.length === 0) {
      setFormError('Select at least one subscribed event.')
      return
    }
    if (form.scopeType !== 'GLOBAL' && !form.scopeId) {
      setFormError(`Select a ${scopeLabel(form.scopeType).toLowerCase()} scope target.`)
      return
    }

    const request: ChannelConfigRequest = {
      name: form.name.trim(),
      channelType: form.channelType,
      webhookUrl: form.webhookUrl.trim(),
      subscribedEvents: form.subscribedEvents,
      scopeType: form.scopeType,
      scopeId: form.scopeType === 'GLOBAL' ? null : Number(form.scopeId),
      enabled: form.enabled,
    }

    const onError = (error: unknown) => setFormError(getErrorMessage(error, 'Failed to save channel config.'))
    const onSuccess = () => closeModal()

    if (modalMode === 'edit' && editingId != null) {
      updateMutation.mutate({ id: editingId, request }, { onError, onSuccess })
      return
    }

    createMutation.mutate(request, { onError, onSuccess })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notification Channels</h1>
          <p className="mt-1 text-sm text-gray-500">Manage the audited Slack and Teams webhook channel configurations used for outbound notifications.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          New Channel
        </Button>
      </div>

      {channelConfigsQuery.isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <table className="w-full"><tbody><SkeletonRow colCount={4} /><SkeletonRow colCount={4} /><SkeletonRow colCount={4} /></tbody></table>
        </div>
      ) : channelConfigsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(channelConfigsQuery.error, 'Failed to load notification channels.')}
        </div>
      ) : (channelConfigsQuery.data ?? []).length === 0 ? (
        <EmptyState
          icon={<BellRing className="w-8 h-8 text-gray-400" />}
          title="No notification channels"
          description="Create the first Slack or Teams integration channel to start receiving ticket events."
          action={<Button variant="primary" size="sm" onClick={openCreate}>Create Channel</Button>}
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Events</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Secret</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {(channelConfigsQuery.data ?? []).map((config) => (
                <tr key={config.id}>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{config.name}</span>
                        <Badge variant={channelTypeVariant(config.channelType)}>{config.channelType}</Badge>
                        <Badge variant={config.enabled ? 'success' : 'default'}>{config.enabled ? 'Enabled' : 'Disabled'}</Badge>
                      </div>
                      <div className="text-xs text-gray-500">Updated {new Date(config.updatedAt).toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {config.subscribedEvents.map((eventType) => (
                        <Badge key={eventType} variant="outline">{eventType}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-gray-700">
                    {scopeLabel(config.scopeType)}
                    {config.scopeType !== 'GLOBAL' && config.scopeId != null ? ` #${config.scopeId}` : ''}
                  </td>
                  <td className="px-4 py-3 align-top text-gray-500">
                    {config.webhookConfigured ? 'Saved and hidden' : 'Not configured'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" leftIcon={<Pencil size={13} />} onClick={() => openEdit(config)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" leftIcon={<Trash2 size={13} />} onClick={() => setDeleteTarget(config)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'edit' ? 'Edit Channel' : 'Create Channel'}
        size="lg"
        footer={(
          <>
            <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSaving} disabled={isSaving}>
              {modalMode === 'edit' ? 'Save' : 'Create'}
            </Button>
          </>
        )}
      >
        {modalMode === 'edit' && editingConfigQuery.isLoading ? (
          <table className="w-full"><tbody><SkeletonRow colCount={2} /><SkeletonRow colCount={2} /></tbody></table>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-x-4 gap-y-4 md:grid-cols-2 md:items-start">
              <label className="flex h-full flex-col gap-1.5 text-sm text-gray-700">
                <span className="font-medium">Name</span>
                <span className="min-h-[2.5rem] text-xs text-gray-500">Internal display name used in CaseFlow admin screens to identify this channel configuration.</span>
                <input
                  aria-label="Name"
                  value={form.name}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, name: event.target.value }))
                    setFormError(null)
                  }}
                  className="mt-auto w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </label>

              <label className="flex h-full flex-col gap-1.5 text-sm text-gray-700">
                <span className="font-medium">Channel Type</span>
                <span className="min-h-[2.5rem] text-xs text-gray-500">Choose which provider this channel posts to so the webhook format and guidance stay correct.</span>
                <select
                  aria-label="Channel Type"
                  value={form.channelType}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, channelType: event.target.value as ChannelType }))
                    setFormError(null)
                  }}
                  className="mt-auto w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="SLACK">Slack</option>
                  <option value="TEAMS">Teams</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm text-gray-700 md:col-span-2">
                <span className="font-medium">Webhook URL</span>
                <input
                  aria-label="Webhook URL"
                  type="password"
                  value={form.webhookUrl}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, webhookUrl: event.target.value }))
                    setFormError(null)
                  }}
                  placeholder={webhookInputPlaceholder}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-xs text-gray-500">{webhookHint}</span>
              </label>

              <label className="flex h-full flex-col gap-1.5 text-sm text-gray-700">
                <span className="font-medium">Scope</span>
                <span className="min-h-[2.5rem] text-xs text-gray-500">Global sends events for the whole workspace. Group limits notifications to one team. Customer limits notifications to one customer context.</span>
                <select
                  aria-label="Scope"
                  value={form.scopeType}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, scopeType: event.target.value as ScopeType, scopeId: '' }))
                    setFormError(null)
                  }}
                  className="mt-auto w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="GLOBAL">Global</option>
                  <option value="GROUP">Group</option>
                  <option value="CUSTOMER">Customer</option>
                </select>
              </label>

              {form.scopeType !== 'GLOBAL' ? (
                <label className="flex h-full flex-col gap-1.5 text-sm text-gray-700">
                  <span className="font-medium">Scope Target</span>
                  <span className="min-h-[2.5rem] text-xs text-gray-500">Required. Choose the specific {scopeLabel(form.scopeType).toLowerCase()} this channel applies to.</span>
                  <select
                    aria-label="Scope Target"
                    value={form.scopeId}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, scopeId: event.target.value }))
                      setFormError(null)
                    }}
                    className="mt-auto w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select {scopeLabel(form.scopeType).toLowerCase()}</option>
                    {scopeOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) => {
                  setForm((current) => ({ ...current, enabled: event.target.checked }))
                  setFormError(null)
                }}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
              />
              <div>
                <div className="font-medium text-gray-900">Enabled</div>
                <div className="text-xs text-gray-500">Turn this channel on to allow event delivery.</div>
              </div>
            </label>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-800">Subscribed Events</div>
              <p className="text-xs text-gray-500">Choose which ticket lifecycle events should be delivered to this channel. Select at least one event.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {EVENT_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.subscribedEvents.includes(option.value)}
                      onChange={() => handleToggleEvent(option.value)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Channel"
        footer={(
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleteMutation.isPending}>Delete</Button>
          </>
        )}
      >
        <p className="text-sm text-gray-700">
          Delete <span className="font-semibold">{deleteTarget?.name}</span>? This removes the stored channel configuration immediately.
        </p>
      </Modal>
    </div>
  )
}