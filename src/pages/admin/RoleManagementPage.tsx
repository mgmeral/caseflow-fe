import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRolesQuery, usePermissionDefsQuery } from '@/hooks/useUsers'
import { usePermissions } from '@/hooks/usePermissions'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { useToast } from '@/hooks/useToast'
import { roleService } from '@/services/role.service'
import type { RoleRecord, RoleSummaryRecord, PermissionDef } from '@/types/user.types'
import type { RoleTicketScope } from '@/types/api.types'
import { ShieldOff, Shield, Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

interface RoleFormState {
  code: string
  name: string
  description: string
  ticketScope: RoleTicketScope
  permissions: string[]
}

const TICKET_SCOPE_OPTIONS: RoleTicketScope[] = ['ALL', 'OWN_GROUPS', 'OWN_AND_OWN_GROUPS', 'ASSIGNED_ONLY']

function groupPermsByCategory(defs: PermissionDef[]): { category: string; defs: PermissionDef[] }[] {
  const map = new Map<string, PermissionDef[]>()
  for (const d of defs) {
    const cat = d.category ?? 'Other'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(d)
  }
  return Array.from(map.entries()).map(([category, grouped]) => ({ category, defs: grouped }))
}

function isValidRoleCode(code: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(code.trim())
}

interface PermChecklistProps {
  categories: { category: string; defs: PermissionDef[] }[]
  selected: string[]
  onChange: (codes: string[]) => void
  disabled?: boolean
}

function PermChecklist({ categories, selected, onChange, disabled }: PermChecklistProps) {
  const selectedSet = new Set(selected)

  const toggle = (code: string) => {
    if (disabled) return
    onChange(selectedSet.has(code) ? selected.filter((c) => c !== code) : [...selected, code])
  }

  return (
    <div className="space-y-3 border border-gray-200 rounded-lg p-3 max-h-72 overflow-y-auto">
      {categories.map(({ category, defs }) => (
        <div key={category}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{category}</p>
          <div className="space-y-0.5">
            {defs.map((d) => (
              <label
                key={d.code}
                className={`flex items-start gap-3 px-2 py-2 rounded ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(d.code)}
                  disabled={disabled}
                  onChange={() => toggle(d.code)}
                  className="rounded border-gray-300 text-indigo-600 mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">{d.label}</div>
                  {d.description && <div className="text-xs text-gray-400">{d.description}</div>}
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function RoleManagementPage() {
  const { canManageRoles } = usePermissions()
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const rolesQuery = useRolesQuery()
  const permsQuery = usePermissionDefsQuery()
  const roles = rolesQuery.data ?? []
  const permDefs = permsQuery.data ?? []
  const categories = groupPermsByCategory(permDefs)

  const [editingRole, setEditingRole] = useState<RoleSummaryRecord | null>(null)
  const [editForm, setEditForm] = useState<RoleFormState | null>(null)
  const [isLoadingEditRole, setIsLoadingEditRole] = useState(false)
  const [saving, setSaving] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<RoleFormState>({
    code: '',
    name: '',
    description: '',
    ticketScope: 'ASSIGNED_ONLY',
    permissions: [],
  })
  const [creating, setCreating] = useState(false)

  const [deletingRole, setDeletingRole] = useState<RoleSummaryRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const editingRoleId = editingRole?.id ?? null

  const openEdit = (role: RoleSummaryRecord) => {
    setEditForm(null)
    setEditingRole(role)
  }

  useEffect(() => {
    if (!editingRoleId) return

    let cancelled = false

    const loadRoleDetail = async () => {
      setIsLoadingEditRole(true)
      try {
        const role = await roleService.getById(editingRoleId)
        if (cancelled) return

        setEditForm({
          code: role.code,
          name: role.name,
          description: role.description ?? '',
          ticketScope: role.ticketScope,
          permissions: [...role.permissions],
        })
      } catch {
        if (!cancelled) {
          error('Failed to load role details')
          setEditingRole(null)
          setEditForm(null)
        }
      } finally {
        if (!cancelled) setIsLoadingEditRole(false)
      }
    }

    loadRoleDetail()

    return () => {
      cancelled = true
    }
  }, [editingRoleId])

  const closeEdit = () => {
    setEditingRole(null)
    setEditForm(null)
    setIsLoadingEditRole(false)
  }

  const handleSaveEdit = async () => {
    if (!editingRole || !editForm || !editForm.name.trim() || !isValidRoleCode(editForm.code)) return
    setSaving(true)
    try {
      await roleService.update(editingRole.id, {
        code: editForm.code.trim(),
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        ticketScope: editForm.ticketScope,
        permissions: editForm.permissions,
      })
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      success(`"${editForm.name.trim()}" updated`)
      closeEdit()
    } catch {
      error('Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
    setCreateForm({
      code: '',
      name: '',
      description: '',
      ticketScope: 'ASSIGNED_ONLY',
      permissions: [],
    })
    setShowCreate(true)
  }

  const handleCreate = async () => {
    if (!createForm.name.trim() || !isValidRoleCode(createForm.code)) return
    setCreating(true)
    try {
      await roleService.create({
        code: createForm.code.trim(),
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        ticketScope: createForm.ticketScope,
        permissions: createForm.permissions,
      })
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      success(`"${createForm.name.trim()}" created`)
      setShowCreate(false)
    } catch {
      error('Failed to create role')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (role: RoleSummaryRecord) => {
    try {
      if (role.isActive) {
        await roleService.deactivate(role.id)
        success(`"${role.name}" deactivated`)
      } else {
        await roleService.activate(role.id)
        success(`"${role.name}" activated`)
      }
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch {
      error('Failed to update role status')
    }
  }

  const handleDelete = async () => {
    if (!deletingRole) return
    setDeleting(true)
    try {
      await roleService.delete(deletingRole.id)
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      success(`"${deletingRole.name}" deleted`)
      setDeletingRole(null)
    } catch {
      error('Failed to delete role')
    } finally {
      setDeleting(false)
    }
  }

  if (!canManageRoles) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Define what each role can access and do within the system.</p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus size={16} />} onClick={openCreate}>
          New Role
        </Button>
      </div>

      {rolesQuery.isLoading ? (
        <p className="text-sm text-gray-400">Loading roles...</p>
      ) : roles.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-8 h-8 text-gray-400" />}
          title="No roles defined"
          description="Create your first role to start assigning permissions."
          action={<Button variant="primary" size="sm" onClick={openCreate}>New Role</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            return (
              <div
                key={role.id}
                className={`bg-white rounded-xl border p-5 hover:border-indigo-200 transition-colors ${
                  role.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${role.isActive ? 'bg-indigo-50' : 'bg-gray-100'}`}>
                      <Shield size={16} className={role.isActive ? 'text-indigo-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{role.code}</div>
                      <div className="text-xs text-gray-400">Scope: {role.ticketScope}</div>
                      <div className="text-xs text-gray-400">
                        {role.userCount != null ? `${role.userCount} user${role.userCount !== 1 ? 's' : ''}` : ''}
                        {!role.isActive && <span className="ml-1 text-amber-600">Inactive</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" size="sm">{role.permissionCount} perms</Badge>
                    <button
                      type="button"
                      onClick={() => openEdit(role)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(role)}
                      className={`p-1.5 rounded-md transition-colors ${
                        role.isActive
                          ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title={role.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {role.isActive ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingRole(role)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>{role.permissionCount} assigned permission{role.permissionCount !== 1 ? 's' : ''}</span>
                  {role.userCount != null && <span>{role.userCount} user{role.userCount !== 1 ? 's' : ''}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editingRole && (
        <Modal
          isOpen
          onClose={closeEdit}
          title={`Edit - ${editingRole.name}`}
          size="md"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={closeEdit} disabled={saving}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={saving}
                disabled={isLoadingEditRole || !editForm || !editForm.name.trim() || !isValidRoleCode(editForm.code)}
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </div>
          }
        >
          {isLoadingEditRole || !editForm ? (
            <div className="py-8 text-sm text-gray-400 text-center">Loading role details...</div>
          ) : (
            <div className="space-y-4 py-1">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm((f) => f ? { ...f, code: e.target.value.toUpperCase() } : f)}
                  placeholder="e.g. SENIOR_AGENT"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {!isValidRoleCode(editForm.code) && <p className="text-xs text-red-500 mt-1">Use uppercase letters, numbers, and underscores only.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => f ? { ...f, name: e.target.value } : f)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => f ? { ...f, description: e.target.value } : f)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ticket Scope <span className="text-red-500">*</span></label>
                <select
                  value={editForm.ticketScope}
                  onChange={(e) => setEditForm((f) => f ? { ...f, ticketScope: e.target.value as RoleTicketScope } : f)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  {TICKET_SCOPE_OPTIONS.map((scope) => (
                    <option key={scope} value={scope}>{scope}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Permissions</label>
                <PermChecklist
                  categories={categories}
                  selected={editForm.permissions}
                  onChange={(codes) => setEditForm((f) => f ? { ...f, permissions: codes } : f)}
                />
              </div>
            </div>
          )}
        </Modal>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Role"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={creating}
              disabled={!createForm.name.trim() || !isValidRoleCode(createForm.code)}
              onClick={handleCreate}
            >
              Create Role
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Code <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={createForm.code}
              onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. SENIOR_AGENT"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {!isValidRoleCode(createForm.code) && createForm.code.length > 0 && <p className="text-xs text-red-500 mt-1">Use uppercase letters, numbers, and underscores only.</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Role Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Senior Agent"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe this role's responsibilities"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ticket Scope <span className="text-red-500">*</span></label>
            <select
              value={createForm.ticketScope}
              onChange={(e) => setCreateForm((f) => ({ ...f, ticketScope: e.target.value as RoleTicketScope }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              {TICKET_SCOPE_OPTIONS.map((scope) => (
                <option key={scope} value={scope}>{scope}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Permissions</label>
            <PermChecklist
              categories={categories}
              selected={createForm.permissions}
              onChange={(codes) => setCreateForm((f) => ({ ...f, permissions: codes }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Delete "${deletingRole?.name ?? ''}"? This cannot be undone. Users with this role will lose their permissions.`}
        confirmLabel="Delete"
        isDestructive
        isLoading={deleting}
      />
    </div>
  )
}
