/**
 * Ingress Event admin service — /admin/ingress-events/* endpoints.
 * Allows operators to list, inspect, retry, quarantine, and release
 * stuck or failed inbound processing events.
 */
import type {
  IngressEventResponse,
  IngressEventListResponse,
  IngressEventActionResponse,
  IngressEventListFilters,
  IngressEventStatus,
} from '@/types/api.types'
import { apiClient } from './api.client'

export interface IngressEvent {
  id: string
  externalId: string | null
  mailboxId: string | null
  mailboxName: string | null
  mailboxAddress: string | null
  status: IngressEventStatus
  fromAddress: string | null
  toAddress: string | null
  subject: string | null
  messageId: string | null
  errorMessage: string | null
  failureReason: string | null
  retryCount: number
  maxRetries: number | null
  receivedAt: string | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
  ticketId: string | null
}

function normalizeEvent(raw: IngressEventResponse): IngressEvent {
  return {
    id: String(raw.id),
    externalId: raw.externalId ?? null,
    mailboxId: raw.mailboxId != null ? String(raw.mailboxId) : null,
    mailboxName: raw.mailboxName ?? null,
    mailboxAddress: raw.mailboxAddress ?? null,
    status: raw.status,
    fromAddress: raw.fromAddress ?? null,
    toAddress: raw.toAddress ?? null,
    subject: raw.subject ?? null,
    messageId: raw.messageId ?? null,
    errorMessage: raw.errorMessage ?? null,
    failureReason: raw.failureReason ?? null,
    retryCount: raw.retryCount ?? 0,
    maxRetries: raw.maxRetries ?? null,
    receivedAt: raw.receivedAt ?? null,
    processedAt: raw.processedAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    ticketId: raw.ticketId != null ? String(raw.ticketId) : null,
  }
}

export interface IngressEventPage {
  items: IngressEvent[]
  page: number
  size: number
  total: number
  totalPages: number
}

export const ingressService = {
  /** GET /admin/ingress-events — paginated list with optional status/mailbox filter */
  list: async (filters: IngressEventListFilters = {}): Promise<IngressEventPage> => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.mailboxId) params.set('mailboxId', filters.mailboxId)
    if (filters.page !== undefined) params.set('page', String(filters.page))
    if (filters.size !== undefined) params.set('size', String(filters.size))

    const query = params.toString()
    const response = await apiClient.get<IngressEventListResponse>(
      `/admin/ingress-events${query ? `?${query}` : ''}`,
    )

    if (Array.isArray(response)) {
      const items = response.map(normalizeEvent)
      return { items, page: 0, size: items.length, total: items.length, totalPages: 1 }
    }
    return {
      items: response.items.map(normalizeEvent),
      page: response.page,
      size: response.size,
      total: response.totalElements,
      totalPages: response.totalPages,
    }
  },

  /** GET /admin/ingress-events/{id} */
  getById: async (id: string): Promise<IngressEvent> => {
    const raw = await apiClient.get<IngressEventResponse>(`/admin/ingress-events/${id}`)
    return normalizeEvent(raw)
  },

  /** POST /admin/ingress-events/{id}/retry */
  retry: async (id: string): Promise<IngressEventActionResponse> =>
    apiClient.post<IngressEventActionResponse>(`/admin/ingress-events/${id}/retry`, {}),

  /** POST /admin/ingress-events/{id}/quarantine */
  quarantine: async (id: string): Promise<IngressEventActionResponse> =>
    apiClient.post<IngressEventActionResponse>(`/admin/ingress-events/${id}/quarantine`, {}),

  /** POST /admin/ingress-events/{id}/release */
  release: async (id: string): Promise<IngressEventActionResponse> =>
    apiClient.post<IngressEventActionResponse>(`/admin/ingress-events/${id}/release`, {}),

  /** POST /admin/ingress-events/{id}/process */
  process: async (id: string): Promise<IngressEventActionResponse> =>
    apiClient.post<IngressEventActionResponse>(`/admin/ingress-events/${id}/process`, {}),
}
