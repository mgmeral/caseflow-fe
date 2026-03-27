import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentService } from '@/services/assignment.service'
import type { AssignTicketRequest, ReassignTicketRequest, UnassignTicketRequest } from '@/types/api.types'

export function useAssignments(ticketId: string) {
  return useQuery({
    queryKey: ['assignments', ticketId],
    queryFn: () => assignmentService.getByTicket(ticketId),
    enabled: !!ticketId,
    staleTime: 30_000,
  })
}

export function useAssignTicket(ticketId: string) {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['assignments', ticketId] })
    qc.invalidateQueries({ queryKey: ['ticket', ticketId] })
    qc.invalidateQueries({ queryKey: ['tickets'] })
  }
  return useMutation({
    mutationFn: (req: AssignTicketRequest) => assignmentService.assign(req),
    onSuccess: invalidate,
  })
}

export function useReassignTicket(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: ReassignTicketRequest) => assignmentService.reassign(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', ticketId] })
      qc.invalidateQueries({ queryKey: ['ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useUnassignTicket(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: UnassignTicketRequest) => assignmentService.unassign(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', ticketId] })
      qc.invalidateQueries({ queryKey: ['ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
