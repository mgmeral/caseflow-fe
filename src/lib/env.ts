/// <reference types="vite/client" />

/**
 * Whether mock mode is active. Set VITE_USE_MOCKS=true in .env.local to
 * enable client-side mocks without a running backend.
 */
export const USE_MOCKS =
  (import.meta.env.VITE_USE_MOCKS as string | undefined) === 'true'

/**
 * Backend API base URL. Required in production; optional in mock mode.
 */
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

// Warn developers when running real mode without an API URL configured.
if (!USE_MOCKS && !API_URL) {
  console.warn(
    '[env] VITE_USE_MOCKS is false but VITE_API_URL is not set. ' +
      'All API calls will fail. Set VITE_API_URL in .env.local or enable mock mode.',
  )
}
