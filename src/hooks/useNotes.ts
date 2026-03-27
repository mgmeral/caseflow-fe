import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { noteService } from '@/services/note.service'
import type { AddNoteRequest } from '@/types/api.types'

export function useNotes(ticketId: string) {
  return useQuery({
    queryKey: ['notes', ticketId],
    queryFn: () => noteService.getByTicket(ticketId),
    enabled: !!ticketId,
    staleTime: 15_000,
  })
}

export function useAddNote(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: AddNoteRequest) => noteService.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', ticketId] })
      qc.invalidateQueries({ queryKey: ['ticket-messages', ticketId] })
    },
  })
}
