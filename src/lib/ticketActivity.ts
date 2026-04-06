import type { TicketActivityItem, TicketMessage, TransferRecord, Ticket } from '@/types/ticket.types'
import type { TicketEmailMessage } from '@/types/email.types'
import { getDispatchStatusMeta } from './ticketEmailUi'

function parseMetadataJson(metadataJson: string | null | undefined): Record<string, unknown> | null {
  if (!metadataJson) return null

  try {
    const parsed = JSON.parse(metadataJson) as unknown
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}

function readMetadataString(metadata: Record<string, unknown> | null, keys: string[]): string | null {
  if (!metadata) return null

  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function buildPhase2SystemActivity(message: TicketMessage): TicketActivityItem | null {
  const eventType = message.eventType ?? null
  if (!eventType) return null

  const metadata = parseMetadataJson(message.metadataJson)
  const issueKey = readMetadataString(metadata, ['jiraIssueKey', 'issueKey'])
  const issueUrl = readMetadataString(metadata, ['jiraUrl', 'issueUrl'])
  const reason = readMetadataString(metadata, ['reason', 'lastError', 'error'])
  const channelType = readMetadataString(metadata, ['channelType'])
  const channelName = readMetadataString(metadata, ['channelName', 'name'])
  const notificationEvent = readMetadataString(metadata, ['eventType', 'notificationEventType'])
  const toAddress = readMetadataString(metadata, ['toAddress'])
  const sendNotBefore = readMetadataString(metadata, ['sendNotBefore'])

  switch (eventType) {
    case 'JIRA_ISSUE_CREATE_REQUESTED':
      return {
        id: `system-${message.id}`,
        kind: 'jira_requested',
        actor: message.authorName || null,
        timestamp: message.createdAt,
        summary: 'Jira issue creation requested.',
        detail: message.content || null,
      }
    case 'JIRA_ISSUE_CREATED':
      return {
        id: `system-${message.id}`,
        kind: 'jira_created',
        actor: message.authorName || null,
        timestamp: message.createdAt,
        summary: issueKey ? `Jira issue created: ${issueKey}` : 'Jira issue created.',
        detail: message.content || null,
        linkLabel: issueKey ? `Open ${issueKey}` : 'Open Jira issue',
        linkUrl: issueUrl,
      }
    case 'JIRA_ISSUE_CREATE_FAILED':
      return {
        id: `system-${message.id}`,
        kind: 'jira_failed',
        actor: message.authorName || null,
        timestamp: message.createdAt,
        summary: 'Jira issue creation failed.',
        detail: reason ?? message.content ?? null,
      }
    case 'EXTERNAL_NOTIFICATION_SENT':
      return {
        id: `system-${message.id}`,
        kind: 'notification_sent',
        actor: message.authorName || null,
        timestamp: message.createdAt,
        summary: channelType ? `${channelType} notification sent.` : 'External notification sent.',
        detail: [channelName, notificationEvent].filter(Boolean).join(' · ') || message.content || null,
      }
    case 'EXTERNAL_NOTIFICATION_FAILED':
      return {
        id: `system-${message.id}`,
        kind: 'notification_failed',
        actor: message.authorName || null,
        timestamp: message.createdAt,
        summary: channelType ? `${channelType} notification failed.` : 'External notification failed.',
        detail: [channelName, notificationEvent, reason ?? message.content].filter(Boolean).join(' · ') || null,
      }
    case 'SCHEDULED_EMAIL_CREATED':
      return {
        id: `system-${message.id}`,
        kind: 'scheduled_email_created',
        actor: message.authorName || null,
        timestamp: message.createdAt,
        summary: 'Scheduled email created.',
        detail: [toAddress ? `To ${toAddress}` : null, sendNotBefore ? `Send not before ${sendNotBefore}` : null].filter(Boolean).join(' · ') || message.content || null,
      }
    case 'SCHEDULED_EMAIL_CANCELED':
      return {
        id: `system-${message.id}`,
        kind: 'scheduled_email_canceled',
        actor: message.authorName || null,
        timestamp: message.createdAt,
        summary: 'Scheduled email canceled.',
        detail: message.content || null,
      }
    case 'SCHEDULED_EMAIL_FAILED':
      return {
        id: `system-${message.id}`,
        kind: 'scheduled_email_failed',
        actor: message.authorName || null,
        timestamp: message.createdAt,
        summary: 'Scheduled email failed/blocked.',
        detail: reason ?? message.content ?? null,
      }
    default:
      return null
  }
}

function classifySystemEvent(content: string): TicketActivityItem['kind'] {
  const value = content.toLowerCase()

  if (value.includes('template') || value.includes('şablon')) return 'template_used'
  if (value.includes('assign') || value.includes('atandı')) return 'assigned'
  if (value.includes('priority') || value.includes('öncelik')) return 'priority_changed'
  if (value.includes('status') || value.includes('durum')) return 'status_changed'
  return 'system'
}

function buildReplySummary(email: TicketEmailMessage): Pick<TicketActivityItem, 'kind' | 'summary'> {
  const status = getDispatchStatusMeta(email.dispatchStatus)

  switch (status?.label) {
    case 'Queued':
      return { kind: 'reply_queued', summary: 'Reply queued for outbound delivery.' }
    case 'Sending':
    case 'Dispatched':
      return { kind: 'reply_sending', summary: 'Reply is being sent.' }
    case 'Sent':
    case 'Delivered':
      return { kind: 'reply_sent', summary: 'Reply sent successfully.' }
    case 'Failed':
      return { kind: 'reply_failed', summary: 'Reply failed to send.' }
    default:
      return { kind: 'system', summary: 'Reply activity updated.' }
  }
}

export function buildTicketActivityItems(params: {
  ticket: Ticket
  messages: TicketMessage[]
  transfers: TransferRecord[]
  emailThread: TicketEmailMessage[]
}): TicketActivityItem[] {
  const { ticket, messages, transfers, emailThread } = params

  const items: TicketActivityItem[] = [
    {
      id: `ticket-created-${ticket.id}`,
      kind: 'created',
      actor: ticket.customerName || null,
      timestamp: ticket.createdAt,
      summary: `Ticket ${ticket.ticketNo} created.`,
      detail: ticket.subject,
    },
  ]

  for (const transfer of transfers) {
    const hasNamedGroups = Boolean(transfer.fromGroupName || transfer.toGroupName)
    items.push({
      id: `transfer-${transfer.id}`,
      kind: 'transferred',
      actor: transfer.transferredByName || null,
      timestamp: transfer.createdAt,
      summary: hasNamedGroups
        ? `Transferred from ${transfer.fromGroupName || 'previous group'} to ${transfer.toGroupName || 'new group'}.`
        : 'Transferred between groups.',
      detail: transfer.reason || transfer.note,
    })
  }

  for (const message of messages) {
    if (message.type === 'internal_note') {
      items.push({
        id: `note-${message.id}`,
        kind: 'note_added',
        actor: message.authorName || null,
        timestamp: message.createdAt,
        summary: 'Internal note added.',
        detail: message.content,
      })
      continue
    }

    if (message.type === 'system_event') {
      const phase2Activity = buildPhase2SystemActivity(message)
      if (phase2Activity) {
        items.push(phase2Activity)
        continue
      }

      items.push({
        id: `system-${message.id}`,
        kind: classifySystemEvent(message.content),
        actor: message.authorName || null,
        timestamp: message.createdAt,
        summary: message.content,
        detail: null,
      })
    }
  }

  for (const email of emailThread) {
    const timestamp = email.receivedAt ?? email.sentAt
    if (!timestamp) continue

    if (email.direction === 'INBOUND') {
      items.push({
        id: `email-inbound-${email.id}`,
        kind: 'customer_reply',
        actor: email.from || null,
        timestamp,
        summary: 'Customer email received.',
        detail: email.subject,
      })
      continue
    }

    const reply = buildReplySummary(email)
    items.push({
      id: `email-outbound-${email.id}`,
      kind: reply.kind,
      actor: email.from || email.mailboxName || null,
      timestamp,
      summary: reply.summary,
        detail: email.failureReason ?? email.subject,
    })
  }

  return items.sort((left, right) => right.timestamp.localeCompare(left.timestamp))
}