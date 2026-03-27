import { ApiError } from '@/services/api.client'

/**
 * Extracts a user-friendly message from an unknown error value.
 * Handles ApiError, standard Error, and unknown objects safely.
 */
export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Your session has expired. Please sign in again.'
    if (err.status === 403) return 'You do not have permission to perform this action.'
    if (err.status === 404) return 'The requested resource was not found.'
    if (err.status === 0) return err.message // network/timeout
    return err.message
  }
  if (err instanceof Error) return err.message
  return fallback
}
