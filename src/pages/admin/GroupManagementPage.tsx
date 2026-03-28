import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUsers, useGroupTypesQuery } from '@/hooks/useUsers'
import { usePermissions } from '@/hooks/usePermissions'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import { groupService } from '@/services/group.service'
import { groupTypeService } from '@/services/groupType.service'
import type { Group } from '@/types/user.types'
import { ShieldOff, Plus, Pencil, ToggleLeft, ToggleRight, Users } from 'lucide-react'

interface GroupFormState {
  name: string
  groupTypeId: string
  description: string
  memberIds: string[]
}

const EMPTY_FORM: GroupFormState = { name: '', groupTypeId: '', description: '', memberIds: [] }

export function GroupManagementPage() {
  const { canManageUsers } = usePermissions()
  const { groups, users, isLoading, refetch } = useUsers()
  const { data: groupTypes = [] } = useGroupTypesQuery()
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [form, setForm] = useState<GroupFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // New group type mini-modal
  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [newTypeForm, setNewTypeForm] = useState({ code: '', name: '', description: '' })
  const [savingType, setSavingType] = useState(false)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingGroup(null)
    setModalMode('create')
  }

  const openEdit = (g: Group) => {
    setForm({
      name: g.name,
      groupTypeId: g.groupTypeId,
      description: g.description,
      memberIds: [...g.memberIds],
    })
    setEditingGroup(g)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingGroup(null)
    setForm(EMPTY_FORM)
  }

  const openTypeModal = () => {
    setNewTypeForm({ code: '', name: '', description: '' })
    setTypeModalOpen(true)
  }

  const handleCreateGroupType = async () => {
    if (!newTypeForm.code.trim() || !newTypeForm.name.trim()) return
    setSavingType(true)
    try {
      const created = await groupTypeService.create({
        code: newTypeForm.code.trim().toUpperCase(),
        name: newTypeForm.name.trim(),
        ...(newTypeForm.description.trim() ? { description: newTypeForm.description.trim() } : {}),
      })
      await queryClient.invalidateQueries({ queryKey: ['group-types'] })
      setForm((f) => ({ ...f, groupTypeId: created.id }))
      setTypeModalOpen(false)
      success(`Group type "${created.name}" created`)
    } catch {
      error('Failed to create group type')
    } finally {
      setSavingType(false)
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

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        groupTypeId: Number(form.groupTypeId),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        userIds: form.memberIds.map(Number),
      }
      if (modalMode === 'create') {
        await groupService.create(payload)
        success('Group created')
      } else if (editingGroup) {
        await groupService.update(editingGroup.id, payload)
        success('Group updated')
      } else {
        return
      }
      refetch()
      closeModal()
    } catch {
      error('Failed to save group')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: string) => {
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

  const handleReactivate = async (id: string) => {
    try {
      await groupService.activate(id)
      success('Group reactivated')
      refetch()
    } catch {
      error('Failed to reactivate group')
    }
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
            // Use backend-provided memberIds; also show avatars for users we have locally
            const memberUsers = users.filter((u) => g.memberIds.includes(u.id) && u.isActive)

            return (
              <div
                key={g.id}
                className={`bg-white rounded-xl border p-5 hover:border-indigo-200 transition-colors ${
                  g.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h2 className="text-sm font-semibold text-gray-900">{g.name}</h2>
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">
                        {g.groupTypeName}
                      </span>
                      {!g.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {g.memberCount} member{g.memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {g.description && (
                      <p className="text-xs text-gray-500 mb-2">{g.description}</p>
                    )}
                    {g.memberCount === 0 ? (
                      <p className="text-xs text-gray-400 italic">No members — assign via edit</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {memberUsers.map((u) => (
                          <div key={u.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                            <Avatar name={u.fullName} color={u.avatarColor} size="sm" />
                            <span className="text-xs text-gray-700 font-medium">{u.fullName}</span>
                          </div>
                        ))}
                        {g.memberCount > memberUsers.length && (
                          <span className="text-xs text-gray-400 italic self-center">
                            +{g.memberCount - memberUsers.length} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit group"
                    >
                      <Pencil size={14} />
                    </button>
                    {g.isActive ? (
                      <button
                        type="button"
                        onClick={() => setDeletingId(g.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Deactivate group"
                      >
                        <ToggleLeft size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReactivate(g.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="Reactivate group"
                      >
                        <ToggleRight size={14} />
                      </button>
                    )}
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
              disabled={!form.name.trim() || !form.groupTypeId}
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
              placeholder="e.g. Trade Desk"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <select
                value={form.groupTypeId}
                onChange={(e) => setForm((f) => ({ ...f, groupTypeId: e.target.value }))}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="" disabled>Select type…</option>
                {groupTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={openTypeModal}
                title="Add new group type"
                className="shrink-0 px-2.5 border border-gray-300 rounded-lg text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              maxLength={1000}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Optional. Brief description of this group’s purpose."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Members
              <span className="text-gray-400 font-normal ml-1">({form.memberIds.length} selected)</span>
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
                <p className="text-xs text-gray-400 px-2 py-2">No active users available</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDeactivate(deletingId)}
        title="Deactivate Group"
        message="This group will be deactivated. Members keep their group association — reassign open tickets before deactivating."
        confirmLabel="Deactivate"
        isDestructive
      />

      {/* New Group Type mini-modal */}
      <Modal
        isOpen={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        title="New Group Type"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setTypeModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={savingType}
              disabled={!newTypeForm.code.trim() || !newTypeForm.name.trim()}
              onClick={handleCreateGroupType}
            >
              Create Type
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-1">
          <p className="text-xs text-gray-500">Add a new group type. It will be available for selection immediately after creation.</p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Code <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(short identifier, e.g. SALES)</span>
            </label>
            <input
              type="text"
              value={newTypeForm.code}
              onChange={(e) => setNewTypeForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
              maxLength={50}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono uppercase"
              placeholder="e.g. SALES"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTypeForm.name}
              onChange={(e) => setNewTypeForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={255}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g. Sales"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newTypeForm.description}
              onChange={(e) => setNewTypeForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              maxLength={1000}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Optional. Brief description of this type."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
