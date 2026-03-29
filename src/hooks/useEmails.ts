import { useQuery } from '@tanstack/react-query'
import { emailService } from '@/services/email.service'
import { useTicketEmailThread } from './useTicketEmails'

export function useEmailsByTicket(ticketId: string) {
  return useTicketEmailThread(ticketId)
}

export function useEmailsByThread(threadKey: string) {
  return useQuery({
    queryKey: ['emails', 'by-thread', threadKey],
    queryFn: () => emailService.getByThread(threadKey),
    enabled: !!threadKey,
    staleTime: 30_000,
  })
}
