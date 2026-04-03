import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.hoisted(() => vi.fn())
const mockPost = vi.hoisted(() => vi.fn())

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/services/email-platform.normalizers', () => ({
  normalizeIngressEventList: (raw: unknown) => raw,
  normalizeIngressEventDetail: (raw: unknown) => raw,
  normalizeMailboxList: (raw: unknown) => raw,
  normalizeMailbox: (raw: unknown) => raw,
  normalizeCustomerEmailSettings: (raw: unknown) => raw,
  normalizeCustomerEmailRoutingRule: (raw: unknown) => raw,
  normalizeSendTicketReplyResult: (raw: unknown) => raw,
  normalizeTicketEmailMessage: (raw: unknown) => raw,
}))

const { ingressEventService } = await import('@/services/ingressEvent.service')

describe('ingressEventService backend contract', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
  })

  it('lists ingress events via /admin/ingress-events with query params', async () => {
    mockGet.mockResolvedValueOnce({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })

    await ingressEventService.list({ page: 0, size: 20, status: 'FAILED', mailboxId: 'm1', ticketId: '42' })

    expect(mockGet).toHaveBeenCalledWith('/admin/ingress-events?page=0&size=20&status=FAILED&mailboxId=m1&ticketId=42')
  })

  it('gets detail and executes process/quarantine/release actions', async () => {
    mockGet.mockResolvedValueOnce({ id: 'e1' })
    mockPost.mockResolvedValue({ id: 'e1' })

    await ingressEventService.getById('e1')
    await ingressEventService.process('e1')
    await ingressEventService.quarantine('e1', 'suspicious sender')
    await ingressEventService.release('e1')

    expect(mockGet).toHaveBeenCalledWith('/admin/ingress-events/e1')
    expect(mockPost).toHaveBeenNthCalledWith(1, '/admin/ingress-events/e1/process', {})
    expect(mockPost).toHaveBeenNthCalledWith(2, '/admin/ingress-events/e1/quarantine', { reason: 'suspicious sender' })
    expect(mockPost).toHaveBeenNthCalledWith(3, '/admin/ingress-events/e1/release', {})
  })
})
