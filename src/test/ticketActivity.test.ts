import { describe, expect, it } from 'vitest'
import { buildTicketActivityItems } from '@/lib/ticketActivity'

const baseTicket = {
  id: 't1',
  publicId: 'ticket-public-1',
  ticketNo: 'TK-1',
  subject: 'Issue',
  customerId: 'c1',
  customerName: 'Acme',
  groupId: 'g1',
  groupName: 'Support',
  assignedUserId: null,
  assignedUserName: null,
  status: 'ASSIGNED',
  priority: 'medium',
  sourceType: 'email',
  isUnread: false,
  isTransferred: false,
  transferredFromGroup: null,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
  lastActionAt: '2026-04-01T00:00:00Z',
  lastActionSummary: 'Updated',
  openDurationMinutes: 10,
  slaDeadlineAt: null,
  slaBreached: false,
  messageCount: 0,
  internalNoteCount: 0,
  tags: [],
  attachments: [],
}

describe('buildTicketActivityItems', () => {
  it('renders Jira and scheduled-email Phase 2 events from metadataJson', () => {
    const activities = buildTicketActivityItems({
      ticket: baseTicket as any,
      messages: [
        {
          id: 'n1',
          ticketId: 't1',
          type: 'system_event',
          authorId: null,
          authorName: 'CaseFlow',
          content: 'Background job updated',
          createdAt: '2026-04-01T01:00:00Z',
          attachments: [],
          eventType: 'JIRA_ISSUE_CREATED',
          metadataJson: JSON.stringify({ jiraIssueKey: 'TEST-42', jiraUrl: 'https://jira.example.com/browse/TEST-42' }),
        },
        {
          id: 'n2',
          ticketId: 't1',
          type: 'system_event',
          authorId: null,
          authorName: 'CaseFlow',
          content: 'Scheduled send stored',
          createdAt: '2026-04-01T02:00:00Z',
          attachments: [],
          eventType: 'SCHEDULED_EMAIL_CREATED',
          metadataJson: JSON.stringify({ toAddress: 'customer@example.com', sendNotBefore: '2026-04-10T09:00:00Z' }),
        },
      ],
      transfers: [],
      emailThread: [],
    })

    expect(activities.find((item) => item.kind === 'jira_created')).toMatchObject({
      summary: 'Jira issue created: TEST-42',
      linkUrl: 'https://jira.example.com/browse/TEST-42',
    })
    expect(activities.find((item) => item.kind === 'scheduled_email_created')?.detail).toContain('customer@example.com')
  })

  it('does not crash on malformed metadataJson and falls back safely', () => {
    const activities = buildTicketActivityItems({
      ticket: baseTicket as any,
      messages: [
        {
          id: 'n1',
          ticketId: 't1',
          type: 'system_event',
          authorId: null,
          authorName: 'CaseFlow',
          content: 'Notification failed',
          createdAt: '2026-04-01T01:00:00Z',
          attachments: [],
          eventType: 'EXTERNAL_NOTIFICATION_FAILED',
          metadataJson: '{bad json',
        },
      ],
      transfers: [],
      emailThread: [],
    })

    expect(activities.find((item) => item.kind === 'notification_failed')).toMatchObject({
      summary: 'External notification failed.',
      detail: 'Notification failed',
    })
  })
})