import type { CreateTagRequest, TagResponse, TicketTagResponse, UpdateTagRequest } from '@/types/api.types'
import type { TicketTag, TicketTagAssignment } from '@/types/ticket.types'
import { apiClient } from './api.client'
import { normalizeTag, normalizeTicketTagResponse } from './email-platform.normalizers'
import { toArrayPayload } from '@/lib/apiList'

export const tagService = {
  listActiveTags: async (): Promise<TicketTag[]> => {
    const response = await apiClient.get<unknown>('/tags')
    return toArrayPayload(response).map((item) => normalizeTag(item as TagResponse))
  },

  listAllTags: async (): Promise<TicketTag[]> => {
    const response = await apiClient.get<unknown>('/tags/all')
    return toArrayPayload(response).map((item) => normalizeTag(item as TagResponse))
  },

  getTagById: async (tagId: string): Promise<TicketTag> => {
    const response = await apiClient.get<TagResponse>(`/tags/${tagId}`)
    return normalizeTag(response)
  },

  create: async (payload: CreateTagRequest): Promise<TicketTag> => {
    const response = await apiClient.post<TagResponse>('/tags', payload)
    return normalizeTag(response)
  },

  update: async (tagId: string, payload: UpdateTagRequest): Promise<TicketTag> => {
    const response = await apiClient.put<TagResponse>(`/tags/${tagId}`, payload)
    return normalizeTag(response)
  },

  activateTag: async (tagId: string): Promise<TicketTag> => {
    const response = await apiClient.patch<TagResponse>(`/tags/${tagId}/activate`, {})
    return normalizeTag(response)
  },

  deactivateTag: async (tagId: string): Promise<TicketTag> => {
    const response = await apiClient.patch<TagResponse>(`/tags/${tagId}/deactivate`, {})
    return normalizeTag(response)
  },

  listTicketTags: async (ticketId: string): Promise<TicketTagAssignment[]> => {
    const response = await apiClient.get<unknown>(`/tickets/${ticketId}/tags`)
    return toArrayPayload(response).map((item) => normalizeTicketTagResponse(item as TicketTagResponse))
  },

  addTagToTicket: async (ticketId: string, tagId: string): Promise<TicketTagAssignment> => {
    const response = await apiClient.post<TicketTagResponse>(`/tickets/${ticketId}/tags/${tagId}`, {})
    return normalizeTicketTagResponse(response)
  },

  removeTagFromTicket: async (ticketId: string, tagId: string): Promise<void> => {
    await apiClient.delete<void>(`/tickets/${ticketId}/tags/${tagId}`)
  },
}