import type { CreateCustomerRequest, CustomerResponse, CustomerSummaryResponse, UpdateCustomerRequest } from '@/types/api.types'
import type { Customer } from '@/types/customer.types'
import type { Ticket } from '@/types/ticket.types'
import { apiClient } from './api.client'
import { normalizeTicket } from './normalizers'

function normalizeColorHex(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null

  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  const shortHexMatch = withHash.match(/^#([0-9a-f]{3})$/i)
  if (shortHexMatch) {
    const [, shortHex] = shortHexMatch
    return `#${shortHex.split('').map((character) => `${character}${character}`).join('')}`
  }

  return /^#[0-9a-f]{6}$/i.test(withHash) ? withHash : null
}

function toCustomer(raw: CustomerSummaryResponse | CustomerResponse): Customer {
  return {
    id: String(raw.id),
    name: raw.name,
    code: raw.code,
    isActive: raw.isActive,
    colorHex: normalizeColorHex(raw.colorHex),
    createdAt: 'createdAt' in raw ? raw.createdAt : null,
    updatedAt: 'updatedAt' in raw ? raw.updatedAt : null,
  }
}

function toCustomerPayload(data: CreateCustomerRequest | UpdateCustomerRequest): CreateCustomerRequest | UpdateCustomerRequest {
  return {
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    colorHex: normalizeColorHex(data.colorHex),
  }
}

export const customerService = {
  /**
   * GET /api/customers
   * Query: search only
   */
  getAll: async (search = '', isActive?: boolean): Promise<Customer[]> => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (typeof isActive === 'boolean') params.set('isActive', String(isActive))
    const qs = params.toString()
    const res = await apiClient.get<CustomerSummaryResponse[]>(`/customers${qs ? `?${qs}` : ''}`)
    const wrapped = res as unknown as { items?: CustomerSummaryResponse[]; data?: CustomerSummaryResponse[] }
    const list = Array.isArray(res) ? res : wrapped.items ?? wrapped.data ?? []
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

  create: (data: CreateCustomerRequest) =>
    apiClient.post<CustomerResponse>('/customers', toCustomerPayload(data)).then(toCustomer),

  update: (id: string, data: UpdateCustomerRequest) =>
    apiClient.put<CustomerResponse>(`/customers/${id}`, toCustomerPayload(data)).then(toCustomer),

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/customers/${id}`)
  },

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
