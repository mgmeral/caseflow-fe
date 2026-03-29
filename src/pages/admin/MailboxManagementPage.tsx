import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMailboxes } from '@/hooks/useMailboxes'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { mailboxService, type MailboxListFilters } from '@/services/mailbox.service'
import type { Mailbox } from '@/types/email.types'
import type { CreateMailboxRequest, UpdateMailboxRequest } from '@/types/api.types'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Badge } from '@/components/shared/Badge'
import { ShieldOff, Plus, Pencil, ToggleLeft, ToggleRight, Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface MailboxFormState {
  name: string
  emailAddress: string
  displayName: string
  providerType: string
  inboundMode: string
  outboundMode: string
  inboundEnabled: boolean
  outboundEnabled: boolean
  defaultGroupId: string
  defaultPriority: string
  defaultStatus: string
  unknownSenderPolicy: string
}

const EMPTY_FORM: MailboxFormState = {
  name: '',
  emailAddress: '',
  displayName: '',
  providerType: 'SMTP',
  inboundMode: 'PUSH',
  outboundMode: 'SMTP',
  inboundEnabled: true,
  outboundEnabled: true,
  defaultGroupId: '',
  defaultPriority: '',
  defaultStatus: '',
  unknownSenderPolicy: 'ROUTE_TO_DEFAULT',
}

const PROVIDER_TYPES = ['SMTP', 'MICROSOFT_365', 'GOOGLE_WORKSPACE', 'GENERIC']
const INBOUND_MODES = ['PULL', 'PUSH', 'DISABLED']
const OUTBOUND_MODES = ['SMTP', 'API', 'DISABLED']
const UNKNOWN_SENDER_POLICIES = ['ALLOW', 'REJECT', 'QUARANTINE', 'ROUTE_TO_DEFAULT', 'AUTO_CREATE_CONTACT']

export function MailboxManagementPage() {
  const { canManageMailboxes } = usePermissions()
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [filters, setFilters] = useState<MailboxListFilters>({ page: 0, size: 20 })
  const [search, setSearch] = useState('')
  const { data, isLoading } = useMailboxes({ ...filters, search: search || undefined })

  const mailboxes = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0
  const currentPage = filters.page ?? 0

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingMailbox, setEditingMailbox] = useState<Mailbox | null>(null)
  const [form, setForm] = useState<MailboxFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  if (!canManageMailboxes) {
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

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingMailbox(null)
    setModalMode('create')
  }

  const openEdit = (mbx: Mailbox) => {
    setForm({
      name: mbx.name,
      emailAddress: mbx.emailAddress,
      displayName: mbx.displayName ?? '',
      providerType: mbx.providerType,
      inboundMode: mbx.inboundMode,
      outboundMode: mbx.outboundMode,
      inboundEnabled: mbx.inboundEnabled,
      outboundEnabled: mbx.outboundEnabled,
      defaultGroupId: mbx.defaultGroupId ?? '',
      defaultPriority: mbx.defaultPriority?.toString() ?? '',
      defaultStatus: mbx.defaultStatus?.toString() ?? '',
      unknownSenderPolicy: mbx.unknownSenderPolicy,
    })
    setEditingMailbox(mbx)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingMailbox(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.emailAddress.trim()) return
    setSaving(true)
    try {
      const payload: CreateMailboxRequest = {
        name: form.name.trim(),
        emailAddress: form.emailAddress.trim(),
        displayName: form.displayName.trim() || null,
        providerType: form.providerType as CreateMailboxRequest['providerType'],
        inboundMode: form.inboundMode as CreateMailboxRequest['inboundMode'],
        outboundMode: form.outboundMode as CreateMailboxRequest['outboundMode'],
        inboundEnabled: form.inboundEnabled,
        outboundEnabled: form.outboundEnabled,
        defaultGroupId: form.defaultGroupId || null,
        defaultPriority: form.defaultPriority || null,
        defaultStatus: form.defaultStatus || null,
        unknownSenderPolicy: form.unknownSenderPolicy as CreateMailboxRequest['unknownSenderPolicy'],
      }

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

  const handleToggleActive = async (mbx: Mailbox) => {
    setToggling(mbx.id)
    try {
      if (mbx.isActive) {
        await mailboxService.deactivate(mbx.id)
        success(`"${mbx.name}" deactivated`)
      } else {
        await mailboxService.activate(mbx.id)
        success(`"${mbx.name}" activated`)
      }
      await queryClient.invalidateQueries({ queryKey: ['mailboxes'] })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Toggle failed')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mailboxes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} mailbox{total !== 1 ? 'es' : ''}</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          New Mailbox
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search mailboxes…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setFilters((f) => ({ ...f, page: 0 }))
          }}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Provider</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Inbound</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Outbound</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Policy</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Last Inbound</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <>
                  <SkeletonRow colCount={9} />
                  <SkeletonRow colCount={9} />
                  <SkeletonRow colCount={9} />
                </>
              ) : mailboxes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12">
                    <EmptyState
                      icon={<Mail className="w-8 h-8 text-gray-400" />}
                      title="No mailboxes"
                      description="Create your first mailbox to start receiving email."
                    />
                  </td>
                </tr>
              ) : (
                mailboxes.map((mbx) => (
                  <tr key={mbx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{mbx.name}</div>
                      {mbx.displayName && <div className="text-xs text-gray-400">{mbx.displayName}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{mbx.emailAddress}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">{mbx.providerType.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs">
                        {mbx.inboundEnabled ? (
                          <Badge variant="success" size="sm">{mbx.inboundMode}</Badge>
                        ) : (
                          <Badge variant="default" size="sm">OFF</Badge>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs">
                        {mbx.outboundEnabled ? (
                          <Badge variant="success" size="sm">{mbx.outboundMode}</Badge>
                        ) : (
                          <Badge variant="default" size="sm">OFF</Badge>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{mbx.unknownSenderPolicy.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      {mbx.isActive ? (
                        <Badge variant="success" size="sm">Active</Badge>
                      ) : (
                        <Badge variant="default" size="sm">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {mbx.lastInboundSuccessAt ? format(new Date(mbx.lastInboundSuccessAt), 'MMM d, HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(mbx)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(mbx)}
                          disabled={toggling === mbx.id}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600"
                          title={mbx.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {mbx.isActive ? <ToggleRight size={14} className="text-green-500" /> : <ToggleLeft size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            <span>Page {currentPage + 1} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 0}
                onClick={() => setFilters((f) => ({ ...f, page: currentPage - 1 }))}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setFilters((f) => ({ ...f, page: currentPage + 1 }))}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
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
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email Address *</label>
              <input
                type="email"
                value={form.emailAddress}
                onChange={(e) => setForm((f) => ({ ...f, emailAddress: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                disabled={modalMode === 'edit'}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Provider Type</label>
              <select
                value={form.providerType}
                onChange={(e) => setForm((f) => ({ ...f, providerType: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {PROVIDER_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{pt.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Inbound Mode</label>
              <select
                value={form.inboundMode}
                onChange={(e) => setForm((f) => ({ ...f, inboundMode: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {INBOUND_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Outbound Mode</label>
              <select
                value={form.outboundMode}
                onChange={(e) => setForm((f) => ({ ...f, outboundMode: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {OUTBOUND_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inboundEnabled}
                onChange={(e) => setForm((f) => ({ ...f, inboundEnabled: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Inbound Enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.outboundEnabled}
                onChange={(e) => setForm((f) => ({ ...f, outboundEnabled: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Outbound Enabled
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unknown Sender Policy</label>
            <select
              value={form.unknownSenderPolicy}
              onChange={(e) => setForm((f) => ({ ...f, unknownSenderPolicy: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {UNKNOWN_SENDER_POLICIES.map((p) => (
                <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default Group ID</label>
              <input
                value={form.defaultGroupId}
                onChange={(e) => setForm((f) => ({ ...f, defaultGroupId: e.target.value }))}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default Priority</label>
              <input
                value={form.defaultPriority}
                onChange={(e) => setForm((f) => ({ ...f, defaultPriority: e.target.value }))}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default Status</label>
              <input
                value={form.defaultStatus}
                onChange={(e) => setForm((f) => ({ ...f, defaultStatus: e.target.value }))}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving} disabled={!form.name.trim() || !form.emailAddress.trim()}>
              {modalMode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
