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

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    await getMockDelay()
    const idx = _mockCustomers.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Customer not found')
    _mockCustomers[idx] = { ..._mockCustomers[idx], ...data }
    return { ..._mockCustomers[idx] }
  },
}

interface CustomerListResponse {
  data: Customer[]
  total: number
}

const realService = {
  getAll: async (search = '', segment?: string, isActive?: boolean): Promise<Customer[]> => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (segment) params.set('segment', segment)
    if (isActive !== undefined) params.set('isActive', String(isActive))
    const res = await apiClient.get<CustomerListResponse>(`/customers?${params.toString()}`)
    return res.data
  },

  getById: (id: string) => apiClient.get<Customer | null>(`/customers/${id}`),

  getTickets: (customerId: string) =>
    apiClient.get<Ticket[]>(`/customers/${customerId}/tickets`),

  update: (id: string, data: Partial<Customer>) =>
    apiClient.put<Customer>(`/customers/${id}`, data),
}

export const customerService = USE_MOCKS ? mockService : realService
