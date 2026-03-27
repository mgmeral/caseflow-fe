import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transferService } from '@/services/transfer.service'
import type { TransferTicketRequest } from '@/types/api.types'

export function useTransfers(ticketId: string) {
  return useQuery({
    queryKey: ['transfers', ticketId],
    queryFn: () => transferService.getByTicket(ticketId),
    enabled: !!ticketId,
    staleTime: 30_000,
  })
}

export function useCreateTransfer(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: TransferTicketRequest) => transferService.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers', ticketId] })
      qc.invalidateQueries({ queryKey: ['ticket-transfers', ticketId] })
      qc.invalidateQueries({ queryKey: ['ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
