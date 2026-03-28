/**
 * Assignment service — aligned to CaseFlow API v2.0.0 /api/assignments endpoints.
 */
import type { AssignmentResponse } from '@/types/api.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockTickets, getMockDelay } from '@/mock'

// ---------------------------------------------------------------------------
// Mock implementation
// ---------------------------------------------------------------------------

let _mockAssignmentIdCounter = 1

const mockService = {
  getByTicket: async (ticketId: string): Promise<AssignmentResponse> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === ticketId)
    if (!ticket?.assignedUserId) {
      return {
        id: `asgn-${ticketId}`,
        ticketId,
        assignedUserId: null,
        assignedGroupId: null,
        assignedBy: null,
        assignedAt: ticket?.updatedAt ?? new Date().toISOString(),
        unassignedAt: null,
        active: false,
      }
    }
    return {
      id: `asgn-${ticketId}`,
      ticketId,
      assignedUserId: ticket.assignedUserId,
      assignedGroupId: null,
      assignedBy: null,
      assignedAt: ticket.updatedAt,
      unassignedAt: null,
      active: true,
    }
  },

  assign: async (req: { ticketId: string; assignedUserId?: string; assignedGroupId?: string }): Promise<AssignmentResponse> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === req.ticketId)
    if (!ticket) throw new Error('Ticket not found')
    if (req.assignedUserId) ticket.assignedUserId = req.assignedUserId
    ticket.updatedAt = new Date().toISOString()
    return {
      id: `asgn-${++_mockAssignmentIdCounter}`,
      ticketId: req.ticketId,
      assignedUserId: req.assignedUserId ?? null,
      assignedGroupId: req.assignedGroupId ?? null,
      assignedBy: null,
      assignedAt: new Date().toISOString(),
      unassignedAt: null,
      active: true,
    }
  },

  reassign: async (req: { ticketId: string; newUserId?: string; newGroupId?: string }): Promise<AssignmentResponse> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === req.ticketId)
    if (!ticket) throw new Error('Ticket not found')
    if (req.newUserId) ticket.assignedUserId = req.newUserId
    ticket.updatedAt = new Date().toISOString()
    return {
      id: `asgn-${++_mockAssignmentIdCounter}`,
      ticketId: req.ticketId,
      assignedUserId: req.newUserId ?? null,
      assignedGroupId: req.newGroupId ?? null,
      assignedBy: null,
      assignedAt: new Date().toISOString(),
      unassignedAt: null,
      active: true,
    }
  },

  unassign: async (req: { ticketId: string }): Promise<void> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === req.ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.assignedUserId = null
    ticket.assignedUserName = null
    ticket.updatedAt = new Date().toISOString()
  },
}

// ---------------------------------------------------------------------------
// Real API implementation — field names and body shapes per spec
// ---------------------------------------------------------------------------

const realService = {
  /**
   * GET /api/assignments/by-ticket/{ticketId}
   * Spec response: { id, ticketId, assignedUserId, assignedGroupId, assignedBy, assignedAt, unassignedAt, active }
   */
  getByTicket: (ticketId: string) =>
    apiClient.get<AssignmentResponse>(`/assignments/by-ticket/${ticketId}`),

  /**
   * POST /api/assignments/assign
   * Body: { ticketId: int64, assignedUserId?: int64, assignedGroupId?: int64 }
   * IDs are converted from FE string convention to int64 before sending.
   */
  assign: (req: { ticketId: string; assignedUserId?: string; assignedGroupId?: string }) =>
    apiClient.post<AssignmentResponse>('/assignments/assign', {
      ticketId: Number(req.ticketId),
      ...(req.assignedUserId !== undefined ? { assignedUserId: Number(req.assignedUserId) } : {}),
      ...(req.assignedGroupId !== undefined ? { assignedGroupId: Number(req.assignedGroupId) } : {}),
    }),

  /**
   * POST /api/assignments/reassign
   * Body: { ticketId: int64, newUserId?: int64, newGroupId?: int64 }
   */
  reassign: (req: { ticketId: string; newUserId?: string; newGroupId?: string }) =>
    apiClient.post<AssignmentResponse>('/assignments/reassign', {
      ticketId: Number(req.ticketId),
      ...(req.newUserId !== undefined ? { newUserId: Number(req.newUserId) } : {}),
      ...(req.newGroupId !== undefined ? { newGroupId: Number(req.newGroupId) } : {}),
    }),

  /**
   * POST /api/assignments/unassign
   * Body: { ticketId: int64 }
   */
  unassign: (req: { ticketId: string }) =>
    apiClient.post<void>('/assignments/unassign', { ticketId: Number(req.ticketId) }),
}

export const assignmentService = USE_MOCKS ? mockService : realService
