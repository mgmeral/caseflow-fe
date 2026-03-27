import { useState } from 'react'
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
  groups: Group[]
  users: User[]
  onAssign: (userId: string | null, userName: string | null, note?: string) => void
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
  groups,
  users,
  onAssign,
  isAssigning,
}: AssignmentModalProps) {
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

  const handleAssign = () => {
    if (!selectedUserId) return
    onAssign(selectedUserId, selectedUser?.fullName ?? null, note || undefined)
    onClose()
    setSelectedUserId('')
    setNote('')
    setUserSearch('')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Ticket ${ticketNo}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAssign}
            isLoading={isAssigning}
            disabled={!selectedUserId}
          >
            Assign
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {currentAssigneeName && (
          <div className="text-sm text-gray-500 bg-gray-50 rounded p-2.5">
            Currently assigned to <strong>{currentAssigneeName}</strong>
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* User search */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Agent</label>
          <input
            type="text"
            placeholder="Search agents..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">No agents found</p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left',
                    selectedUserId === user.id && 'bg-indigo-50',
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>
    </Modal>
  )
}
