/**
 * Contact service — aligned to CaseFlow API v2.0.0 /api/contacts endpoints.
 */
import type { Contact } from '@/types/customer.types'
import type { ContactResponse, CreateContactRequest, UpdateContactRequest } from '@/types/api.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { getMockDelay } from '@/mock'

// ---------------------------------------------------------------------------
// Mock data
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
      customerId: String(req.customerId),
      firstName: '',
      lastName: '',
      fullName: req.name,
      email: req.email,
      phone: null,
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
      fullName: data.name,
      isPrimary: data.isPrimary ?? c.isPrimary,
      isActive: data.isActive ?? c.isActive,
    }
    return { ..._mockContacts[idx] }
  },
}

// ---------------------------------------------------------------------------
// Helper: map ContactResponse → Contact view model
// Spec ContactResponse: { id, customerId, email, name, isPrimary, isActive, createdAt }
// ---------------------------------------------------------------------------

function toContact(r: ContactResponse): Contact {
  return {
    id: String(r.id),
    customerId: String(r.customerId),
    // Backend returns single `name` field — derive firstName/lastName from it
    firstName: '',
    lastName: '',
    fullName: r.name,
    email: r.email,
    phone: null,
    isActive: r.isActive,
    isPrimary: r.isPrimary,
  }
}

// ---------------------------------------------------------------------------
// Real API implementation
// ---------------------------------------------------------------------------

const realService = {
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

  /**
   * POST /api/contacts
   * Body: { customerId: int64, email, name, isPrimary? }
   */
  create: async (req: CreateContactRequest): Promise<Contact> => {
    const res = await apiClient.post<ContactResponse>('/contacts', {
      customerId: Number(req.customerId),
      email: req.email,
      name: req.name,
      ...(req.isPrimary !== undefined ? { isPrimary: req.isPrimary } : {}),
    })
    return toContact(res)
  },

  /**
   * PUT /api/contacts/{id}
   * Body: { name, isPrimary?, isActive? }
   */
  update: async (id: string, data: UpdateContactRequest): Promise<Contact> => {
    const res = await apiClient.put<ContactResponse>(`/contacts/${id}`, data)
    return toContact(res)
  },
}

export const contactService = USE_MOCKS ? mockService : realService
