/**
 * Assignment service — aligned to backend /api/assignments endpoints.
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
  getByTicket: async (ticketId: string): Promise<AssignmentResponse[]> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === ticketId)
    if (!ticket?.assignedUserId) return []
    return [
      {
        id: `asgn-${ticketId}`,
        ticketId,
        assigneeId: ticket.assignedUserId,
        assigneeName: ticket.assignedUserName ?? 'Unknown',
        assignedById: null,
        assignedByName: null,
        createdAt: ticket.updatedAt,
      },
    ]
  },

  assign: async (req: { ticketId: string; assignedUserId: string; note?: string }): Promise<AssignmentResponse> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === req.ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.assignedUserId = req.assignedUserId
    ticket.updatedAt = new Date().toISOString()
    return {
      id: `asgn-${++_mockAssignmentIdCounter}`,
      ticketId: req.ticketId,
      assigneeId: req.assignedUserId,
      assigneeName: req.assignedUserId,
      assignedById: null,
      assignedByName: null,
      createdAt: new Date().toISOString(),
    }
  },

  reassign: async (req: { ticketId: string; newUserId: string; note?: string }): Promise<AssignmentResponse> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === req.ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.assignedUserId = req.newUserId
    ticket.updatedAt = new Date().toISOString()
    return {
      id: `asgn-${++_mockAssignmentIdCounter}`,
      ticketId: req.ticketId,
      assigneeId: req.newUserId,
      assigneeName: req.newUserId,
      assignedById: null,
      assignedByName: null,
      createdAt: new Date().toISOString(),
    }
  },

  unassign: async (req: { ticketId: string; reason?: string }): Promise<void> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === req.ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.assignedUserId = null
    ticket.assignedUserName = null
    ticket.updatedAt = new Date().toISOString()
  },
}

// ---------------------------------------------------------------------------
// Real API implementation — field names match backend contract exactly
// ---------------------------------------------------------------------------

const realService = {
  getByTicket: (ticketId: string) =>
    apiClient.get<AssignmentResponse[]>(`/assignments/by-ticket/${ticketId}`),

  assign: (req: { ticketId: string; assignedUserId: string; note?: string }) =>
    apiClient.post<AssignmentResponse>('/assignments/assign', req),

  reassign: (req: { ticketId: string; newUserId: string; note?: string }) =>
    apiClient.post<AssignmentResponse>('/assignments/reassign', req),

  unassign: (req: { ticketId: string; reason?: string }) =>
    apiClient.post<void>('/assignments/unassign', req),
}

export const assignmentService = USE_MOCKS ? mockService : realService
