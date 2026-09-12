import { describe, it, expect } from 'vitest'
import {
  normalizeMailbox,
  normalizeMailboxList,
  normalizeCustomerEmailSettings,
  normalizeCustomerEmailRoutingRule,
  normalizeTicketEmailMessage,
  normalizeSendTicketReplyResult,
  normalizeAddressList,
} from '@/services/email-platform.normalizers'
import type {
  MailboxResponse,
  CustomerEmailSettingsResponse,
  CustomerEmailRoutingRuleResponse,
  TicketEmailMessageResponse,
  SendTicketReplyResponse,
} from '@/types/api.types'

describe('email-platform normalizers', () => {
  describe('normalizeMailbox', () => {
    it('maps all required fields from response', () => {
      const response: MailboxResponse = {
        id: 'mb-1',
        name: 'Support',
        address: 'support@example.com',
        displayName: 'Support Team',
        providerType: 'IMAP',
        inboundMode: 'POLLING',
        outboundMode: 'SMTP',
        imapHost: 'imap.example.com',
        imapPort: 993,
        imapUsername: 'support@example.com',
        imapUseSsl: true,
        imapFolder: 'INBOX',
        smtpHost: null,
        smtpPort: null,
        smtpUsername: null,
        smtpUseSsl: null,
        initialSyncStrategy: 'START_FROM_LATEST',
        cursorInitStrategy: 'BACKFILL_ALL',
        lastSeenUid: 42,
        activationState: 'ACTIVE',
        pollingEnabled: true,
        pollIntervalSeconds: 60,
        pollingStatus: 'RUNNING',
        lastPollAt: '2025-01-15T10:00:00Z',
        lastPollError: null,
        isActive: true,
        defaultGroupId: 'grp-1',
        defaultPriority: 'MEDIUM',
        lastSuccessfulInboundAt: '2025-01-15T10:00:00Z',
        lastSuccessfulOutboundAt: null,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      }

      const result = normalizeMailbox(response)

      expect(result.id).toBe('mb-1')
      expect(result.name).toBe('Support')
      expect(result.address).toBe('support@example.com')
      expect(result.displayName).toBe('Support Team')
      expect(result.providerType).toBe('IMAP')
      expect(result.isActive).toBe(true)
      expect(result.defaultGroupId).toBe('grp-1')
      expect(result.pollingStatus).toBe('RUNNING')
      expect(result.initialSyncStrategy).toBe('NEW_MESSAGES_ONLY')
      expect(result.cursorInitStrategy).toBe('SCAN_FROM_START')
      expect(result.lastSeenUid).toBe('42')
      expect(result.activationState).toBe('ACTIVE')
    })

    it('normalizes null optionals to null', () => {
      const response: MailboxResponse = {
        id: 'mb-2',
        name: 'Billing',
        address: 'billing@example.com',
        displayName: null,
        providerType: 'IMAP',
        inboundMode: 'POLLING',
        outboundMode: 'SMTP',
        imapHost: 'imap.example.com',
        imapPort: 993,
        imapUsername: 'billing@example.com',
        imapUseSsl: true,
        imapFolder: 'INBOX',
        smtpHost: null,
        smtpPort: null,
        smtpUsername: null,
        smtpUseSsl: null,
        initialSyncStrategy: null,
        pollingEnabled: false,
        pollIntervalSeconds: 120,
        pollingStatus: 'IDLE',
        lastPollAt: null,
        lastPollError: null,
        isActive: false,
        defaultGroupId: null,
        defaultPriority: null,
        lastSuccessfulInboundAt: null,
        lastSuccessfulOutboundAt: null,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
      }

      const result = normalizeMailbox(response)

      expect(result.displayName).toBeNull()
      expect(result.defaultGroupId).toBeNull()
      expect(result.defaultPriority).toBeNull()
      expect(result.lastPollAt).toBeNull()
    })

    it('does not invent a polling status when the backend omits it', () => {
      const result = normalizeMailbox({
        id: 'mb-3',
        name: 'No Status',
        address: 'nostatus@example.com',
        displayName: null,
        providerType: 'IMAP',
        inboundMode: 'POLLING',
        outboundMode: 'SMTP',
        imapHost: 'imap.example.com',
        imapPort: 993,
        imapUsername: 'nostatus@example.com',
        imapUseSsl: true,
        imapFolder: 'INBOX',
        smtpHost: null,
        smtpPort: null,
        smtpUsername: null,
        smtpUseSsl: null,
        initialSyncStrategy: null,
        pollingEnabled: false,
        pollIntervalSeconds: 60,
        lastPollAt: null,
        lastPollError: 'Connection timeout',
        isActive: false,
        defaultGroupId: null,
        defaultPriority: null,
        lastSuccessfulInboundAt: null,
        lastSuccessfulOutboundAt: null,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
      })

      expect(result.pollingStatus).toBeNull()
      expect(result.lastPollError).toBe('Connection timeout')
    })
  })

  describe('normalizeMailboxList', () => {
    it('handles paginated response', () => {
      const response = {
        items: [
          {
            id: 'mb-1', name: 'A', address: 'a@test.com', displayName: null,
            providerType: 'IMAP' as const, inboundMode: 'POLLING' as const, outboundMode: 'SMTP' as const,
            imapHost: 'imap.test.com', imapPort: 993, imapUsername: 'a@test.com', imapUseSsl: true, imapFolder: 'INBOX',
            smtpHost: null, smtpPort: null, smtpUsername: null, smtpUseSsl: null, initialSyncStrategy: 'START_FROM_LATEST' as const,
            pollingEnabled: true, pollIntervalSeconds: 60,
            pollingStatus: 'IDLE' as const, lastPollAt: null, lastPollError: null,
            isActive: true,
            defaultGroupId: null, defaultPriority: null,
            lastSuccessfulInboundAt: null, lastSuccessfulOutboundAt: null,
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
          id: 'mb-1', name: 'A', address: 'a@test.com', displayName: null,
          providerType: 'IMAP', inboundMode: 'POLLING', outboundMode: 'SMTP',
          imapHost: 'imap.test.com', imapPort: 993, imapUsername: 'a@test.com', imapUseSsl: true, imapFolder: 'INBOX',
          smtpHost: null, smtpPort: null, smtpUsername: null, smtpUseSsl: null, initialSyncStrategy: 'START_FROM_LATEST',
          pollingEnabled: true, pollIntervalSeconds: 60,
          pollingStatus: 'IDLE', lastPollAt: null, lastPollError: null,
          isActive: true,
          defaultGroupId: null, defaultPriority: null,
          lastSuccessfulInboundAt: null, lastSuccessfulOutboundAt: null,
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
        isEnabled: true,
        allowSubdomains: true,
        unknownSenderPolicy: 'QUARANTINE',
        defaultGroupId: 'grp-1',
        defaultGroupName: 'Tier 1',
        defaultPriority: 'HIGH',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const result = normalizeCustomerEmailSettings(response)

      expect(result.customerId).toBe('cust-1')
      expect(result.customerName).toBe('Acme Corp')
      expect(result.isEnabled).toBe(true)
      expect(result.allowSubdomains).toBe(true)
      expect(result.unknownSenderPolicy).toBe('QUARANTINE')
    })
  })

  describe('normalizeCustomerEmailRoutingRule', () => {
    it('maps all fields', () => {
      const response: CustomerEmailRoutingRuleResponse = {
        id: 'rule-1',
        customerId: 'cust-1',
        senderMatchType: 'EXACT_EMAIL',
        senderMatchValue: 'vip@acme.com',
        recipientMailboxId: 'mb-1',
        recipientMailboxName: 'VIP',
        priority: 10,
        isActive: true,
        notes: 'High priority VIP rule',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const result = normalizeCustomerEmailRoutingRule(response)

      expect(result.id).toBe('rule-1')
      expect(result.senderMatchType).toBe('EXACT_EMAIL')
      expect(result.senderMatchValue).toBe('vip@acme.com')
      expect(result.recipientMailboxId).toBe('mb-1')
      expect(result.priority).toBe(10)
      expect(result.isActive).toBe(true)
      expect(result.notes).toBe('High priority VIP rule')
    })

    it('maps routing rule aliases and optional subdomain support', () => {
      const response: CustomerEmailRoutingRuleResponse = {
        id: 'rule-2',
        customerId: 'cust-1',
        recipientMailboxId: null,
        recipientMailboxName: null,
        ruleType: 'DOMAIN',
        pattern: '@acme.com',
        priority: null,
        active: false,
        allowSubdomains: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const result = normalizeCustomerEmailRoutingRule(response)

      expect(result.senderMatchType).toBe('DOMAIN_SUFFIX')
      expect(result.senderMatchValue).toBe('@acme.com')
      expect(result.priority).toBe(0)
      expect(result.isActive).toBe(false)
      expect(result.allowSubdomains).toBe(true)
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
        sourceEventId: 101,
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
          {
            id: 'att-1',
            fileName: 'screenshot.png',
            contentType: 'image/png',
            size: 45000,
            previewSupported: true,
            previewUrl: '/api/attachments/att-1/preview',
            openUrl: '/api/attachments/att-1/open',
            downloadUrl: '/api/attachments/att-1',
          },
        ],
      }

      const result = normalizeTicketEmailMessage(response)

      expect(result.id).toBe('email-1')
      expect(result.direction).toBe('INBOUND')
      expect(result.from).toBe('customer@test.com')
      expect(result.bodyHtml).toBe('<p>Help me</p>')
      expect(result.attachments).toHaveLength(1)
      expect(result.attachments[0].fileName).toBe('screenshot.png')
      expect(result.attachments[0].previewSupported).toBe(true)
      expect(result.attachments[0].previewUrl).toBe('/api/attachments/att-1/preview')
      expect(result.attachments[0].openUrl).toBe('/api/attachments/att-1/open')
      expect(result.attachments[0].downloadUrl).toBe('/api/attachments/att-1')
      expect(result.sourceEventId).toBe(101)

    })

    it('does not map email document ids into sourceEventId', () => {
      const response: TicketEmailMessageResponse = {
        id: '69d8325094ebbe5f95845795',
        emailDocumentId: '69d8325094ebbe5f95845795',
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
        attachments: [],
      }

      const result = normalizeTicketEmailMessage(response)

      expect(result.emailDocumentId).toBe('69d8325094ebbe5f95845795')
      expect(result.sourceEventId).toBeNull()
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

  // -------------------------------------------------------------------------
  // normalizeAddressList — regression suite for the "to.join is not a function" crash
  // -------------------------------------------------------------------------
  describe('normalizeAddressList', () => {
    it('returns [] for null', () => {
      expect(normalizeAddressList(null)).toEqual([])
    })

    it('returns [] for undefined', () => {
      expect(normalizeAddressList(undefined)).toEqual([])
    })

    it('returns [] for empty string', () => {
      expect(normalizeAddressList('')).toEqual([])
    })

    it('wraps a plain string into a single-element array', () => {
      expect(normalizeAddressList('user@example.com')).toEqual(['user@example.com'])
    })

    it('passes through a string array unchanged', () => {
      expect(normalizeAddressList(['a@b.com', 'c@d.com'])).toEqual(['a@b.com', 'c@d.com'])
    })

    it('extracts address from an object with an address field', () => {
      expect(normalizeAddressList({ address: 'obj@example.com', name: 'Test' })).toEqual(['obj@example.com'])
    })

    it('extracts address from an object with an email field', () => {
      expect(normalizeAddressList({ email: 'obj@example.com' })).toEqual(['obj@example.com'])
    })

    it('filters nulls and empties from a mixed array', () => {
      expect(normalizeAddressList([null, '', 'valid@example.com', undefined])).toEqual(['valid@example.com'])
    })

    it('flattens arrays of objects', () => {
      expect(normalizeAddressList([{ address: 'a@b.com' }, { address: 'c@d.com' }])).toEqual(['a@b.com', 'c@d.com'])
    })
  })

  // -------------------------------------------------------------------------
  // normalizeTicketEmailMessage — address coercion paths
  // -------------------------------------------------------------------------
  describe('normalizeTicketEmailMessage — address coercion', () => {
    const baseMsg = {
      id: 'e1',
      ticketId: 't1',
      threadKey: null,
      messageId: '<m1>',
      providerMessageId: null,
      mailboxId: null,
      mailboxName: null,
      direction: 'OUTBOUND' as const,
      subject: 'Reply',
      from: 'agent@support.com',
      bodyText: 'body',
      bodyHtml: null,
      bodyPreview: null,
      sentAt: '2026-04-16T10:00:00Z',
      receivedAt: null,
      dispatchStatus: 'DELIVERED' as const,
      attachments: [] as never[],
    }

    it('accepts a string "to" value (backend omits array wrapping)', () => {
      const result = normalizeTicketEmailMessage({ ...baseMsg, to: 'customer@test.com' as unknown as string[], cc: [], bcc: [] })
      expect(result.to).toEqual(['customer@test.com'])
    })

    it('accepts a string[] "to" value as-is', () => {
      const result = normalizeTicketEmailMessage({ ...baseMsg, to: ['a@b.com', 'b@c.com'], cc: [], bcc: [] })
      expect(result.to).toEqual(['a@b.com', 'b@c.com'])
    })

    it('accepts an object "to" value with address property', () => {
      const result = normalizeTicketEmailMessage({ ...baseMsg, to: { address: 'customer@test.com', name: 'Customer' } as unknown as string[], cc: [], bcc: [] })
      expect(result.to).toEqual(['customer@test.com'])
    })

    it('normalizes null/undefined "to" to []', () => {
      const result = normalizeTicketEmailMessage({ ...baseMsg, to: null as unknown as string[], cc: [], bcc: [] })
      expect(result.to).toEqual([])
    })

    it('normalizes null cc and bcc to []', () => {
      const result = normalizeTicketEmailMessage({ ...baseMsg, to: [], cc: null as unknown as string[], bcc: null as unknown as string[] })
      expect(result.cc).toEqual([])
      expect(result.bcc).toEqual([])
    })
  })
})
