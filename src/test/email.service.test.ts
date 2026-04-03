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

vi.mock('@/services/ticketEmail.service', () => ({
  ticketEmailService: {
    listThread: vi.fn().mockResolvedValue([]),
    getDetail: vi.fn(),
  },
}))

const { emailService } = await import('@/services/email.service')

describe('emailService backend contract', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('gets email detail via /emails/{id}', async () => {
    mockGet.mockResolvedValueOnce({
      id: 'e1',
      ticketId: 't1',
      from: 'customer@example.com',
      textBody: 'Hello',
      htmlBody: null,
      receivedAt: '2025-01-01T00:00:00Z',
      attachments: [{ fileName: 'a.txt' }],
    })

    const result = await emailService.getById('e1')

    expect(mockGet).toHaveBeenCalledWith('/emails/e1')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('e1')
    expect(result?.ticketId).toBe('t1')
    expect(result?.attachments).toEqual(['a.txt'])
  })
})
