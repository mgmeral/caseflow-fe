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

const { ingressService } = await import('@/services/ingress.service')

describe('ingressService.list', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('calls the real backend path /admin/ingress-events, not /admin/ingress/events', async () => {
    mockGet.mockResolvedValueOnce({ items: [], page: 0, size: 25, totalElements: 0, totalPages: 0 })

    await ingressService.list()

    expect(mockGet).toHaveBeenCalledWith('/admin/ingress-events')
  })

  it('parses the PagedResponse ({items,...}) shape the backend now returns', async () => {
    mockGet.mockResolvedValueOnce({
      items: [
        {
          id: 1,
          externalId: 'ext-1',
          mailboxId: 2,
          mailboxName: 'support@caseflow.local',
          mailboxAddress: 'support@caseflow.local',
          status: 'FAILED',
          fromAddress: 'a@b.com',
          toAddress: 'support@caseflow.local',
          subject: 'Help',
          messageId: 'm1',
          errorMessage: null,
          failureReason: null,
          retryCount: 1,
          maxRetries: 3,
          receivedAt: '2026-01-01T00:00:00Z',
          processedAt: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          ticketId: null,
        },
      ],
      page: 0,
      size: 25,
      totalElements: 1,
      totalPages: 1,
    })

    const result = await ingressService.list()

    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('1')
    expect(result.total).toBe(1)
  })

  it('still supports a bare array response', async () => {
    mockGet.mockResolvedValueOnce([])

    const result = await ingressService.list()

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })
})
