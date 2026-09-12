import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { AssignmentModal } from '@/components/modals/AssignmentModal'
import type { User } from '@/types/user.types'

const baseUsers: User[] = [
  { id: 'u1', fullName: 'Alice', firstName: 'Alice', lastName: 'A', isActive: true, groupIds: [], groupNames: [], openTicketCount: 2, email: 'alice@example.com', role: 'agent', permissionCodes: [], ticketScope: 'ALL', adminLevel: 0, lastLoginAt: null, avatarColor: '#000' },
  { id: 'u2', fullName: 'Bob', firstName: 'Bob', lastName: 'B', isActive: true, groupIds: [], groupNames: [], openTicketCount: 0, email: 'bob@example.com', role: 'agent', permissionCodes: [], ticketScope: 'ALL', adminLevel: 0, lastLoginAt: null, avatarColor: '#000' },
]

function renderModal(overrides: Partial<Parameters<typeof AssignmentModal>[0]> = {}) {
  const onAssign = vi.fn()
  render(
    <AssignmentModal
      isOpen
      onClose={vi.fn()}
      ticketId="t1"
      ticketNo="TK-1"
      currentAssigneeId={null}
      currentAssigneeName={null}
      currentGroupId={null}
      currentGroupName={null}
      groups={[]}
      users={baseUsers}
      onAssign={onAssign}
      isAssigning={false}
      {...overrides}
    />,
  )
  return { onAssign }
}

describe('AssignmentModal', () => {
  it('keeps Assign button disabled when no user selected', () => {
    renderModal()
    const button = screen.getByRole('button', { name: /Assign/ })
    expect(button).toBeDisabled()
  })

  it('enables Assign button when a different user is selected', async () => {
    renderModal({ currentAssigneeId: 'u2' })
    const aliceButton = screen.getByRole('button', { name: /Alice/ })
    await act(async () => { fireEvent.click(aliceButton) })
    expect(screen.getByRole('button', { name: /Assign|Reassign/i })).not.toBeDisabled()
  })

  it('disables Assign/Reassign button and shows warning when the current assignee is selected again', async () => {
    renderModal({ currentAssigneeId: 'u1', currentAssigneeName: 'Alice' })
    const aliceButton = screen.getByRole('button', { name: /Alice/ })
    await act(async () => { fireEvent.click(aliceButton) })
    expect(screen.getByRole('button', { name: /Assign|Reassign/i })).toBeDisabled()
    expect(screen.getByText(/Alice is already assigned to this ticket/i)).toBeInTheDocument()
  })
})
