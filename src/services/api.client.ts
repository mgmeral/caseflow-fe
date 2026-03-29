/// <reference types="vite/client" />

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
const DEFAULT_TIMEOUT_MS = 30_000

export interface FieldViolation {
  field: string
  message: string
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly violations?: FieldViolation[],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getAuthHeader(): Record<string, string> {
  try {
    const raw = localStorage.getItem('csm-auth')
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } }
    const token = parsed?.state?.accessToken
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

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...getAuthHeader(),
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body as FormData
            : JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let code = 'api_error'
      let message = `Request failed with status ${response.status}`
      let violations: FieldViolation[] | undefined
      try {
        const errBody = await response.json() as {
          code?: string
          message?: string
          error?: string
          violations?: FieldViolation[]
        }
        code = errBody.code ?? code
        message = errBody.message ?? errBody.error ?? message
        violations = errBody.violations
      } catch {
        // ignore parse error, use defaults
      }
      // Signal token expiry/revocation so the auth layer can clear session.
      // Skipped for /auth/login to avoid interfering with credential-error handling.
      if (response.status === 401 && !path.includes('/auth/login')) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }
      throw new ApiError(response.status, code, message, violations)
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
