import { useState } from 'react'
import { useUsers } from '@/hooks/useUsers'
import { usePermissions } from '@/hooks/usePermissions'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/shared/Button'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/shared/Badge'
import { useToast } from '@/hooks/useToast'
import { ShieldOff, Shield, Pencil, Check, X, Plus, Trash2 } from 'lucide-react'
import { ROLE_LABELS } from '@/constants/enums'
import type { UserRole } from '@/types/common.types'

type PermKey =
  | 'canManageUsers'
  | 'canViewAdminPool'
  | 'canAssignTickets'
  | 'canTransferTickets'
  | 'canCloseTickets'
  | 'canChangePriority'
  | 'canAddPublicReply'
  | 'canAddInternalNote'
  | 'canViewReports'
  | 'canExport'

const PERM_LABELS: Record<PermKey, { label: string; description: string }> = {
  canManageUsers:     { label: 'Manage Users & Roles',  description: 'Create, edit, deactivate users and groups' },
  canViewAdminPool:   { label: 'View Admin Pool',        description: 'Access the unassigned ticket pool' },
  canAssignTickets:   { label: 'Assign Tickets',         description: 'Assign tickets to agents' },
  canTransferTickets: { label: 'Transfer Tickets',       description: 'Transfer tickets between groups' },
  canCloseTickets:    { label: 'Close Tickets',          description: 'Mark tickets as closed/resolved' },
  canChangePriority:  { label: 'Change Priority',        description: 'Change ticket priority level' },
  canAddPublicReply:  { label: 'Send Customer Reply',    description: 'Reply to customers (email out)' },
  canAddInternalNote: { label: 'Add Internal Note',      description: 'Write notes visible only to team' },
  canViewReports:     { label: 'View Reports',           description: 'Access the reports & analytics page' },
  canExport:          { label: 'Export Data',            description: 'Export ticket and report data' },
}

const PERM_KEYS = Object.keys(PERM_LABELS) as PermKey[]

const ALL_SYSTEM_ROLES: UserRole[] = ['admin', 'supervisor', 'trade_agent', 'operation_agent', 'viewer']

const DEFAULT_MATRIX: Record<UserRole, Record<PermKey, boolean>> = {
  admin: {
    canManageUsers: true, canViewAdminPool: true, canAssignTickets: true,
    canTransferTickets: true, canCloseTickets: true, canChangePriority: true,
    canAddPublicReply: true, canAddInternalNote: true, canViewReports: true, canExport: true,
  },
  supervisor: {
    canManageUsers: false, canViewAdminPool: true, canAssignTickets: true,
    canTransferTickets: true, canCloseTickets: true, canChangePriority: true,
    canAddPublicReply: true, canAddInternalNote: true, canViewReports: true, canExport: true,
  },
  trade_agent: {
    canManageUsers: false, canViewAdminPool: false, canAssignTickets: false,
    canTransferTickets: true, canCloseTickets: true, canChangePriority: false,
    canAddPublicReply: true, canAddInternalNote: true, canViewReports: true, canExport: false,
  },
  operation_agent: {
    canManageUsers: false, canViewAdminPool: false, canAssignTickets: false,
    canTransferTickets: true, canCloseTickets: true, canChangePriority: false,
    canAddPublicReply: true, canAddInternalNote: true, canViewReports: true, canExport: false,
  },
  viewer: {
    canManageUsers: false, canViewAdminPool: false, canAssignTickets: false,
    canTransferTickets: false, canCloseTickets: false, canChangePriority: false,
    canAddPublicReply: false, canAddInternalNote: false, canViewReports: true, canExport: false,
  },
}

const EMPTY_PERMS: Record<PermKey, boolean> = Object.fromEntries(
  PERM_KEYS.map((k) => [k, false]),
) as Record<PermKey, boolean>

interface CustomRole {
  id: string
  name: string
  description: string
  perms: Record<PermKey, boolean>
}

export function RoleManagementPage() {
  const { canManageUsers } = usePermissions()
  const { users } = useUsers()
  const { success } = useToast()

  const [matrix, setMatrix] = useState(DEFAULT_MATRIX)
  const [descriptions, setDescriptions] = useState<Record<UserRole, string>>({
    admin:           'Full system access. Can manage users, groups, roles and all operations.',
    supervisor:      'Team oversight and administration. Can assign, transfer and view reports.',
    trade_agent:     'Handles trade-related tickets. Can reply, close and transfer tickets.',
    operation_agent: 'Handles operations tickets. Can reply, close and transfer tickets.',
    viewer:          'Read-only access. Can view tickets and reports but cannot take actions.',
  })

  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [hiddenSystemRoles, setHiddenSystemRoles] = useState<UserRole[]>([])

  const [editingRole, setEditingRole] = useState<UserRole | null>(null)
  const [editForm, setEditForm] = useState<{ description: string; perms: Record<PermKey, boolean> } | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<{ name: string; description: string; perms: Record<PermKey, boolean> }>({
    name: '', description: '', perms: { ...EMPTY_PERMS },
  })
  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingSystemRole, setDeletingSystemRole] = useState<UserRole | null>(null)
  const [deleting, setDeleting] = useState(false)

  const userCountByRole = (role: UserRole) => users.filter((u) => u.role === role && u.isActive).length
  const visibleSystemRoles = ALL_SYSTEM_ROLES.filter((r) => !hiddenSystemRoles.includes(r))

  // System role edit
  const openEdit = (role: UserRole) => {
    setEditForm({ description: descriptions[role], perms: { ...matrix[role] } })
    setEditingRole(role)
  }
  const closeEdit = () => { setEditingRole(null); setEditForm(null) }
  const toggleEditPerm = (key: PermKey) => {
    setEditForm((f) => f ? { ...f, perms: { ...f.perms, [key]: !f.perms[key] } } : f)
  }
  const handleSaveEdit = () => {
    if (!editingRole || !editForm) return
    setMatrix((m) => ({ ...m, [editingRole]: editForm.perms }))
    setDescriptions((d) => ({ ...d, [editingRole]: editForm.description }))
    success(`${ROLE_LABELS[editingRole]} guncellendi`)
    closeEdit()
  }

  // Custom role create
  const openCreate = () => {
    setCreateForm({ name: '', description: '', perms: { ...EMPTY_PERMS } })
    setShowCreate(true)
  }
  const closeCreate = () => setShowCreate(false)
  const toggleCreatePerm = (key: PermKey) => {
    setCreateForm((f) => ({ ...f, perms: { ...f.perms, [key]: !f.perms[key] } }))
  }
  const handleCreate = async () => {
    if (!createForm.name.trim()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))
    setCustomRoles((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        perms: { ...createForm.perms },
      },
    ])
    success(`"${createForm.name.trim()}" rolu olusturuldu`)
    setSaving(false)
    closeCreate()
  }

  // Custom role delete
  const handleDeleteCustom = async () => {
    if (!deletingId) return
    setDeleting(true)
    await new Promise((r) => setTimeout(r, 300))
    setCustomRoles((prev) => prev.filter((r) => r.id !== deletingId))
    success('Rol silindi')
    setDeleting(false)
    setDeletingId(null)
  }

  // System role delete
  const handleDeleteSystem = async () => {
    if (!deletingSystemRole) return
    setDeleting(true)
    await new Promise((r) => setTimeout(r, 300))
    setHiddenSystemRoles((prev) => [...prev, deletingSystemRole])
    success(`${ROLE_LABELS[deletingSystemRole]} silindi`)
    setDeleting(false)
    setDeletingSystemRole(null)
  }

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to manage roles."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define what each role can access and do within the system.
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus size={16} />} onClick={openCreate}>
          Yeni Rol
        </Button>
      </div>

      {/* System role cards */}
      {visibleSystemRoles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Sistem Rolleri</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleSystemRoles.map((role) => {
              const count = userCountByRole(role)
              const perms = matrix[role]
              const activePermCount = PERM_KEYS.filter((k) => perms[k]).length
              return (
                <div key={role} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-50">
                        <Shield size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{ROLE_LABELS[role]}</div>
                        <div className="text-xs text-gray-400">{count} active user{count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" size="sm">{activePermCount}/{PERM_KEYS.length}</Badge>
                      <button
                        type="button"
                        onClick={() => openEdit(role)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Duzenle"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingSystemRole(role)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">{descriptions[role]}</p>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {PERM_KEYS.map((key) => (
                      <div key={key} className="flex items-center gap-1.5">
                        {perms[key] ? (
                          <Check size={11} className="text-emerald-500 shrink-0" />
                        ) : (
                          <X size={11} className="text-gray-300 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${perms[key] ? 'text-gray-700' : 'text-gray-400'}`}>
                          {PERM_LABELS[key].label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1">
                    {users.filter((u) => u.role === role && u.isActive).slice(0, 5).map((u) => (
                      <span key={u.id} title={u.fullName}>
                        <Avatar name={u.fullName} color={u.avatarColor} size="sm" />
                      </span>
                    ))}
                    {count > 5 && <span className="text-xs text-gray-400 self-center ml-1">+{count - 5}</span>}
                    {count === 0 && <span className="text-xs text-gray-400 italic">No users assigned</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Custom role cards */}
      {customRoles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ozel Roller</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {customRoles.map((role) => {
              const activePermCount = PERM_KEYS.filter((k) => role.perms[k]).length
              return (
                <div key={role.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-50">
                        <Shield size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                        <div className="text-xs text-gray-400">Ozel rol</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" size="sm">{activePermCount}/{PERM_KEYS.length}</Badge>
                      <button
                        type="button"
                        onClick={() => setDeletingId(role.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {role.description && (
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">{role.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {PERM_KEYS.map((key) => (
                      <div key={key} className="flex items-center gap-1.5">
                        {role.perms[key] ? (
                          <Check size={11} className="text-emerald-500 shrink-0" />
                        ) : (
                          <X size={11} className="text-gray-300 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${role.perms[key] ? 'text-gray-700' : 'text-gray-400'}`}>
                          {PERM_LABELS[key].label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Edit System Role Modal */}
      {editingRole && editForm && (
        <Modal
          isOpen
          onClose={closeEdit}
          title={`Duzenle - ${ROLE_LABELS[editingRole]}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={closeEdit}>Iptal</Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit}>Kaydet</Button>
            </>
          }
        >
          <div className="space-y-4 py-1">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Aciklama</label>
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => f ? { ...f, description: e.target.value } : f)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Izinler</label>
              <div className="space-y-1 border border-gray-200 rounded-lg p-2 max-h-72 overflow-y-auto">
                {PERM_KEYS.map((key) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 px-2 py-2 rounded cursor-pointer hover:bg-gray-50 ${
                      editingRole === 'admin' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={editForm.perms[key]}
                      disabled={editingRole === 'admin'}
                      onChange={() => editingRole !== 'admin' && toggleEditPerm(key)}
                      className="rounded border-gray-300 text-indigo-600 mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{PERM_LABELS[key].label}</div>
                      <div className="text-xs text-gray-400">{PERM_LABELS[key].description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {editingRole === 'admin' && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <Shield size={11} /> Admin her zaman tum izinlere sahiptir.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Custom Role Modal */}
      <Modal
        isOpen={showCreate}
        onClose={closeCreate}
        title="Yeni Rol Olustur"
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeCreate} disabled={saving}>Iptal</Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              isLoading={saving}
              disabled={!createForm.name.trim()}
            >
              Olustur
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-1">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Rol Adi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="or. Fatura Uzmani"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Aciklama <span className="text-gray-400 font-normal">(istege bagli)</span>
            </label>
            <input
              type="text"
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Bu rolun sorumluluklarini aciklayin"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Izinler</label>
            <div className="space-y-1 border border-gray-200 rounded-lg p-2 max-h-64 overflow-y-auto">
              {PERM_KEYS.map((key) => (
                <label key={key} className="flex items-start gap-3 px-2 py-2 rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={createForm.perms[key]}
                    onChange={() => toggleCreatePerm(key)}
                    className="rounded border-gray-300 text-indigo-600 mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{PERM_LABELS[key].label}</div>
                    <div className="text-xs text-gray-400">{PERM_LABELS[key].description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Custom Role Confirm */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteCustom}
        title="Rolu Sil"
        message={`"${customRoles.find((r) => r.id === deletingId)?.name ?? ''}" rolunu kalici olarak silmek istediginizden emin misiniz?`}
        confirmLabel="Sil"
        isDestructive
        isLoading={deleting}
      />

      {/* Delete System Role Confirm */}
      <ConfirmModal
        isOpen={!!deletingSystemRole}
        onClose={() => setDeletingSystemRole(null)}
        onConfirm={handleDeleteSystem}
        title="Rolu Sil"
        message={`"${deletingSystemRole ? ROLE_LABELS[deletingSystemRole] : ''}" rolunu kaldirmak istediginizden emin misiniz?`}
        confirmLabel="Sil"
        isDestructive
        isLoading={deleting}
      />
    </div>
  )
}