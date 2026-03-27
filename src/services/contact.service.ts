/**
 * Contact service — aligned to backend /api/contacts endpoints.
 * Contacts are a new domain (no existing FE pages for this).
 */
import type { Contact } from '@/types/customer.types'
import type { ContactResponse, CreateContactRequest, UpdateContactRequest } from '@/types/api.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { getMockDelay } from '@/mock'

// ---------------------------------------------------------------------------
// Mock data (contacts domain has no existing mock data — start empty)
// ---------------------------------------------------------------------------

let _mockContacts: Contact[] = []

const mockService = {
  getAll: async (): Promise<Contact[]> => {
    await getMockDelay()
    return [..._mockContacts]
  },

  getById: async (id: string): Promise<Contact | null> => {
    await getMockDelay()
    return _mockContacts.find((c) => c.id === id) ?? null
  },

  getByCustomer: async (customerId: string): Promise<Contact[]> => {
    await getMockDelay()
    return _mockContacts.filter((c) => c.customerId === customerId)
  },

  getByEmail: async (email: string): Promise<Contact | null> => {
    await getMockDelay()
    return _mockContacts.find((c) => c.email === email) ?? null
  },

  create: async (req: CreateContactRequest): Promise<Contact> => {
    await getMockDelay()
    const contact: Contact = {
      id: `cnt-${Date.now()}`,
      customerId: req.customerId,
      firstName: req.firstName,
      lastName: req.lastName,
      fullName: `${req.firstName} ${req.lastName}`,
      email: req.email,
      phone: req.phone ?? null,
      isActive: true,
      isPrimary: req.isPrimary ?? false,
    }
    _mockContacts.push(contact)
    return { ...contact }
  },

  update: async (id: string, data: UpdateContactRequest): Promise<Contact> => {
    await getMockDelay()
    const idx = _mockContacts.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Contact not found')
    const c = _mockContacts[idx]
    _mockContacts[idx] = {
      ...c,
      ...data,
      fullName: `${data.firstName ?? c.firstName} ${data.lastName ?? c.lastName}`,
    }
    return { ..._mockContacts[idx] }
  },
}

// ---------------------------------------------------------------------------
// Helper: map ContactResponse → Contact view model
// ---------------------------------------------------------------------------

function toContact(r: ContactResponse): Contact {
  return {
    id: r.id,
    customerId: r.customerId,
    firstName: r.firstName,
    lastName: r.lastName,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    isActive: r.isActive,
    isPrimary: r.isPrimary,
  }
}

// ---------------------------------------------------------------------------
// Real API implementation
// ---------------------------------------------------------------------------

type ContactListResponse = ContactResponse[] | { data: ContactResponse[] }

const realService = {
  getAll: async (): Promise<Contact[]> => {
    const res = await apiClient.get<ContactListResponse>('/contacts')
    const items = Array.isArray(res) ? res : res.data
    return items.map(toContact)
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
    const res = await apiClient.post<ContactResponse>('/contacts', req)
    return toContact(res)
  },

  update: async (id: string, data: UpdateContactRequest): Promise<Contact> => {
    const res = await apiClient.put<ContactResponse>(`/contacts/${id}`, data)
    return toContact(res)
  },
}

export const contactService = USE_MOCKS ? mockService : realService
