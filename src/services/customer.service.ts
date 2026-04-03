import type { Customer } from '@/types/customer.types'
import type { Ticket } from '@/types/ticket.types'
import type { CustomerResponse } from '@/types/api.types'
import { apiClient } from './api.client'
import { normalizeTicket } from './normalizers'

function toCustomer(raw: CustomerResponse): Customer {
  return {
    id: String(raw.id),
    name: raw.name,
    code: raw.code,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export const customerService = {
  /**
   * GET /api/customers
   * Query: search only
   */
  getAll: async (search = '', _segment?: string): Promise<Customer[]> => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const qs = params.toString()
    const res = await apiClient.get<CustomerResponse[]>(`/customers${qs ? `?${qs}` : ''}`)
    const list = Array.isArray(res) ? res : (res as unknown as { data: CustomerResponse[] }).data ?? []
    return list.map(toCustomer)
  },

  getById: async (id: string): Promise<Customer | null> => {
    const res = await apiClient.get<CustomerResponse | null>(`/customers/${id}`)
    return res ? toCustomer(res) : null
  },

  /**
   * GET /api/tickets?customerId={id} — paged response { items, totalElements }
   */
  getTickets: async (customerId: string): Promise<Ticket[]> => {
    type PagedRes = { items: Record<string, unknown>[]; totalElements: number } | Record<string, unknown>[]
    const res = await apiClient.get<PagedRes>(`/tickets?customerId=${encodeURIComponent(customerId)}`)
    const items = Array.isArray(res) ? res : (res as { items: Record<string, unknown>[] }).items ?? []
    return items.map(normalizeTicket)
  },

  create: (data: { name: string; code: string }) =>
    apiClient.post<CustomerResponse>('/customers', data).then(toCustomer),

  update: (id: string, data: { name: string; code: string }) =>
    apiClient.put<CustomerResponse>(`/customers/${id}`, data).then(toCustomer),

  activate: async (id: string) => {
    const raw = await apiClient.patch<CustomerResponse | undefined>(`/customers/${id}/activate`, {})
    if (raw) return toCustomer(raw)
    const refreshed = await apiClient.get<CustomerResponse>(`/customers/${id}`)
    return toCustomer(refreshed)
  },

  deactivate: async (id: string) => {
    const raw = await apiClient.patch<CustomerResponse | undefined>(`/customers/${id}/deactivate`, {})
    if (raw) return toCustomer(raw)
    const refreshed = await apiClient.get<CustomerResponse>(`/customers/${id}`)
    return toCustomer(refreshed)
  },
}
