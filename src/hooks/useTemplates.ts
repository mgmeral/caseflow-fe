import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateService } from '@/services/template.service'
import type { TicketTemplate } from '@/types/user.types'

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getAll(),
    staleTime: 120_000,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<TicketTemplate, 'id'>) => templateService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TicketTemplate> }) =>
      templateService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => templateService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}
