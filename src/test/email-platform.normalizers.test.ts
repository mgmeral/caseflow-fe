import { describe, it, expect } from 'vitest'
import {
  normalizeMailbox,
  normalizeMailboxList,
  normalizeCustomerEmailSettings,
  normalizeCustomerEmailRoutingRule,
  normalizeIngressEvent,
  normalizeIngressEventList,
  normalizeIngressEventDetail,
  normalizeTicketEmailMessage,
  normalizeSendTicketReplyResult,
} from '@/services/email-platform.normalizers'
import type {
  MailboxResponse,
  CustomerEmailSettingsResponse,
  CustomerEmailRoutingRuleResponse,
  IngressEventResponse,
  IngressEventDetailResponse,
  TicketEmailMessageResponse,
  SendTicketReplyResponse,
} from '@/types/api.types'

describe('email-platform normalizers', () => {
  describe('normalizeMailbox', () => {
    it('maps all required fields from response', () => {
      const response: MailboxResponse = {
        id: 'mb-1',
        name: 'Support',
        emailAddress: 'support@example.com',
        displayName: 'Support Team',
        providerType: 'SMTP',
        inboundMode: 'POLLING',
        outboundMode: 'DIRECT',
        isActive: true,
        inboundEnabled: true,
        outboundEnabled: true,
        defaultGroupId: 'grp-1',
        defaultGroupName: 'Tier 1',
        defaultPriority: 'MEDIUM',
        defaultStatus: 'OPEN',
        unknownSenderPolicy: 'CREATE_CONTACT',
        lastInboundSuccessAt: '2025-01-15T10:00:00Z',
        lastOutboundSuccessAt: null,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      }

      const result = normalizeMailbox(response)

      expect(result.id).toBe('mb-1')
      expect(result.name).toBe('Support')
      expect(result.emailAddress).toBe('support@example.com')
      expect(result.displayName).toBe('Support Team')
      expect(result.providerType).toBe('SMTP')
      expect(result.isActive).toBe(true)
      expect(result.defaultGroupId).toBe('grp-1')
      expect(result.unknownSenderPolicy).toBe('CREATE_CONTACT')
      expect(result.lastOutboundSuccessAt).toBeNull()
    })

    it('normalizes null optionals to null', () => {
      const response: MailboxResponse = {
        id: 'mb-2',
        name: 'Billing',
        emailAddress: 'billing@example.com',
        displayName: null,
        providerType: 'GRAPH_API',
        inboundMode: 'WEBHOOK',
        outboundMode: 'QUEUED',
        isActive: false,
        inboundEnabled: false,
        outboundEnabled: false,
        defaultGroupId: null,
        defaultGroupName: null,
        defaultPriority: null,
        defaultStatus: null,
        unknownSenderPolicy: 'REJECT',
        lastInboundSuccessAt: null,
        lastOutboundSuccessAt: null,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
      }

      const result = normalizeMailbox(response)

      expect(result.displayName).toBeNull()
      expect(result.defaultGroupId).toBeNull()
      expect(result.defaultGroupName).toBeNull()
      expect(result.defaultPriority).toBeNull()
      expect(result.lastInboundSuccessAt).toBeNull()
    })
  })

  describe('normalizeMailboxList', () => {
    it('handles paginated response', () => {
      const response = {
        items: [
          {
            id: 'mb-1', name: 'A', emailAddress: 'a@test.com', displayName: null,
            providerType: 'SMTP' as const, inboundMode: 'POLLING' as const, outboundMode: 'DIRECT' as const,
            isActive: true, inboundEnabled: true, outboundEnabled: true,
            defaultGroupId: null, defaultGroupName: null, defaultPriority: null, defaultStatus: null,
            unknownSenderPolicy: 'REJECT' as const,
            lastInboundSuccessAt: null, lastOutboundSuccessAt: null,
            createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        page: 2,
        size: 10,
        totalElements: 25,
        totalPages: 3,
      }

      const result = normalizeMailboxList(response)

      expect(result.page).toBe(2)
      expect(result.size).toBe(10)
      expect(result.total).toBe(25)
      expect(result.totalPages).toBe(3)
      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('mb-1')
    })

    it('handles plain array response', () => {
      const response: MailboxResponse[] = [
        {
          id: 'mb-1', name: 'A', emailAddress: 'a@test.com', displayName: null,
          providerType: 'SMTP', inboundMode: 'POLLING', outboundMode: 'DIRECT',
          isActive: true, inboundEnabled: true, outboundEnabled: true,
          defaultGroupId: null, defaultGroupName: null, defaultPriority: null, defaultStatus: null,
          unknownSenderPolicy: 'REJECT',
          lastInboundSuccessAt: null, lastOutboundSuccessAt: null,
          createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      const result = normalizeMailboxList(response)

      expect(result.page).toBe(0)
      expect(result.size).toBe(1)
      expect(result.total).toBe(1)
      expect(result.totalPages).toBe(1)
    })

    it('handles empty array', () => {
      const result = normalizeMailboxList([])
      expect(result.items).toHaveLength(0)
      expect(result.totalPages).toBe(0)
    })
  })

  describe('normalizeCustomerEmailSettings', () => {
    it('maps all fields', () => {
      const response: CustomerEmailSettingsResponse = {
        customerId: 'cust-1',
        customerName: 'Acme Corp',
        mailboxId: 'mb-1',
        mailboxName: 'Support',
        trustedContactsOnly: true,
        autoCreateContact: false,
        allowSubdomains: true,
        unknownSenderPolicy: 'QUARANTINE',
        defaultGroupId: 'grp-1',
        defaultGroupName: 'Tier 1',
        defaultPriority: 'HIGH',
        defaultStatus: 'OPEN',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const result = normalizeCustomerEmailSettings(response)

      expect(result.customerId).toBe('cust-1')
      expect(result.customerName).toBe('Acme Corp')
      expect(result.trustedContactsOnly).toBe(true)
      expect(result.autoCreateContact).toBe(false)
      expect(result.unknownSenderPolicy).toBe('QUARANTINE')
    })
  })

  describe('normalizeCustomerEmailRoutingRule', () => {
    it('maps all fields', () => {
      const response: CustomerEmailRoutingRuleResponse = {
        id: 'rule-1',
        customerId: 'cust-1',
        matchType: 'EXACT_EMAIL',
        matchValue: 'vip@acme.com',
        mailboxId: 'mb-1',
        mailboxName: 'VIP',
        groupId: 'grp-2',
        groupName: 'VIP Team',
        priority: 'CRITICAL',
        status: 'OPEN',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const result = normalizeCustomerEmailRoutingRule(response)

      expect(result.id).toBe('rule-1')
      expect(result.matchType).toBe('EXACT_EMAIL')
      expect(result.matchValue).toBe('vip@acme.com')
      expect(result.isActive).toBe(true)
    })
  })

  describe('normalizeIngressEvent', () => {
    it('maps core fields', () => {
      const response: IngressEventResponse = {
        id: 'ing-1',
        mailboxId: 'mb-1',
        mailboxName: 'Support',
        mailboxAddress: 'support@test.com',
        providerType: 'SMTP',
        messageId: '<msg-123@mail.com>',
        subject: 'Help needed',
        sender: 'user@test.com',
        status: 'ROUTED',
        receivedAt: '2025-01-10T08:00:00Z',
        processedAt: '2025-01-10T08:00:05Z',
        lastErrorSummary: null,
      }

      const result = normalizeIngressEvent(response)

      expect(result.id).toBe('ing-1')
      expect(result.status).toBe('ROUTED')
      expect(result.sender).toBe('user@test.com')
      expect(result.lastErrorSummary).toBeNull()
    })
  })

  describe('normalizeIngressEventDetail', () => {
    it('includes detail fields beyond base event', () => {
      const response: IngressEventDetailResponse = {
        id: 'ing-2',
        mailboxId: 'mb-1',
        mailboxName: 'Support',
        mailboxAddress: 'support@test.com',
        providerType: 'SMTP',
        messageId: '<msg-456@mail.com>',
        subject: 'Urgent',
        sender: 'boss@test.com',
        status: 'QUARANTINED',
        receivedAt: '2025-01-11T09:00:00Z',
        processedAt: null,
        lastErrorSummary: 'Spam detected',
        recipients: ['support@test.com'],
        cc: ['admin@test.com'],
        rawHeaders: { 'X-Spam-Score': '9.5' },
        payloadExcerpt: 'Buy now...',
        quarantineReason: 'High spam score',
        quarantinedAt: '2025-01-11T09:00:01Z',
        replayedAt: null,
        relatedTicketId: null,
      }

      const result = normalizeIngressEventDetail(response)

      expect(result.status).toBe('QUARANTINED')
      expect(result.recipients).toEqual(['support@test.com'])
      expect(result.cc).toEqual(['admin@test.com'])
      expect(result.rawHeaders).toEqual({ 'X-Spam-Score': '9.5' })
      expect(result.quarantineReason).toBe('High spam score')
      expect(result.replayedAt).toBeNull()
      expect(result.relatedTicketId).toBeNull()
    })
  })

  describe('normalizeTicketEmailMessage', () => {
    it('maps inbound message with attachments', () => {
      const response: TicketEmailMessageResponse = {
        id: 'email-1',
        ticketId: 'tkt-1',
        threadKey: 'thread-abc',
        messageId: '<msg@mail.com>',
        providerMessageId: 'prov-123',
        mailboxId: 'mb-1',
        mailboxName: 'Support',
        direction: 'INBOUND',
        subject: 'Issue report',
        from: 'customer@test.com',
        to: ['support@test.com'],
        cc: [],
        bcc: [],
        bodyText: 'Help me',
        bodyHtml: '<p>Help me</p>',
        bodyPreview: 'Help me',
        sentAt: null,
        receivedAt: '2025-01-12T10:00:00Z',
        dispatchStatus: null,
        attachments: [
          { id: 'att-1', fileName: 'screenshot.png', contentType: 'image/png', size: 45000, downloadUrl: '/api/attachments/att-1' },
        ],
      }

      const result = normalizeTicketEmailMessage(response)

      expect(result.id).toBe('email-1')
      expect(result.direction).toBe('INBOUND')
      expect(result.from).toBe('customer@test.com')
      expect(result.bodyHtml).toBe('<p>Help me</p>')
      expect(result.attachments).toHaveLength(1)
      expect(result.attachments[0].fileName).toBe('screenshot.png')
      expect(result.attachments[0].downloadUrl).toBe('/api/attachments/att-1')
    })

    it('maps outbound message with dispatch status', () => {
      const response: TicketEmailMessageResponse = {
        id: 'email-2',
        ticketId: 'tkt-1',
        threadKey: 'thread-abc',
        messageId: '<reply@caseflow.com>',
        providerMessageId: null,
        mailboxId: 'mb-1',
        mailboxName: 'Support',
        direction: 'OUTBOUND',
        subject: 'Re: Issue report',
        from: 'support@test.com',
        to: ['customer@test.com'],
        cc: [],
        bcc: [],
        bodyText: 'We are looking into it',
        bodyHtml: null,
        bodyPreview: 'We are looking into it',
        sentAt: '2025-01-12T11:00:00Z',
        receivedAt: null,
        dispatchStatus: 'DELIVERED',
        attachments: [],
      }

      const result = normalizeTicketEmailMessage(response)

      expect(result.direction).toBe('OUTBOUND')
      expect(result.dispatchStatus).toBe('DELIVERED')
      expect(result.sentAt).toBe('2025-01-12T11:00:00Z')
      expect(result.receivedAt).toBeNull()
      expect(result.attachments).toHaveLength(0)
    })

    it('defaults null arrays to empty', () => {
      const response: TicketEmailMessageResponse = {
        id: 'email-3',
        ticketId: 'tkt-1',
        threadKey: null,
        messageId: '<m@test>',
        providerMessageId: null,
        mailboxId: null,
        mailboxName: null,
        direction: 'INBOUND',
        subject: null,
        from: null,
        to: null as unknown as string[],
        cc: null as unknown as string[],
        bcc: null as unknown as string[],
        bodyText: null,
        bodyHtml: null,
        bodyPreview: null,
        sentAt: null,
        receivedAt: null,
        dispatchStatus: null,
        attachments: null as unknown as [],
      }

      const result = normalizeTicketEmailMessage(response)

      expect(result.to).toEqual([])
      expect(result.cc).toEqual([])
      expect(result.bcc).toEqual([])
      expect(result.attachments).toEqual([])
      expect(result.subject).toBeNull()
      expect(result.bodyHtml).toBeNull()
    })
  })

  describe('normalizeSendTicketReplyResult', () => {
    it('maps reply result', () => {
      const response: SendTicketReplyResponse = {
        requestId: 'req-1',
        ticketId: 'tkt-1',
        outboundEmailId: 'out-1',
        mailboxId: 'mb-1',
        status: 'QUEUED',
        acceptedAt: '2025-01-12T12:00:00Z',
        message: 'Accepted',
      }

      const result = normalizeSendTicketReplyResult(response)

      expect(result.requestId).toBe('req-1')
      expect(result.ticketId).toBe('tkt-1')
      expect(result.outboundEmailId).toBe('out-1')
      expect(result.status).toBe('QUEUED')
      expect(result.message).toBe('Accepted')
    })

    it('maps null optionals', () => {
      const response: SendTicketReplyResponse = {
        requestId: 'req-2',
        ticketId: 'tkt-2',
        outboundEmailId: null,
        mailboxId: null,
        status: 'PROCESSING',
        acceptedAt: null,
        message: null,
      }

      const result = normalizeSendTicketReplyResult(response)

      expect(result.outboundEmailId).toBeNull()
      expect(result.mailboxId).toBeNull()
      expect(result.acceptedAt).toBeNull()
      expect(result.message).toBeNull()
    })
  })
})
