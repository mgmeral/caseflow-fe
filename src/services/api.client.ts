/// <reference types="vite/client" />

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
const DEFAULT_TIMEOUT_MS = 30_000

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getAuthHeader(): Record<string, string> {
  try {
    const raw = localStorage.getItem('csm-auth')
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { state?: { currentUser?: { token?: string } } }
    const token = parsed?.state?.currentUser?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...getAuthHeader(),
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let code = 'api_error'
      let message = `Request failed with status ${response.status}`
      try {
        const errBody = await response.json() as { code?: string; message?: string; error?: string }
        code = errBody.code ?? code
        message = errBody.message ?? errBody.error ?? message
      } catch {
        // ignore parse error, use defaults
      }
      throw new ApiError(response.status, code, message)
    }

    if (response.status === 204) {
      return undefined as unknown as T
    }

    return response.json() as Promise<T>
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof ApiError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, 'timeout', 'Request timed out')
    }
    throw new ApiError(0, 'network_error', 'Network error — please check your connection')
  }
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>('GET', path),
  post: <T>(path: string, body: unknown): Promise<T> => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown): Promise<T> => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown): Promise<T> => request<T>('PATCH', path, body),
  delete: <T>(path: string): Promise<T> => request<T>('DELETE', path),
}
