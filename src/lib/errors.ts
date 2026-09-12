import { ApiError } from '@/services/api.client'

/**
 * Domain-aware error messages keyed on error code.
 * Matched before falling back to HTTP status.
 */
const DOMAIN_MESSAGES: Record<string, string> = {
  // Assignment
  ASSIGNMENT_CONFLICT: 'This ticket is already assigned — the assignment has been updated.',
  ASSIGNMENT_NOT_FOUND: 'Assignment not found. The ticket may have already been unassigned.',
  TICKET_NOT_FOUND: 'Ticket not found. It may have been deleted or already resolved.',
  // Transfer
  TRANSFER_SAME_GROUP: 'Cannot transfer to the same group the ticket is already in.',
  TRANSFER_NOT_FOUND: 'Transfer record not found.',
  // State
  INVALID_STATE_TRANSITION: 'This action cannot be performed — the item is in an incompatible state.',
  TICKET_ALREADY_CLOSED: 'This ticket has already been closed.',
  TICKET_ALREADY_OPEN: 'This ticket is already open.',
  // Ingress / email
  INGRESS_EVENT_NOT_FOUND: 'Ingress event not found. It may have already been processed or deleted.',
  // Reply / send
  MAILBOX_UNAVAILABLE: 'The selected mailbox is currently unavailable. Please try again or choose another mailbox.',
  MAILBOX_NOT_ACTIVE: 'The selected mailbox is inactive and cannot send email.',
  REPLY_PREVIEW_MISSING: 'Reply preview is unavailable — ensure an inbound event is selected before sending.',
  // Mailbox admin
  MAILBOX_NOT_FOUND: 'Mailbox not found. It may have been removed.',
  CONNECTION_TEST_FAILED: 'Connection test failed. Check host, port, credentials and try again.',
  MAILBOX_POLLING_DISABLED: 'Polling is disabled for this mailbox. Enable polling before triggering a poll cycle.',
  // Customer / config
  CUSTOMER_NOT_FOUND: 'Customer not found. It may have been deleted.',
  RULE_NOT_FOUND: 'Routing rule not found. It may have been deleted.',
  // AI Assist
  AI_SUMMARY_UNAVAILABLE: 'AI summary is currently unavailable. Please try again later.',
  AI_REPLY_DRAFT_UNAVAILABLE: 'Reply draft generation is currently unavailable. Please try again later.',
  AI_CONTEXT_INSUFFICIENT: 'Not enough ticket context to generate a suggestion.',
}

/**
 * Extracts a user-friendly message from an unknown error value.
 * Checks domain code first, then HTTP status, then falls back.
 */
export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  if (err instanceof ApiError) {
    // Domain-code match takes priority
    if (err.code && DOMAIN_MESSAGES[err.code]) return DOMAIN_MESSAGES[err.code]
    // HTTP status fallbacks
    if (err.status === 401) return 'Your session has expired. Please sign in again.'
    if (err.status === 403) return 'You do not have permission to perform this action.'
    if (err.status === 404) return err.message || 'The requested resource was not found.'
    if (err.status === 409) return err.message || 'This action conflicts with the current state of the record.'
    if (err.status === 422) return err.message || 'The request was rejected — please check the field values and try again.'
    if (err.status === 0) return err.message // network/timeout
    return err.message
  }
  if (err instanceof Error) return err.message
  return fallback
}
