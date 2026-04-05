export function getEmailDisplayHtml(email: { sanitizedHtmlBody: string | null }): string | null {
  return email.sanitizedHtmlBody ?? null
}

export function getEmailDisplayText(email: { bodyText: string | null; bodyPreview: string | null }): string | null {
  return email.bodyText ?? email.bodyPreview ?? null
}

export interface DispatchStatusMeta {
  category: 'pending' | 'active' | 'success' | 'error'
  label: string
}

export function getDispatchStatusMeta(status: string | null | undefined): DispatchStatusMeta | null {
  switch (status) {
    case 'PENDING':
    case 'QUEUED':
      return { category: 'pending', label: 'Queued' }
    case 'PROCESSING':
    case 'SENDING':
      return { category: 'active', label: 'Sending' }
    case 'SENT':
      return { category: 'success', label: 'Sent' }
    case 'DISPATCHED':
      return { category: 'active', label: 'Dispatched' }
    case 'DELIVERED':
      return { category: 'success', label: 'Delivered' }
    case 'FAILED':
    case 'PERMANENTLY_FAILED':
      return { category: 'error', label: 'Failed' }
    default:
      return null
  }
}

export interface ReplyFeedback {
  tone: 'info' | 'success' | 'error'
  text: string
}

export function getReplyFeedback(status: string | null | undefined, message: string | null): ReplyFeedback {
  switch (status) {
    case 'PENDING':
    case 'QUEUED':
      return { tone: 'info', text: 'Reply queued for delivery.' }
    case 'PROCESSING':
    case 'SENDING':
      return { tone: 'info', text: 'Reply is being sent.' }
    case 'SENT':
      return { tone: 'success', text: 'Reply sent.' }
    case 'DISPATCHED':
      return { tone: 'info', text: 'Reply dispatched to outbound delivery.' }
    case 'DELIVERED':
      return { tone: 'success', text: 'Reply delivered.' }
    case 'FAILED':
    case 'PERMANENTLY_FAILED':
      return { tone: 'error', text: message ?? 'Reply failed to send.' }
    case 'UNKNOWN':
      return { tone: 'info', text: 'Reply request completed, but the backend did not confirm a send state yet.' }
    default:
      return { tone: 'info', text: status ? `Reply status updated: ${status}.` : 'Reply status updated.' }
  }
}

export function isFailedDispatch(status: string | null | undefined): boolean {
  return status === 'FAILED' || status === 'PERMANENTLY_FAILED'
}