import type { TicketActivityItem, TicketMessage, TransferRecord, Ticket } from '@/types/ticket.types'
import type { TicketEmailMessage } from '@/types/email.types'

function classifySystemEvent(content: string): TicketActivityItem['kind'] {
  const value = content.toLowerCase()

  if (value.includes('template') || value.includes('şablon')) return 'template_used'
  if (value.includes('assign') || value.includes('atandı')) return 'assigned'
  if (value.includes('status') || value.includes('durum')) return 'status_changed'
  return 'system'
}

function buildReplySummary(email: TicketEmailMessage): Pick<TicketActivityItem, 'kind' | 'summary'> {
  switch (email.dispatchStatus) {
    case 'QUEUED':
      return { kind: 'reply_queued', summary: 'Reply queued for outbound delivery.' }
    case 'PROCESSING':
    case 'SENDING':
      return { kind: 'reply_sending', summary: 'Reply is being sent.' }
    case 'SENT':
    case 'DISPATCHED':
    case 'DELIVERED':
      return { kind: 'reply_sent', summary: 'Reply sent successfully.' }
    case 'FAILED':
    case 'PERMANENTLY_FAILED':
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
    items.push({
      id: `transfer-${transfer.id}`,
      kind: 'transferred',
      actor: transfer.transferredByName || null,
      timestamp: transfer.createdAt,
      summary: `Transferred from ${transfer.fromGroupName} to ${transfer.toGroupName}.`,
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
      detail: email.subject,
    })
  }

  return items.sort((left, right) => right.timestamp.localeCompare(left.timestamp))
}