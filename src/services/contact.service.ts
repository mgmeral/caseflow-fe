/**
 * Contact service — aligned to CaseFlow API v2.0.0 /api/contacts endpoints.
 */
import type { Contact } from '@/types/customer.types'
import type { ContactResponse, CreateContactRequest, UpdateContactRequest } from '@/types/api.types'
import { apiClient } from './api.client'

function toContact(r: ContactResponse): Contact {
  return {
    id: String(r.id),
    customerId: String(r.customerId),
    firstName: '',
    lastName: '',
    fullName: r.name,
    email: r.email,
    phone: null,
    isActive: r.isActive,
    isPrimary: r.isPrimary,
  }
}

export const contactService = {
  getAll: async (): Promise<Contact[]> => {
    const res = await apiClient.get<ContactResponse[]>('/contacts')
    return res.map(toContact)
  },

  getById: async (id: string): Promise<Contact | null> => {
    const res = await apiClient.get<ContactResponse | null>(`/contacts/${id}`)
    return res ? toContact(res) : null
  },

  getByCustomer: async (customerId: string): Promise<Contact[]> => {
    const res = await apiClient.get<ContactResponse[]>(`/contacts/by-customer/${customerId}`)
    return res.map(toContact)
  },

  getByEmail: async (email: string): Promise<Contact | null> => {
    const res = await apiClient.get<ContactResponse | null>(
      `/contacts/by-email?email=${encodeURIComponent(email)}`,
    )
    return res ? toContact(res) : null
  },

  create: async (req: CreateContactRequest): Promise<Contact> => {
    const res = await apiClient.post<ContactResponse>('/contacts', {
      customerId: Number(req.customerId),
      email: req.email,
      name: req.name,
      ...(req.isPrimary !== undefined ? { isPrimary: req.isPrimary } : {}),
    })
    return toContact(res)
  },

  update: async (id: string, data: UpdateContactRequest): Promise<Contact> => {
    const res = await apiClient.put<ContactResponse>(`/contacts/${id}`, data)
    return toContact(res)
  },
}
