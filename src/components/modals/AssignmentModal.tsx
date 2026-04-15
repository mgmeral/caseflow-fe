import { useEffect, useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { Avatar } from '@/components/shared/Avatar'
import { clsx } from 'clsx'
import type { Group, User } from '@/types/user.types'

interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  ticketNo: string
  currentAssigneeId?: string | null
  currentAssigneeName?: string | null
  currentGroupId?: string | null
  currentGroupName?: string | null
  groups: Group[]
  users: User[]
  onAssign: (userId: string | null, userName: string | null, note?: string) => Promise<unknown> | unknown
  isAssigning: boolean
}

function getTicketCountColor(count: number): string {
  if (count < 5) return 'text-green-600'
  if (count <= 10) return 'text-yellow-600'
  return 'text-orange-600'
}

export function AssignmentModal({
  isOpen,
  onClose,
  ticketNo,
  currentAssigneeId,
  currentAssigneeName,
  currentGroupId,
  currentGroupName,
  groups,
  users,
  onAssign,
  isAssigning,
}: AssignmentModalProps) {
  const hasActiveAssignment = !!currentAssigneeId
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [note, setNote] = useState('')
  const [userSearch, setUserSearch] = useState('')

  const filteredUsers = users.filter((u) => {
    if (!u.isActive) return false
    if (selectedGroupId && !u.groupIds.includes(selectedGroupId)) return false
    if (userSearch && !u.fullName.toLowerCase().includes(userSearch.toLowerCase())) return false
    return true
  })

  const selectedUser = users.find((u) => u.id === selectedUserId)

  const resetState = () => {
    setSelectedGroupId('')
    setSelectedUserId('')
    setNote('')
    setUserSearch('')
  }

  useEffect(() => {
    if (!isOpen) return
    resetState()
  }, [isOpen])

  const handleAssign = async () => {
    if (!selectedUserId) return
    await onAssign(selectedUserId, selectedUser?.fullName ?? null, note || undefined)
    resetState()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetState()
        onClose()
      }}
      title={`${hasActiveAssignment ? 'Reassign' : 'Assign'} Ticket ${ticketNo}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => {
            resetState()
            onClose()
          }} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAssign}
            isLoading={isAssigning}
            disabled={!selectedUserId}
          >
            {hasActiveAssignment ? 'Reassign' : 'Assign'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {(currentAssigneeName || currentGroupName) && (
          <div className="surface-section rounded-xl px-3 py-2.5 text-sm text-gray-500">
            {currentAssigneeName ? <>Currently assigned to <strong>{currentAssigneeName}</strong></> : 'Ticket is currently unassigned.'}
            {currentGroupName ? <span className="block mt-1 text-xs text-gray-400">Current group: {currentGroupName}</span> : null}
          </div>
        )}

        {/* Group filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Group</label>
          <select
            value={selectedGroupId}
            onChange={(e) => {
              setSelectedGroupId(e.target.value)
              setSelectedUserId('')
            }}
            className="ui-select"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-gray-400">Assignments keep the current ticket group unless you explicitly transfer the ticket.</p>
        </div>

        {/* User search */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Agent</label>
          <input
            type="text"
            placeholder="Search agents..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="ui-input mb-2"
          />
          <div className="surface-section max-h-48 overflow-y-auto rounded-xl p-1">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">No agents found</p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                    selectedUserId === user.id ? 'bg-[#eef5ff]' : 'hover:bg-white/70',
                    user.id === currentAssigneeId && 'opacity-50',
                  )}
                >
                  <Avatar name={user.fullName} color={user.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{user.fullName}</div>
                    <div className="text-xs text-gray-400">{user.groupNames.join(', ')}</div>
                  </div>
                  <span className={clsx('text-xs font-medium', getTicketCountColor(user.openTicketCount))}>
                    {user.openTicketCount} open
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Handover Note <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a handover note..."
            rows={2}
            className="ui-textarea min-h-[92px] resize-none"
          />
        </div>
      </div>
    </Modal>
  )
}
