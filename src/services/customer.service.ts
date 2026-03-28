import type { Customer } from '@/types/customer.types'
import type { Ticket } from '@/types/ticket.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockCustomers, mockTickets, getMockDelay } from '@/mock'

let _mockCustomers = [...mockCustomers]

const mockService = {
  getAll: async (search = '', segment?: string, isActive?: boolean): Promise<Customer[]> => {
    await getMockDelay()
    let result = [..._mockCustomers]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.emails.some((e) => e.toLowerCase().includes(q)),
      )
    }
    if (segment) result = result.filter((c) => c.segment === segment)
    if (isActive !== undefined) result = result.filter((c) => c.isActive === isActive)
    return result
  },

  getById: async (id: string): Promise<Customer | null> => {
    await getMockDelay()
    return _mockCustomers.find((c) => c.id === id) ?? null
  },

  getTickets: async (customerId: string): Promise<Ticket[]> => {
    await getMockDelay()
    return mockTickets.filter((t) => t.customerId === customerId)
  },

  create: async (data: Omit<Customer, 'id' | 'totalTickets' | 'openTickets' | 'createdAt'>): Promise<Customer> => {
    await getMockDelay()
    const newCustomer: Customer = {
      ...data,
      id: `c-${Date.now()}`,
      totalTickets: 0,
      openTickets: 0,
      createdAt: new Date().toISOString(),
    }
    _mockCustomers.push(newCustomer)
    return { ...newCustomer }
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    await getMockDelay()
    const idx = _mockCustomers.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Customer not found')
    _mockCustomers[idx] = { ..._mockCustomers[idx], ...data }
    return { ..._mockCustomers[idx] }
  },

  activate: async (id: string): Promise<Customer> => {
    await getMockDelay()
    const idx = _mockCustomers.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Customer not found')
    _mockCustomers[idx] = { ..._mockCustomers[idx], isActive: true }
    return { ..._mockCustomers[idx] }
  },

  deactivate: async (id: string): Promise<Customer> => {
    await getMockDelay()
    const idx = _mockCustomers.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Customer not found')
    _mockCustomers[idx] = { ..._mockCustomers[idx], isActive: false }
    return { ..._mockCustomers[idx] }
  },
}

// ---------------------------------------------------------------------------
// Real API implementation
// ---------------------------------------------------------------------------

const realService = {
  /**
   * GET /api/customers
   * Spec: bare array { id, name, code }[]
   * Query: search only (segment is not a spec filter param)
   */
  getAll: async (search = ''): Promise<Customer[]> => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const qs = params.toString()
    const res = await apiClient.get<Customer[]>(`/customers${qs ? `?${qs}` : ''}`)
    return Array.isArray(res) ? res : (res as { data: Customer[] }).data ?? []
  },

  getById: (id: string) => apiClient.get<Customer | null>(`/customers/${id}`),

  /**
   * GET /api/tickets?customerId={id} — paged response { items, totalElements }
   */
  getTickets: async (customerId: string): Promise<Ticket[]> => {
    type TicketPagedRes = { items: Ticket[]; totalElements: number } | Ticket[]
    const res = await apiClient.get<TicketPagedRes>(`/tickets?customerId=${encodeURIComponent(customerId)}`)
    return Array.isArray(res) ? res : (res as { items: Ticket[] }).items ?? []
  },

  /**
   * POST /api/customers
   * Spec body: { name, code }
   */
  create: (data: { name: string; code: string }) =>
    apiClient.post<Customer>('/customers', data),

  /**
   * PUT /api/customers/{id}
   * Spec body: { name, code }
   */
  update: (id: string, data: { name: string; code: string }) =>
    apiClient.put<Customer>(`/customers/${id}`, data),

  activate: (id: string) =>
    apiClient.patch<Customer>(`/customers/${id}/activate`, {}),

  deactivate: (id: string) =>
    apiClient.patch<Customer>(`/customers/${id}/deactivate`, {}),
}

export const customerService = USE_MOCKS ? mockService : realService
