/**
 * Assignment service — aligned to backend /api/assignments endpoints.
 */
import type { AssignmentResponse, AssignTicketRequest, ReassignTicketRequest, UnassignTicketRequest } from '@/types/api.types'
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

  assign: async (req: AssignTicketRequest): Promise<AssignmentResponse> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === req.ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.assignedUserId = req.assigneeId
    ticket.updatedAt = new Date().toISOString()
    return {
      id: `asgn-${++_mockAssignmentIdCounter}`,
      ticketId: req.ticketId,
      assigneeId: req.assigneeId,
      assigneeName: req.assigneeId,
      assignedById: null,
      assignedByName: null,
      createdAt: new Date().toISOString(),
    }
  },

  reassign: async (req: ReassignTicketRequest): Promise<AssignmentResponse> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === req.ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.assignedUserId = req.newAssigneeId
    ticket.updatedAt = new Date().toISOString()
    return {
      id: `asgn-${++_mockAssignmentIdCounter}`,
      ticketId: req.ticketId,
      assigneeId: req.newAssigneeId,
      assigneeName: req.newAssigneeId,
      assignedById: null,
      assignedByName: null,
      createdAt: new Date().toISOString(),
    }
  },

  unassign: async (req: UnassignTicketRequest): Promise<void> => {
    await getMockDelay()
    const ticket = mockTickets.find((t) => t.id === req.ticketId)
    if (!ticket) throw new Error('Ticket not found')
    ticket.assignedUserId = null
    ticket.assignedUserName = null
    ticket.updatedAt = new Date().toISOString()
  },
}

// ---------------------------------------------------------------------------
// Real API implementation
// ---------------------------------------------------------------------------

const realService = {
  getByTicket: (ticketId: string) =>
    apiClient.get<AssignmentResponse[]>(`/assignments/by-ticket/${ticketId}`),

  assign: (req: AssignTicketRequest) =>
    apiClient.post<AssignmentResponse>('/assignments/assign', req),

  reassign: (req: ReassignTicketRequest) =>
    apiClient.post<AssignmentResponse>('/assignments/reassign', req),

  unassign: (req: UnassignTicketRequest) =>
    apiClient.post<void>('/assignments/unassign', req),
}

export const assignmentService = USE_MOCKS ? mockService : realService
