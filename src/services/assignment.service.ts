/**
 * Assignment service — aligned to CaseFlow API v2.0.0 /api/assignments endpoints.
 */
import type { AssignmentResponse } from '@/types/api.types'
import { apiClient } from './api.client'

export const assignmentService = {
  /**
   * GET /api/assignments/by-ticket/{ticketId}
   */
  getByTicket: (ticketId: string) =>
    apiClient.get<AssignmentResponse>(`/assignments/by-ticket/${ticketId}`),

  /**
   * POST /api/assignments/assign
   * Body: { ticketId: int64, assignedUserId?: int64, assignedGroupId?: int64 }
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
