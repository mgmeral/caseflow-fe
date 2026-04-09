/**
 * Tests for the real API client (fetch-based).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock env so API_URL is set
vi.mock('@/lib/env', () => ({ API_URL: '/api' }))

const { apiClient, ApiError } = await import('@/services/api.client')

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response)
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
    const spy = mockFetch(201, { accessToken: 'abc', refreshToken: 'ref', tokenType: 'Bearer', expiresIn: 3600 })
    await apiClient.post('/auth/login', { username: 'a@b.com', password: 'pw' })
    expect(spy).toHaveBeenCalledWith(
      '/api/auth/login',
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

  it('parses FieldViolation array from 422 validation error', async () => {
    mockFetch(422, {
      code: 'validation_error',
      message: 'Request validation failed',
      violations: [
        { field: 'subject', message: 'must not be blank' },
        { field: 'customerId', message: 'must not be null' },
      ],
    })
    try {
      await apiClient.post('/tickets', {})
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const e = err as InstanceType<typeof ApiError>
      expect(e.status).toBe(422)
      expect(e.code).toBe('validation_error')
      expect(e.violations).toHaveLength(2)
      expect(e.violations?.[0]).toEqual({ field: 'subject', message: 'must not be blank' })
    }
  })

  it('GET blob: returns binary content through the authenticated client', async () => {
    const blob = new Blob(['file-bytes'], { type: 'application/pdf' })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      blob: () => Promise.resolve(blob),
    } as unknown as Response)

    const result = await apiClient.getBlob('/tickets/1/emails/2/attachments/3/content')

    expect(result).toBe(blob)
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/tickets/1/emails/2/attachments/3/content',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('does not double-prefix relative backend API paths that already start with /api', async () => {
    const blob = new Blob(['file-bytes'], { type: 'application/pdf' })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      blob: () => Promise.resolve(blob),
    } as unknown as Response)

    const result = await apiClient.getBlob('/api/tickets/1/emails/2/attachments/3/content')

    expect(result).toBe(blob)
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/tickets/1/emails/2/attachments/3/content',
      expect.objectContaining({ method: 'GET' }),
    )
    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/api/tickets/1/emails/2/attachments/3/content'),
      expect.anything(),
    )
  })

  it('keeps intentional absolute URLs untouched', async () => {
    const spy = mockFetch(200, { ok: true })

    await apiClient.get('https://files.caseflow.test/api/attachments/123')

    expect(spy).toHaveBeenCalledWith(
      'https://files.caseflow.test/api/attachments/123',
      expect.objectContaining({ method: 'GET' }),
    )
  })
})
