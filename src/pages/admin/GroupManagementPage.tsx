import { useState } from 'react'
import { useUsers } from '@/hooks/useUsers'
import { usePermissions } from '@/hooks/usePermissions'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import { groupService } from '@/services/group.service'
import type { Group } from '@/types/user.types'
import { ShieldOff, Plus, Pencil, ToggleLeft, Users } from 'lucide-react'

interface GroupFormState {
  name: string
  description: string
  memberIds: string[]
}

const EMPTY_FORM: GroupFormState = { name: '', description: '', memberIds: [] }

export function GroupManagementPage() {
  const { canManageUsers } = usePermissions()
  const { groups, users, isLoading, refetch } = useUsers()
  const { success, error } = useToast()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [form, setForm] = useState<GroupFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingGroup(null)
    setModalMode('create')
  }

  const openEdit = (g: Group) => {
    setForm({ name: g.name, description: g.description, memberIds: [...g.memberIds] })
    setEditingGroup(g)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingGroup(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const memberNames = form.memberIds.map((id) => users.find((u) => u.id === id)?.fullName ?? id)
      if (modalMode === 'create') {
        await groupService.create({
          name: form.name.trim(),
          description: form.description.trim(),
          memberIds: form.memberIds,
          memberNames,
          defaultTemplateIds: [],
          transferableToGroupIds: [],
          isActive: true,
        })
        success('Group created')
      } else if (editingGroup) {
        await groupService.update(editingGroup.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          memberIds: form.memberIds,
          memberNames,
        })
        success('Group updated')
      }
      refetch()
      closeModal()
    } catch {
      error('Failed to save group')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await groupService.deactivate(id)
      success('Group deactivated')
      refetch()
    } catch {
      error('Failed to deactivate group')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleMember = (userId: string) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(userId)
        ? f.memberIds.filter((id) => id !== userId)
        : [...f.memberIds, userId],
    }))
  }

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to manage groups."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Group Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{groups.length} groups</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          Add Group
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <tbody>
              <SkeletonRow colCount={3} />
              <SkeletonRow colCount={3} />
            </tbody>
          </table>
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-gray-400" />}
          title="No groups yet"
          description="Create your first group to start organizing agents."
          action={<Button variant="primary" size="sm" onClick={openCreate}>Add Group</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {groups.map((g) => {
            const members = users.filter((u) => g.memberIds.includes(u.id) && u.isActive)
            const inactiveCount = users.filter((u) => g.memberIds.includes(u.id) && !u.isActive).length

            return (
              <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-sm font-semibold text-gray-900">{g.name}</h2>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {members.length} active
                        {inactiveCount > 0 && `, ${inactiveCount} inactive`}
                      </span>
                      {g.openTicketCount > 0 && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                          {g.openTicketCount} open tickets
                        </span>
                      )}
                    </div>
                    {g.description && (
                      <p className="text-xs text-gray-500 mb-3">{g.description}</p>
                    )}
                    {/* Members */}
                    <div className="flex flex-wrap gap-2">
                      {members.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No active members</span>
                      ) : (
                        members.map((u) => (
                          <div key={u.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                            <Avatar name={u.fullName} color={u.avatarColor} size="sm" />
                            <span className="text-xs text-gray-700 font-medium">{u.fullName}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit group"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(g.id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Deactivate group"
                    >
                      <ToggleLeft size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Create New Group' : 'Edit Group'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={saving}
              disabled={!form.name.trim()}
              onClick={handleSave}
            >
              {modalMode === 'create' ? 'Create Group' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Group Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g. Trade Operations"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Brief description of this group's purpose"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Members <span className="text-gray-400 font-normal">({form.memberIds.length} selected)</span>
            </label>
            <div className="space-y-1 max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {users.filter((u) => u.isActive).map((u) => (
                <label key={u.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded">
                  <input
                    type="checkbox"
                    checked={form.memberIds.includes(u.id)}
                    onChange={() => toggleMember(u.id)}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <Avatar name={u.fullName} color={u.avatarColor} size="sm" />
                  <div>
                    <div className="text-sm text-gray-800 font-medium">{u.fullName}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </div>
                </label>
              ))}
              {users.filter((u) => u.isActive).length === 0 && (
                <p className="text-xs text-gray-400 px-2">No active users available</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Deactivate Group"
        message="This group will be deactivated and hidden from assignment flows. You can reactivate it later."
        confirmLabel="Deactivate"
        isDestructive
      />
    </div>
  )
}
