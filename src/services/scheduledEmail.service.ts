import { apiClient } from './api.client'
import type { ScheduleEmailRequest, ScheduledEmailResponse } from '@/types/api.types'
import { optionalNumericContractId, trimOptionalText } from '@/lib/ticketEmailContracts'
import { toArrayPayload } from '@/lib/apiList'

function toScheduledEmailPayload(request: ScheduleEmailRequest): ScheduleEmailRequest {
  const toAddress = trimOptionalText(request.toAddress)

  return {
    mailboxId: request.mailboxId,
    ...(toAddress ? { toAddress } : {}),
    subject: request.subject.trim(),
    textBody: request.textBody.trim(),
    htmlBody: trimOptionalText(request.htmlBody),
    sendNotBefore: request.sendNotBefore,
    sourceEventId: optionalNumericContractId(request.sourceEventId, 'Reply context is invalid. Source event id must be numeric.'),
    templateId: optionalNumericContractId(request.templateId, 'Selected template id is invalid.'),
    contentWasEdited: typeof request.contentWasEdited === 'boolean' ? request.contentWasEdited : null,
  }
}

export const scheduledEmailService = {
  listScheduledEmails: async (ticketPublicId: string): Promise<ScheduledEmailResponse[]> => {
    const res = await apiClient.get<unknown>(`/tickets/${ticketPublicId}/scheduled-emails`)
    return toArrayPayload(res) as ScheduledEmailResponse[]
  },

  createScheduledEmail: async (ticketPublicId: string, request: ScheduleEmailRequest): Promise<ScheduledEmailResponse> => {
    return apiClient.post<ScheduledEmailResponse>(`/tickets/${ticketPublicId}/scheduled-emails`, toScheduledEmailPayload(request))
  },

  cancelScheduledEmail: async (ticketPublicId: string, dispatchId: number): Promise<ScheduledEmailResponse> => {
    return apiClient.delete<ScheduledEmailResponse>(`/tickets/${ticketPublicId}/scheduled-emails/${dispatchId}`)
  },
}