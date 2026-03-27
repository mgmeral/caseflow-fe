import { useState } from 'react'
import { useUsers } from '@/hooks/useUsers'
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
import type { UserRole } from '@/types/common.types'
import { ShieldOff, UserPlus, Pencil, UserX, UserCheck, Trash2 } from 'lucide-react'
import { ROLE_LABELS, AVATAR_COLORS } from '@/constants/enums'

const ROLES: UserRole[] = ['admin', 'supervisor', 'trade_agent', 'operation_agent', 'viewer']

interface UserFormState {
  firstName: string
  lastName: string
  email: string
  role: UserRole
  groupIds: string[]
}

const EMPTY_FORM: UserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'operation_agent',
  groupIds: [],
}

export function UserManagementPage() {
  const { canManageUsers } = usePermissions()
  const { users, groups, isLoading, refetch } = useUsers()
  const { success, error } = useToast()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingUser(null)
    setModalMode('create')
  }

  const openEdit = (u: User) => {
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
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
    if (!form.firstName.trim() || !form.email.trim()) return
    setSaving(true)
    try {
      const groupNames = form.groupIds.map((id) => groups.find((g) => g.id === id)?.name ?? id)
      if (modalMode === 'create') {
        await userService.create({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email.trim(),
          role: form.role,
          groupIds: form.groupIds,
          groupNames,
          adminLevel: 0,
          isActive: true,
          lastLoginAt: null,
          avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        })
        success('User created')
      } else if (editingUser) {
        await userService.update(editingUser.id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email.trim(),
          role: form.role,
          groupIds: form.groupIds,
          groupNames,
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
      await userService.update(userId, { isActive: true })
      success('User reactivated')
      refetch()
    } catch {
      error('Failed to reactivate user')
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      await userService.delete(userId)
      success('User deleted')
      refetch()
    } catch {
      error('Failed to delete user')
    } finally {
      setDeletingId(null)
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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} users total</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<UserPlus size={14} />} onClick={openCreate}>
          Add User
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <table className="w-full">
            <tbody>
              <SkeletonRow colCount={5} />
              <SkeletonRow colCount={5} />
              <SkeletonRow colCount={5} />
            </tbody>
          </table>
        ) : users.length === 0 ? (
          <EmptyState title="No users" description="No users found." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Groups</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Open Tickets</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.fullName} color={u.avatarColor} size="sm" />
                      <div>
                        <div className="font-medium text-gray-800">{u.fullName}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.groupNames.join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{u.openTicketCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'default'} size="sm">
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit user"
                      >
                        <Pencil size={14} />
                      </button>
                      {u.isActive ? (
                        <button
                          type="button"
                          onClick={() => setDeactivatingId(u.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Deactivate user"
                        >
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivate(u.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Reactivate user"
                        >
                          <UserCheck size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeletingId(u.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
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
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={saving}
              disabled={!form.firstName.trim() || !form.email.trim()}
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
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
                  {g.description && <span className="text-xs text-gray-400">— {g.description}</span>}
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
      />

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Delete User"
        message="This action is permanent and cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />
    </div>
  )
}
