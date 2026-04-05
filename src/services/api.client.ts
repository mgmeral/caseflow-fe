/// <reference types="vite/client" />

import { API_URL } from '@/lib/env'

const BASE_URL = API_URL
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

type ResponseType = 'json' | 'blob' | 'text'

interface RequestOptions {
  responseType?: ResponseType
  accept?: string
}

function isAbsoluteUrl(path: string): boolean {
  return /^https?:\/\//i.test(path)
}

function buildRequestUrl(path: string): string {
  if (!path) return BASE_URL
  if (!BASE_URL || isAbsoluteUrl(path)) return path

  try {
    const base = new URL(BASE_URL)

    if (path.startsWith('/')) {
      const normalizedBasePath = base.pathname.replace(/\/+$/, '')
      const normalizedRequestPath = path.replace(/\/+$/, '') || '/'

      if (
        normalizedBasePath
        && normalizedBasePath !== '/'
        && normalizedRequestPath === normalizedBasePath
      ) {
        return `${base.origin}${normalizedRequestPath}`
      }

      if (
        normalizedBasePath
        && normalizedBasePath !== '/'
        && normalizedRequestPath.startsWith(`${normalizedBasePath}/`)
      ) {
        return `${base.origin}${normalizedRequestPath}`
      }

      return `${base.origin}${normalizedBasePath}${normalizedRequestPath}`
    }

    return `${BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
  } catch {
    return `${BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  const responseType = options.responseType ?? 'json'

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const headers: Record<string, string> = {
    Accept: options.accept ?? (responseType === 'json' ? 'application/json' : '*/*'),
    ...getAuthHeader(),
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const response = await fetch(buildRequestUrl(path), {
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

    const contentLength = response.headers?.get?.('content-length')
    if (contentLength === '0') {
      return undefined as unknown as T
    }

    if (responseType === 'blob') {
      return await response.blob() as T
    }

    if (responseType === 'text') {
      return await response.text() as T
    }

    try {
      return await response.json() as T
    } catch {
      // Some successful endpoints (e.g., 202 Accepted) may return an empty body.
      return undefined as unknown as T
    }
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
  getBlob: (path: string): Promise<Blob> => request<Blob>('GET', path, undefined, { responseType: 'blob' }),
  getText: (path: string): Promise<string> => request<string>('GET', path, undefined, { responseType: 'text', accept: 'text/plain, application/json;q=0.9, */*;q=0.8' }),
  post: <T>(path: string, body: unknown): Promise<T> => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown): Promise<T> => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown): Promise<T> => request<T>('PATCH', path, body),
  delete: <T>(path: string): Promise<T> => request<T>('DELETE', path),
}
