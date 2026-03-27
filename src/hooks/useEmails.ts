import { useQuery } from '@tanstack/react-query'
import { emailService } from '@/services/email.service'

export function useEmailsByTicket(ticketId: string) {
  return useQuery({
    queryKey: ['emails', 'by-ticket', ticketId],
    queryFn: () => emailService.getByTicket(ticketId),
    enabled: !!ticketId,
    staleTime: 30_000,
  })
}

export function useEmailsByThread(threadKey: string) {
  return useQuery({
    queryKey: ['emails', 'by-thread', threadKey],
    queryFn: () => emailService.getByThread(threadKey),
    enabled: !!threadKey,
    staleTime: 30_000,
  })
}
