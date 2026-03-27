/**
 * Tests for the real API client (fetch-based).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock env so API_URL is set
vi.mock('@/lib/env', () => ({ USE_MOCKS: false, API_URL: 'http://api.test' }))

const { apiClient, ApiError } = await import('@/services/api.client')

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiClient', () => {
  it('GET: returns parsed JSON on success', async () => {
    mockFetch(200, { id: '1', name: 'Test' })
    const result = await apiClient.get<{ id: string; name: string }>('/users/1')
    expect(result).toEqual({ id: '1', name: 'Test' })
  })

  it('POST: sends body and returns response', async () => {
    const spy = mockFetch(201, { token: 'abc', user: { id: 'u1' } })
    await apiClient.post('/auth/login', { email: 'a@b.com', password: 'pw' })
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('throws ApiError on 401', async () => {
    mockFetch(401, { code: 'unauthorized', message: 'Unauthorized' })
    try {
      await apiClient.get('/tickets')
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const e = err as InstanceType<typeof ApiError>
      expect(e.status).toBe(401)
      expect(e.code).toBe('unauthorized')
    }
  })

  it('throws ApiError on 404', async () => {
    mockFetch(404, { code: 'not_found', message: 'Not found' })
    await expect(apiClient.get('/tickets/bad-id')).rejects.toBeInstanceOf(ApiError)
  })

  it('throws ApiError with code=network_error on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network failure'))
    await expect(apiClient.get('/tickets')).rejects.toMatchObject({ code: 'network_error' })
  })
})
