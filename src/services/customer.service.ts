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

// Backend may return a plain array (pagination deferred) or paginated shape.
type CustomerListResponse = Customer[] | { data: Customer[]; total: number }

const realService = {
  getAll: async (search = '', segment?: string, isActive?: boolean): Promise<Customer[]> => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (segment) params.set('segment', segment)
    if (isActive !== undefined) params.set('isActive', String(isActive))
    const res = await apiClient.get<CustomerListResponse>(`/customers?${params.toString()}`)
    return Array.isArray(res) ? res : res.data
  },

  getById: (id: string) => apiClient.get<Customer | null>(`/customers/${id}`),

  /**
   * GET /tickets?customerId={id} — returns tickets for this customer.
   * If the backend does not support the customerId filter, it may return all tickets.
   * Response is normalised to an array regardless of shape.
   */
  getTickets: async (customerId: string): Promise<Ticket[]> => {
    type TicketListRes = Ticket[] | { data: Ticket[] }
    const res = await apiClient.get<TicketListRes>(`/tickets?customerId=${encodeURIComponent(customerId)}`)
    return Array.isArray(res) ? res : res.data
  },

  create: (data: Omit<Customer, 'id' | 'totalTickets' | 'openTickets' | 'createdAt'>) =>
    apiClient.post<Customer>('/customers', data),

  update: (id: string, data: Partial<Customer>) =>
    apiClient.put<Customer>(`/customers/${id}`, data),

  activate: (id: string) =>
    apiClient.patch<Customer>(`/customers/${id}/activate`, {}),

  deactivate: (id: string) =>
    apiClient.patch<Customer>(`/customers/${id}/deactivate`, {}),
}

export const customerService = USE_MOCKS ? mockService : realService
