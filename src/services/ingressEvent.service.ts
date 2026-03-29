import type { IngressEventDetailResponse, IngressEventResponse } from '@/types/api.types'
import type { IngressEventDetail, IngressEventListResult } from '@/types/email.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { getMockDelay } from '@/mock'
import { mockIngressEvents } from '@/mock/email-platform.mock'
import {
  normalizeIngressEventDetail,
  normalizeIngressEventList,
} from './email-platform.normalizers'

export interface IngressEventListFilters {
  page?: number
  size?: number
  status?: string
  mailboxId?: string
  providerType?: string
  search?: string
}

let ingressStore = [...mockIngressEvents]

function updateIngress(id: string, mutate: (event: IngressEventDetailResponse) => IngressEventDetailResponse): IngressEventDetail {
  ingressStore = ingressStore.map((event) => (event.id === id ? mutate(event) : event))
  const updated = ingressStore.find((event) => event.id === id)
  if (!updated) throw new Error('Ingress event not found')
  return normalizeIngressEventDetail(updated)
}

const mockService = {
  list: async (filters: IngressEventListFilters = {}): Promise<IngressEventListResult> => {
    await getMockDelay()
    let result = [...ingressStore]
    if (filters.status) result = result.filter((event) => event.status === filters.status)
    if (filters.mailboxId) result = result.filter((event) => event.mailboxId === filters.mailboxId)
    if (filters.providerType) result = result.filter((event) => event.providerType === filters.providerType)
    if (filters.search) {
      const query = filters.search.toLowerCase()
      result = result.filter((event) =>
        event.messageId.toLowerCase().includes(query) ||
        (event.subject ?? '').toLowerCase().includes(query) ||
        (event.sender ?? '').toLowerCase().includes(query),
      )
    }
    return normalizeIngressEventList(result)
  },

  getById: async (id: string): Promise<IngressEventDetail | null> => {
    await getMockDelay()
    const event = ingressStore.find((item) => item.id === id)
    return event ? normalizeIngressEventDetail(event) : null
  },

  replay: async (id: string) => {
    await getMockDelay()
    return updateIngress(id, (event) => ({
      ...event,
      status: 'REPLAYED',
      replayedAt: new Date().toISOString(),
      lastErrorSummary: null,
    }))
  },

  quarantine: async (id: string, reason: string) => {
    await getMockDelay()
    return updateIngress(id, (event) => ({
      ...event,
      status: 'QUARANTINED',
      quarantineReason: reason,
      quarantinedAt: new Date().toISOString(),
      lastErrorSummary: reason,
    }))
  },

  release: async (id: string) => {
    await getMockDelay()
    return updateIngress(id, (event) => ({
      ...event,
      status: 'RELEASED',
      quarantineReason: null,
      lastErrorSummary: null,
    }))
  },
}

const realService = {
  list: async (filters: IngressEventListFilters = {}): Promise<IngressEventListResult> => {
    const params = new URLSearchParams()
    if (filters.page !== undefined) params.set('page', String(filters.page))
    if (filters.size !== undefined) params.set('size', String(filters.size))
    if (filters.status) params.set('status', filters.status)
    if (filters.mailboxId) params.set('mailboxId', filters.mailboxId)
    if (filters.providerType) params.set('providerType', filters.providerType)
    if (filters.search) params.set('search', filters.search)
    const query = params.toString()
    const response = await apiClient.get<{ items: IngressEventResponse[]; page: number; size: number; totalElements: number; totalPages: number } | IngressEventResponse[]>(
      `/ingress-events${query ? `?${query}` : ''}`,
    )
    return normalizeIngressEventList(response)
  },

  getById: async (id: string): Promise<IngressEventDetail | null> => {
    const event = await apiClient.get<IngressEventDetailResponse | null>(`/ingress-events/${id}`)
    return event ? normalizeIngressEventDetail(event) : null
  },

  replay: async (id: string) => normalizeIngressEventDetail(await apiClient.post<IngressEventDetailResponse>(`/ingress-events/${id}/replay`, {})),

  quarantine: async (id: string, reason: string) => normalizeIngressEventDetail(await apiClient.post<IngressEventDetailResponse>(`/ingress-events/${id}/quarantine`, { reason })),

  release: async (id: string) => normalizeIngressEventDetail(await apiClient.post<IngressEventDetailResponse>(`/ingress-events/${id}/release`, {})),
}

export const ingressEventService = USE_MOCKS ? mockService : realService