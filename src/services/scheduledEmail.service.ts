import { apiClient } from './api.client'
import type { ScheduleEmailRequest, ScheduledEmailResponse } from '@/types/integration.types'

export const scheduledEmailService = {
  listScheduledEmails: async (ticketPublicId: string): Promise<ScheduledEmailResponse[]> => {
    return apiClient.get<ScheduledEmailResponse[]>(`/tickets/${ticketPublicId}/scheduled-emails`)
  },

  createScheduledEmail: async (ticketPublicId: string, request: ScheduleEmailRequest): Promise<ScheduledEmailResponse> => {
    return apiClient.post<ScheduledEmailResponse>(`/tickets/${ticketPublicId}/scheduled-emails`, request)
  },

  cancelScheduledEmail: async (ticketPublicId: string, dispatchId: number): Promise<ScheduledEmailResponse> => {
    return apiClient.delete<ScheduledEmailResponse>(`/tickets/${ticketPublicId}/scheduled-emails/${dispatchId}`)
  },
}