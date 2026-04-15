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

interface ReplyErrorContext {
  action: 'send' | 'schedule'
  mailboxLabel?: string | null
  hasMailbox: boolean
  sourceEventState: 'valid' | 'missing' | 'invalid'
  templateLabel?: string | null
  templateState: 'missing' | 'valid' | 'invalid'
  hasSubject: boolean
  hasBody: boolean
  recipientState?: 'resolved' | 'backend-resolved' | 'unresolved'
  hasScheduleTime?: boolean
}

function readBackendErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code.trim().toUpperCase() || null
  }

  if (error instanceof Error) {
    const codeMatch = error.message.match(/\b([A-Z_]{3,})\b/)
    return codeMatch?.[1] ?? null
  }

  return null
}

function readBackendErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.trim()
  return typeof error === 'string' ? error.trim() : ''
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

export function getReplyErrorFeedback(error: unknown, context: ReplyErrorContext): string {
  const message = readBackendErrorMessage(error)
  const errorCode = readBackendErrorCode(error)
  const actionLabel = context.action === 'schedule' ? 'scheduled email' : 'reply'

  if (context.sourceEventState === 'invalid') {
    return 'Reply context is invalid. Source event id must be numeric.'
  }

  if (context.sourceEventState === 'missing') {
    return 'This message cannot be replied to because its inbound event reference is missing.'
  }

  if (context.templateState === 'invalid') {
    return 'Selected template id is invalid.'
  }

  if (!context.hasMailbox) {
    return 'Select the mailbox that should send this reply.'
  }

  if (!context.hasSubject) {
    return 'Reply subject cannot be empty.'
  }

  if (!context.hasBody) {
    return 'Reply body cannot be empty.'
  }

  switch (errorCode) {
    case 'INVALID_SOURCE_EVENT_ID':
      return 'The selected inbound email can no longer be used because its source event id is invalid.'
    case 'SOURCE_EVENT_NOT_FOUND':
      return 'The source email for this reply could not be found. Refresh the thread and try again.'
    case 'SOURCE_EVENT_NOT_FOR_TICKET':
      return 'The selected source email no longer belongs to this ticket. Refresh the ticket thread and choose the latest inbound email.'
    case 'INVALID_TEMPLATE_ID':
      return 'The selected template id is invalid. Re-select the template and try again.'
    case 'TEMPLATE_NOT_FOUND':
      return `The selected template${context.templateLabel ? ` (${context.templateLabel})` : ''} could not be found.`
    case 'TEMPLATE_INACTIVE':
      return `The selected template${context.templateLabel ? ` (${context.templateLabel})` : ''} is inactive and cannot be applied.`
    case 'REPLY_TARGET_UNRESOLVABLE':
      return context.action === 'schedule'
        ? 'Recipient resolution failed for this scheduled reply. Open the latest inbound email and try again.'
        : 'Recipient resolution failed for this reply. Refresh the thread and try again.'
    case 'MAILBOX_NOT_FOUND':
      return 'The selected mailbox no longer exists. Re-select a mailbox and try again.'
    case 'MAILBOX_NOT_ACTIVE':
      return 'The selected mailbox is inactive and cannot send email.'
    case 'REPLY_BODY_EMPTY':
      return 'Reply body cannot be empty.'
    case 'SCHEDULE_TIME_INVALID':
      return 'Choose a future schedule time.'
  }

  if (/request body is missing or malformed/i.test(message)) {
    const checks = [
      `mailbox ${context.hasMailbox ? `selected (${context.mailboxLabel ?? 'configured'})` : 'missing'}`,
      `reply source ${context.sourceEventState}`,
      `template ${context.templateState === 'valid' ? (context.templateLabel ?? 'selected') : context.templateState}`,
      `subject ${context.hasSubject ? 'present' : 'missing'}`,
      `body ${context.hasBody ? 'present' : 'missing'}`,
      context.action === 'schedule'
        ? `recipient ${context.recipientState ?? 'backend-resolved'}`
        : null,
      context.action === 'schedule'
        ? `schedule time ${context.hasScheduleTime ? 'present' : 'missing'}`
        : null,
    ].join(', ')

    return `The backend rejected this ${actionLabel} request. Checked: ${checks}.`
  }

  if (/mailbox/i.test(message)) {
    return 'The selected mailbox could not send this email. Re-select an active mailbox and try again.'
  }

  if (/sourceevent|source event|reply context/i.test(message)) {
    return 'This reply no longer has a valid inbound event reference. Refresh the ticket thread and try again.'
  }

  if (/template/i.test(message)) {
    return 'The selected template could not be applied. Re-select the template and try again.'
  }

  if (/recipient|resolve/i.test(message) && context.action === 'schedule') {
    return 'Recipient resolution failed for this scheduled reply. Open the latest inbound email and try again.'
  }

  return message || `The ${actionLabel} could not be completed. Verify the mailbox, reply source email, and content, then try again.`
}