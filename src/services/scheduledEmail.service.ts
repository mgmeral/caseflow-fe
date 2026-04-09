import { apiClient } from './api.client'
import type { ScheduleEmailRequest, ScheduledEmailResponse } from '@/types/api.types'

function trimToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function toScheduledEmailPayload(request: ScheduleEmailRequest): ScheduleEmailRequest {
  return {
    mailboxId: request.mailboxId,
    toAddress: request.toAddress.trim(),
    subject: request.subject.trim(),
    textBody: request.textBody.trim(),
    htmlBody: trimToNull(request.htmlBody),
    sendNotBefore: request.sendNotBefore,
    sourceEventId: trimToNull(request.sourceEventId),
    templateId: trimToNull(request.templateId),
    contentWasEdited: typeof request.contentWasEdited === 'boolean' ? request.contentWasEdited : null,
  }
}

export const scheduledEmailService = {
  listScheduledEmails: async (ticketPublicId: string): Promise<ScheduledEmailResponse[]> => {
    return apiClient.get<ScheduledEmailResponse[]>(`/tickets/${ticketPublicId}/scheduled-emails`)
  },

  createScheduledEmail: async (ticketPublicId: string, request: ScheduleEmailRequest): Promise<ScheduledEmailResponse> => {
    return apiClient.post<ScheduledEmailResponse>(`/tickets/${ticketPublicId}/scheduled-emails`, toScheduledEmailPayload(request))
  },

  cancelScheduledEmail: async (ticketPublicId: string, dispatchId: number): Promise<ScheduledEmailResponse> => {
    return apiClient.delete<ScheduledEmailResponse>(`/tickets/${ticketPublicId}/scheduled-emails/${dispatchId}`)
  },
}