import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tagService } from '@/services/tag.service'
import type { CreateTagRequest, UpdateTagRequest } from '@/types/api.types'

export function useActiveTags() {
  return useQuery({
    queryKey: ['tags', 'active'],
    queryFn: () => tagService.listActiveTags(),
    staleTime: 60_000,
  })
}

export function useTags() {
  return useActiveTags()
}

export function useAllTags() {
  return useQuery({
    queryKey: ['tags', 'all'],
    queryFn: () => tagService.listAllTags(),
    staleTime: 15_000,
  })
}

export function useTag(tagId: string) {
  return useQuery({
    queryKey: ['tags', 'detail', tagId],
    queryFn: () => tagService.getTagById(tagId),
    enabled: !!tagId,
    staleTime: 15_000,
  })
}

export function useTicketTags(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-tags', ticketId],
    queryFn: () => tagService.listTicketTags(ticketId),
    enabled: !!ticketId,
    staleTime: 15_000,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTagRequest) => tagService.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tags', 'active'] }),
        queryClient.invalidateQueries({ queryKey: ['tags', 'all'] }),
      ])
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tagId, payload }: { tagId: string; payload: UpdateTagRequest }) => tagService.update(tagId, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tags', 'active'] }),
        queryClient.invalidateQueries({ queryKey: ['tags', 'all'] }),
        queryClient.invalidateQueries({ queryKey: ['tags', 'detail', variables.tagId] }),
      ])
    },
  })
}

export function useActivateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tagId: string) => tagService.activateTag(tagId),
    onSuccess: async (_data, tagId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tags', 'active'] }),
        queryClient.invalidateQueries({ queryKey: ['tags', 'all'] }),
        queryClient.invalidateQueries({ queryKey: ['tags', 'detail', tagId] }),
      ])
    },
  })
}

export function useDeactivateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tagId: string) => tagService.deactivateTag(tagId),
    onSuccess: async (_data, tagId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tags', 'active'] }),
        queryClient.invalidateQueries({ queryKey: ['tags', 'all'] }),
        queryClient.invalidateQueries({ queryKey: ['tags', 'detail', tagId] }),
      ])
    },
  })
}

export function useAddTicketTag(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tagId: string) => tagService.addTagToTicket(ticketId, tagId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ticket-tags', ticketId] }),
        queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] }),
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
      ])
    },
  })
}

export function useRemoveTicketTag(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tagId: string) => tagService.removeTagFromTicket(ticketId, tagId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ticket-tags', ticketId] }),
        queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] }),
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
      ])
    },
  })
}