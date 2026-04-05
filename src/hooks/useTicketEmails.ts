import { useMemo } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketEmailService } from '@/services/ticketEmail.service'
import type { SendTicketReplyRequest, TicketEmailMessage, TicketReplyPreviewRequest } from '@/types/email.types'
import type { TicketAttachment } from '@/types/ticket.types'

export function useTicketEmailThread(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-email-thread', ticketId],
    queryFn: () => ticketEmailService.listThread(ticketId),
    enabled: !!ticketId,
    staleTime: 15_000,
  })
}

export function useTicketEmailDetailByDirection(ticketPublicId: string, detailId: string, detailType?: 'INBOUND' | 'OUTBOUND', enabled = true) {
  return useQuery({
    queryKey: ['ticket-email-detail', ticketPublicId, detailType ?? 'INBOUND', detailId],
    queryFn: () => ticketEmailService.getDetail(ticketPublicId, detailId, detailType),
    enabled: enabled && !!ticketPublicId && !!detailId,
    staleTime: 15_000,
  })
}

export function useTicketReplyPreview(ticketPublicId: string, payload: TicketReplyPreviewRequest | null, enabled = true) {
  return useQuery({
    queryKey: ['ticket-email-reply-preview', ticketPublicId, payload?.sourceEventId ?? null, payload?.mailboxId ?? null, payload?.templateId ?? null],
    queryFn: () => ticketEmailService.previewReply(ticketPublicId, payload!),
    enabled: enabled && !!ticketPublicId && !!payload?.sourceEventId,
    staleTime: 15_000,
  })
}

function toTicketAttachment(ticketId: string, email: TicketEmailMessage, attachment: TicketEmailMessage['attachments'][number]): TicketAttachment {
  const fallbackId = `${email.id}:${attachment.fileName}:${attachment.downloadUrl ?? attachment.previewUrl ?? attachment.openUrl ?? ''}`

  return {
    id: attachment.id ?? fallbackId,
    ticketId,
    emailId: email.emailDocumentId,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    size: attachment.sizeBytes ?? attachment.size,
    previewSupported: attachment.previewSupported,
    previewUrl: attachment.previewUrl,
    openUrl: attachment.openUrl,
    downloadUrl: attachment.downloadUrl,
    uploadedAt: email.receivedAt ?? email.sentAt ?? null,
  }
}

export function useTicketEmailAttachments(ticketPublicId: string, emails: TicketEmailMessage[], enabled = true) {
  const emailsWithAttachmentCounts = useMemo(
    () => emails.filter((email) => email.attachmentCount > 0),
    [emails],
  )

  const emailsNeedingHydration = useMemo(
    () => emailsWithAttachmentCounts.filter((email) => email.attachments.length === 0 && !!(email.detailId ?? email.emailDocumentId) && !!email.detailType),
    [emailsWithAttachmentCounts],
  )

  const detailQueries = useQueries({
    queries: emailsNeedingHydration.map((email) => ({
      queryKey: ['ticket-email-detail', ticketPublicId, email.detailType ?? email.direction, email.detailId ?? email.emailDocumentId],
      queryFn: () => ticketEmailService.getDetail(ticketPublicId, (email.detailId ?? email.emailDocumentId)!, email.detailType ?? email.direction),
      enabled: enabled && !!ticketPublicId,
      staleTime: 15_000,
    })),
  })

  return useMemo(() => {
    const hydratedById = new Map<string, TicketEmailMessage>()
    detailQueries.forEach((query, index) => {
      const email = emailsNeedingHydration[index]
      if (email && query.data) {
        hydratedById.set(email.id, query.data)
      }
    })

    const deduped = new Map<string, TicketAttachment>()
    for (const email of emailsWithAttachmentCounts) {
      const hydratedEmail = hydratedById.get(email.id)
      const sourceEmail = email.attachments.length > 0
        ? email
        : hydratedEmail
          ? { ...email, ...hydratedEmail, sourceEventId: email.sourceEventId ?? hydratedEmail.sourceEventId }
          : email
      for (const attachment of sourceEmail.attachments) {
        const normalized = toTicketAttachment(ticketPublicId, sourceEmail, attachment)
        const dedupeKey = normalized.id || normalized.downloadUrl || `${normalized.emailId}:${normalized.fileName}`
        if (!deduped.has(dedupeKey)) {
          deduped.set(dedupeKey, normalized)
        }
      }
    }

    return {
      attachments: Array.from(deduped.values()),
      isLoading: detailQueries.some((query) => query.isLoading),
    }
  }, [detailQueries, emailsNeedingHydration, emailsWithAttachmentCounts, ticketPublicId])
}

export function useSendTicketReply(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendTicketReplyRequest) => ticketEmailService.sendReply(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-email-thread', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['ticket-email-detail', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}