import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const assign = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries }),
  }
})

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canViewAdminPool: true }),
}))

vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({ users: [], groups: [] }),
}))

vi.mock('@/hooks/useQueue', () => ({
  useQueue: () => ({
    data: {
      tickets: [
        {
          id: '1',
          ticketNo: 'T-1',
          subject: 'Needs assignment',
          customerName: 'Acme',
          status: 'NEW',
          priority: 'high',
          assignedUserId: null,
          assignedUserName: null,
          groupName: 'Tier 1',
          groupId: 'g1',
          openDurationMinutes: 500,
          updatedAt: '2026-04-07T10:00:00Z',
          isUnread: false,
          isTransferred: false,
          customerId: 'c1',
          publicId: null,
          sourceType: 'manual',
          transferredFromGroup: null,
          createdAt: '2026-04-07T09:00:00Z',
          lastActionAt: '2026-04-07T10:00:00Z',
          lastActionSummary: '',
          slaDeadlineAt: null,
          slaBreached: false,
          messageCount: 0,
          internalNoteCount: 0,
          tags: [],
          attachments: [],
        },
      ],
      total: 1,
    },
    isLoading: false,
  }),
  useQueueStats: () => ({
    data: {
      allUnassigned: 1,
      awaitingAssignment: 1,
      highCritical: 1,
      slaBreached: 0,
      waitingOver8h: 1,
    },
  }),
}))

vi.mock('@/services/assignment.service', () => ({
  assignmentService: { assign },
}))

vi.mock('@/components/modals/AssignmentModal', () => ({
  AssignmentModal: ({ isOpen, onAssign }: { isOpen: boolean; onAssign: (value: string | null) => void }) =>
    isOpen ? <button onClick={() => onAssign('u1')}>Confirm Assign</button> : null,
}))

const { AdminPoolPage } = await import('@/pages/AdminPoolPage')

describe('AdminPoolPage', () => {
  beforeEach(() => {
    assign.mockReset()
    invalidateQueries.mockClear()
    assign.mockResolvedValue(undefined)
  })

  it('refetches ticket queries after assignment to keep queue counts fresh', async () => {
    render(
      <MemoryRouter>
        <AdminPoolPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Assign' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Assign' }))

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith({ ticketId: '1', assignedUserId: 'u1' })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['queue'], refetchType: 'all' })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['queue-stats'], refetchType: 'all' })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['tickets'], refetchType: 'all' })
    })
  })
})
