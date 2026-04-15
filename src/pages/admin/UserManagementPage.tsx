import { useState } from 'react'
import { useUsers } from '@/hooks/useUsers'
import { useRolesQuery } from '@/hooks/useUsers'
import { usePermissions } from '@/hooks/usePermissions'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import { userService } from '@/services/user.service'
import type { User } from '@/types/user.types'
import { ShieldOff, UserPlus, Pencil, UserX, UserCheck, Users, Settings2 } from 'lucide-react'
import { ROLE_LABELS } from '@/constants/enums'

interface UserFormState {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  roleId: string
  groupIds: string[]
}

const EMPTY_FORM: UserFormState = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  roleId: '',
  groupIds: [],
}

export function UserManagementPage() {
  const { canManageUsers } = usePermissions()
  const { users, groups, isLoading, refetch } = useUsers()
  const rolesQuery = useRolesQuery()
  const roles = rolesQuery.data ?? []
  const { success, error } = useToast()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)

  const resolveRoleId = (u: User): string => {
    if (u.roleId) return u.roleId
    const byCode = roles.find((r) => r.code === u.roleCode)
    if (byCode) return byCode.id
    const byName = roles.find((r) => r.name === u.roleName)
    if (byName) return byName.id
    return roles[0]?.id ?? ''
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, roleId: roles[0]?.id ?? '' })
    setEditingUser(null)
    setModalMode('create')
  }

  const openEdit = (u: User) => {
    const fallbackUsername = u.email.includes('@') ? u.email.split('@')[0] : ''
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username ?? fallbackUsername,
      email: u.email,
      password: '',
      roleId: resolveRoleId(u),
      groupIds: [...u.groupIds],
    })
    setEditingUser(u)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingUser(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.email.trim() || !form.roleId) return
    if (modalMode === 'create' && (!form.username.trim() || form.password.length < 8)) return
    setSaving(true)
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
      const groupIdsNum = form.groupIds.map(Number).filter((n) => !Number.isNaN(n))
      if (modalMode === 'create') {
        await userService.create({
          username: form.username.trim(),
          fullName,
          email: form.email.trim(),
          password: form.password,
          roleId: form.roleId,
          groupIds: groupIdsNum,
          isActive: true,
        })
        success('User created')
      } else if (editingUser) {
        await userService.update(editingUser.id, {
          username: form.username.trim(),
          fullName,
          email: form.email.trim(),
          roleId: form.roleId,
          groupIds: groupIdsNum,
          isActive: editingUser.isActive,
          ...(form.password ? { password: form.password } : {}),
        })
        success('User updated')
      }
      refetch()
      closeModal()
    } catch {
      error('Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (userId: string) => {
    try {
      await userService.deactivate(userId)
      success('User deactivated')
      refetch()
    } catch {
      error('Failed to deactivate user')
    } finally {
      setDeactivatingId(null)
    }
  }

  const handleReactivate = async (userId: string) => {
    try {
      await userService.activate(userId)
      success('User reactivated')
      refetch()
    } catch {
      error('Failed to reactivate user')
    }
  }

  const toggleGroup = (groupId: string) => {
    setForm((f) => ({
      ...f,
      groupIds: f.groupIds.includes(groupId)
        ? f.groupIds.filter((id) => id !== groupId)
        : [...f.groupIds, groupId],
    }))
  }

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to manage users."
        />
      </div>
    )
  }

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header relative z-10">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">{users.length} users total</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<UserPlus size={14} />} onClick={openCreate}>
          Add User
        </Button>
      </div>

      <div className="admin-table-shell relative z-10 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-100/70" />
            <h2 className="text-sm font-semibold text-blue-50">All Users</h2>
          </div>
          <span className="admin-badge">{users.length} records</span>
        </div>

        {isLoading ? (
          <table className="w-full">
            <tbody>
              <SkeletonRow colCount={6} />
              <SkeletonRow colCount={6} />
              <SkeletonRow colCount={6} />
            </tbody>
          </table>
        ) : users.length === 0 ? (
          <EmptyState title="No users" description="No users found." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">Username</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">Groups</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">Open Tickets</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-blue-100/72">Action</th>
              </tr>
            </thead>
            <tbody className="admin-table-striped divide-y divide-white/10">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-white/[0.08]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.fullName} color={u.avatarColor} size="sm" />
                      <div>
                        <div className="font-medium text-white">{u.fullName}</div>
                        <div className="text-xs text-blue-100/60">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-blue-100/72">{u.username ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="admin-badge">
                      {u.roleName ?? u.roleCode ?? ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-blue-100/72">{u.groupNames.join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-sm text-blue-50/86">{u.openTicketCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'default'} size="sm">
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Settings2 size={12} />}
                        onClick={() => openEdit(u)}
                      >
                        Manage
                      </Button>
                      {u.isActive ? (
                        <button
                          type="button"
                          onClick={() => setDeactivatingId(u.id)}
                          className="rounded-md p-1.5 text-blue-100/58 transition-colors hover:bg-amber-500/12 hover:text-amber-200"
                          title="Deactivate user"
                        >
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivate(u.id)}
                          className="rounded-md p-1.5 text-blue-100/58 transition-colors hover:bg-emerald-500/12 hover:text-emerald-200"
                          title="Reactivate user"
                        >
                          <UserCheck size={14} />
                        </button>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Add New User' : 'Edit User'}
        size="md"
        variant="admin"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={saving}
              disabled={
                !form.firstName.trim() ||
                !form.email.trim() ||
                !form.roleId ||
                !form.username.trim() ||
                (modalMode === 'create' && (!form.username.trim() || form.password.length < 8))
              }
              onClick={handleSave}
            >
              {modalMode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Ahmet"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Yılmaz"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="ahmet.yilmaz"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="ahmet@firma.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {modalMode === 'create' ? <>Password <span className="text-red-500">*</span></> : 'New Password'}
              {modalMode === 'edit' && <span className="text-gray-400 font-normal"> — leave blank to keep current</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder={modalMode === 'create' ? 'Min 8 characters' : '••••••••'}
              autoComplete="new-password"
            />
            {modalMode === 'create' && form.password.length > 0 && form.password.length < 8 && (
              <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.roleId}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={rolesQuery.isLoading || roles.length === 0}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {!rolesQuery.isLoading && roles.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No roles available from backend.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Groups</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {groups.map((g) => (
                <label key={g.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={form.groupIds.includes(g.id)}
                    onChange={() => toggleGroup(g.id)}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{g.name}</span>
                  <span className="text-xs text-gray-400">({g.groupTypeName})</span>
                </label>
              ))}
              {groups.length === 0 && <p className="text-xs text-gray-400 px-2">No groups available</p>}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deactivatingId}
        onClose={() => setDeactivatingId(null)}
        onConfirm={() => deactivatingId && handleDeactivate(deactivatingId)}
        title="Deactivate User"
        message="This user will lose access to the system. You can reactivate them later."
        confirmLabel="Deactivate"
        isDestructive
        variant="admin"
      />

    </div>
  )
}
