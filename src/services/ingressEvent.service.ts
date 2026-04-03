import type { IngressEventDetailResponse, IngressEventResponse } from '@/types/api.types'
import type { IngressEventDetail, IngressEventListResult } from '@/types/email.types'
import { apiClient } from './api.client'
import {
  normalizeIngressEventDetail,
  normalizeIngressEventList,
} from './email-platform.normalizers'

export interface IngressEventListFilters {
  page?: number
  size?: number
  status?: string
  ticketId?: string
  sort?: string
  direction?: 'asc' | 'desc' | string

  // Backward-compatible aliases used by existing UI state.
  processingStatus?: string
  mailboxId?: string
  search?: string
}

export const ingressEventService = {
  list: async (filters: IngressEventListFilters = {}): Promise<IngressEventListResult> => {
    const params = new URLSearchParams()

    const status = filters.status ?? filters.processingStatus
    if (filters.page !== undefined) params.set('page', String(filters.page))
    if (filters.size !== undefined) params.set('size', String(filters.size))
    if (status) params.set('status', status)
    if (filters.mailboxId) params.set('mailboxId', filters.mailboxId)
    if (filters.ticketId) params.set('ticketId', filters.ticketId)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.direction) params.set('direction', filters.direction)
    const query = params.toString()
    const response = await apiClient.get<{ items: IngressEventResponse[]; page: number; size: number; totalElements: number; totalPages: number } | IngressEventResponse[]>(
      `/admin/ingress-events${query ? `?${query}` : ''}`,
    )
    return normalizeIngressEventList(response)
  },

  getById: async (id: string): Promise<IngressEventDetail | null> => {
    const event = await apiClient.get<IngressEventDetailResponse | null>(`/admin/ingress-events/${id}`)
    return event ? normalizeIngressEventDetail(event) : null
  },

  process: async (id: string) =>
    normalizeIngressEventDetail(await apiClient.post<IngressEventDetailResponse>(`/admin/ingress-events/${id}/process`, {})),

  quarantine: async (id: string, reason: string) =>
    normalizeIngressEventDetail(await apiClient.post<IngressEventDetailResponse>(`/admin/ingress-events/${id}/quarantine`, { reason })),

  release: async (id: string) =>
    normalizeIngressEventDetail(await apiClient.post<IngressEventDetailResponse>(`/admin/ingress-events/${id}/release`, {})),
}
