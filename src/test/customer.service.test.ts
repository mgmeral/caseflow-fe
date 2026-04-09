import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.hoisted(() => vi.fn())
const mockPost = vi.hoisted(() => vi.fn())
const mockPut = vi.hoisted(() => vi.fn())
const mockPatch = vi.hoisted(() => vi.fn())
const mockDelete = vi.hoisted(() => vi.fn())

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
  },
}))

vi.mock('@/services/normalizers', () => ({
  normalizeTicket: (raw: Record<string, unknown>) => ({ id: String(raw.id ?? 't1') }),
}))

const { customerService } = await import('@/services/customer.service')

describe('customerService persistence contract', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPut.mockReset()
    mockPatch.mockReset()
    mockDelete.mockReset()
  })

  it('lists customers from backend and maps fields', async () => {
    mockGet.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Akbank',
        code: 'AKBANK',
        isActive: true,
        colorHex: '#0d5ac9',
      },
    ])

    const result = await customerService.getAll('ak')

    expect(mockGet).toHaveBeenCalledWith('/customers?search=ak')
    expect(result).toEqual([
      {
        id: '1',
        name: 'Akbank',
        code: 'AKBANK',
        isActive: true,
        colorHex: '#0d5ac9',
        createdAt: null,
        updatedAt: null,
      },
    ])
  })

  it('creates and updates customer via backend', async () => {
    mockPost.mockResolvedValueOnce({
      id: 5,
      name: 'Akbank',
      code: 'AKBANK',
      isActive: true,
      colorHex: '#0d5ac9',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    })
    mockPut.mockResolvedValueOnce({
      id: 5,
      name: 'Akbank Updated',
      code: 'AKBANK',
      isActive: true,
      colorHex: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-03T00:00:00Z',
    })

    await customerService.create({ name: 'Akbank', code: 'akbank', colorHex: '#0d5ac9' })
    await customerService.update('5', { name: 'Akbank Updated', code: 'akbank', colorHex: '' as unknown as null })

    expect(mockPost).toHaveBeenCalledWith('/customers', { name: 'Akbank', code: 'AKBANK', colorHex: '#0d5ac9' })
    expect(mockPut).toHaveBeenCalledWith('/customers/5', { name: 'Akbank Updated', code: 'AKBANK', colorHex: null })
  })

  it('activates and deactivates customer via backend', async () => {
    mockPatch.mockResolvedValue({
      id: 5,
      name: 'Akbank',
      code: 'AKBANK',
      isActive: true,
      colorHex: '#0d5ac9',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-03T00:00:00Z',
    })

    await customerService.activate('5')
    await customerService.deactivate('5')

    expect(mockPatch).toHaveBeenNthCalledWith(1, '/customers/5/activate', {})
    expect(mockPatch).toHaveBeenNthCalledWith(2, '/customers/5/deactivate', {})
  })

  it('deletes customer via backend', async () => {
    mockDelete.mockResolvedValueOnce(undefined)

    await customerService.delete('5')

    expect(mockDelete).toHaveBeenCalledWith('/customers/5')
  })
})
