import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketEmailService } from '@/services/ticketEmail.service'
import type { SendTicketReplyRequest } from '@/types/email.types'

export function useTicketEmailThread(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-email-thread', ticketId],
    queryFn: () => ticketEmailService.listThread(ticketId),
    enabled: !!ticketId,
    staleTime: 15_000,
  })
}

export function useTicketEmailDetail(ticketId: string, emailId: string) {
  return useQuery({
    queryKey: ['ticket-email-detail', ticketId, emailId],
    queryFn: () => ticketEmailService.getDetail(ticketId, emailId),
    enabled: !!ticketId && !!emailId,
    staleTime: 15_000,
  })
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