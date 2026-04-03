import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateService } from '@/services/template.service'
import type { MailTemplateUpsertInput } from '@/types/template.types'

export function useTemplates(enabled = true) {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getAll(),
    staleTime: 120_000,
    enabled,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MailTemplateUpsertInput) => templateService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MailTemplateUpsertInput }) =>
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

export function useTemplatePreview(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['template-preview', id],
    queryFn: () => templateService.preview(id ?? ''),
    enabled: enabled && !!id,
    staleTime: 30_000,
  })
}
