import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.hoisted(() => vi.fn())

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const { contactService } = await import('@/services/contact.service')

describe('contactService list-response contract', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('unwraps a PagedResponse ({items,...}) from GET /contacts — the actual backend shape', async () => {
    mockGet.mockResolvedValueOnce({
      items: [
        { id: 1, customerId: 1, name: 'Jane Doe', email: 'jane@example.com', isActive: true, isPrimary: true },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    })

    const contacts = await contactService.getAll()

    expect(mockGet).toHaveBeenCalledWith('/contacts')
    expect(contacts).toHaveLength(1)
    expect(contacts[0].fullName).toBe('Jane Doe')
  })

  it('still supports a bare array response', async () => {
    mockGet.mockResolvedValueOnce([
      { id: 2, customerId: 1, name: 'John Smith', email: 'john@example.com', isActive: true, isPrimary: false },
    ])

    const contacts = await contactService.getAll()

    expect(contacts).toHaveLength(1)
    expect(contacts[0].fullName).toBe('John Smith')
  })

  it('getByCustomer unwraps a PagedResponse the same way', async () => {
    mockGet.mockResolvedValueOnce({
      items: [{ id: 3, customerId: 5, name: 'Ada', email: 'ada@example.com', isActive: true, isPrimary: true }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    })

    const contacts = await contactService.getByCustomer('5')

    expect(mockGet).toHaveBeenCalledWith('/contacts/by-customer/5')
    expect(contacts).toHaveLength(1)
  })
})
