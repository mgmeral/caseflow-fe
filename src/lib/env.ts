/// <reference types="vite/client" />

/**
 * Backend API base URL. Required in all environments.
 */
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

// Warn developers when API URL is not configured.
if (!API_URL) {
  console.warn(
    '[env] VITE_API_URL is not set. All API calls will fail. Set VITE_API_URL in .env.local.',
  )
}
