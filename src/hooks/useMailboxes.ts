import { useQuery } from '@tanstack/react-query'
import { mailboxService, type MailboxListFilters } from '@/services/mailbox.service'

export function useMailboxes(filters: MailboxListFilters = {}) {
  return useQuery({
    queryKey: ['mailboxes', filters],
    queryFn: () => mailboxService.list(filters),
    staleTime: 30_000,
  })
}

export function useMailbox(id: string) {
  return useQuery({
    queryKey: ['mailbox', id],
    queryFn: () => mailboxService.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}