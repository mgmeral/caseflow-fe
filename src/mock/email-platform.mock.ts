import type {
  CustomerEmailRoutingRuleResponse,
  CustomerEmailSettingsResponse,
  IngressEventDetailResponse,
  IngressEventResponse,
  MailboxResponse,
  SendTicketReplyResponse,
  TicketEmailMessageResponse,
} from '@/types/api.types'
import { mockCustomers } from './customers.mock'
import { mockMessages } from './messages.mock'
import { mockTickets } from './tickets.mock'

const now = Date.now()
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString()

export const mockMailboxes: MailboxResponse[] = [
  {
    id: 'mbx-ops',
    name: 'Operations Support',
    emailAddress: 'ops@caseflow.example',
    displayName: 'CaseFlow Operations',
    providerType: 'MICROSOFT_365',
    inboundMode: 'PUSH',
    outboundMode: 'API',
    isActive: true,
    inboundEnabled: true,
    outboundEnabled: true,
    defaultGroupId: 'g-ops',
    defaultGroupName: 'Operations',
    defaultPriority: 'medium',
    defaultStatus: 'open',
    unknownSenderPolicy: 'ROUTE_TO_DEFAULT',
    lastInboundSuccessAt: hoursAgo(1),
    lastOutboundSuccessAt: hoursAgo(2),
    createdAt: hoursAgo(240),
    updatedAt: hoursAgo(3),
  },
  {
    id: 'mbx-trade',
    name: 'Trade Desk',
    emailAddress: 'trade@caseflow.example',
    displayName: 'CaseFlow Trade Desk',
    providerType: 'GOOGLE_WORKSPACE',
    inboundMode: 'PULL',
    outboundMode: 'SMTP',
    isActive: true,
    inboundEnabled: true,
    outboundEnabled: true,
    defaultGroupId: 'g-trade',
    defaultGroupName: 'Trade',
    defaultPriority: 'high',
    defaultStatus: 'open',
    unknownSenderPolicy: 'ALLOW',
    lastInboundSuccessAt: hoursAgo(4),
    lastOutboundSuccessAt: hoursAgo(6),
    createdAt: hoursAgo(480),
    updatedAt: hoursAgo(6),
  },
]

export const mockCustomerEmailSettings: CustomerEmailSettingsResponse[] = mockCustomers.map((customer, index) => ({
  customerId: customer.id,
  customerName: customer.name,
  mailboxId: index % 2 === 0 ? 'mbx-ops' : 'mbx-trade',
  mailboxName: index % 2 === 0 ? 'Operations Support' : 'Trade Desk',
  trustedContactsOnly: index % 2 === 0,
  autoCreateContact: true,
  allowSubdomains: index % 2 !== 0,
  unknownSenderPolicy: index % 2 === 0 ? 'QUARANTINE' : 'ROUTE_TO_DEFAULT',
  defaultGroupId: index % 2 === 0 ? 'g-ops' : 'g-trade',
  defaultGroupName: index % 2 === 0 ? 'Operations' : 'Trade',
  defaultPriority: index % 2 === 0 ? 'medium' : 'high',
  defaultStatus: 'open',
  updatedAt: hoursAgo(index + 1),
}))

export const mockCustomerRoutingRules: CustomerEmailRoutingRuleResponse[] = [
  {
    id: 'rule-akbank-domain',
    customerId: mockCustomers[0]?.id ?? 'c-1',
    matchType: 'DOMAIN_SUFFIX',
    matchValue: '@akbank.com',
    mailboxId: 'mbx-trade',
    mailboxName: 'Trade Desk',
    groupId: 'g-trade',
    groupName: 'Trade',
    priority: 'high',
    status: 'open',
    isActive: true,
    createdAt: hoursAgo(96),
    updatedAt: hoursAgo(4),
  },
  {
    id: 'rule-garanti-user',
    customerId: mockCustomers[1]?.id ?? 'c-2',
    matchType: 'EXACT_EMAIL',
    matchValue: 'alerts@garanti.example',
    mailboxId: 'mbx-ops',
    mailboxName: 'Operations Support',
    groupId: 'g-ops',
    groupName: 'Operations',
    priority: 'medium',
    status: 'pending',
    isActive: true,
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(8),
  },
]

export const mockIngressEvents: IngressEventDetailResponse[] = [
  {
    id: 'ing-001',
    mailboxId: 'mbx-trade',
    mailboxName: 'Trade Desk',
    mailboxAddress: 'trade@caseflow.example',
    providerType: 'GOOGLE_WORKSPACE',
    messageId: '<trade-001@caseflow.example>',
    subject: 'Transfer queue stalled',
    sender: 'alerts@akbank.com',
    status: 'FAILED',
    receivedAt: hoursAgo(2),
    processedAt: hoursAgo(2),
    lastErrorSummary: 'Routing rule lookup failed for customer domain.',
    recipients: ['trade@caseflow.example'],
    cc: [],
    rawHeaders: {
      'x-provider': 'gmail',
      'x-caseflow-mailbox': 'trade@caseflow.example',
    },
    payloadExcerpt: 'Subject: Transfer queue stalled\nBody: queue exceeded SLA threshold.',
    quarantineReason: null,
    quarantinedAt: null,
    replayedAt: null,
    relatedTicketId: 'tk-006',
  },
  {
    id: 'ing-002',
    mailboxId: 'mbx-ops',
    mailboxName: 'Operations Support',
    mailboxAddress: 'ops@caseflow.example',
    providerType: 'MICROSOFT_365',
    messageId: '<ops-002@caseflow.example>',
    subject: 'Dashboard data not refreshing',
    sender: 'support@allianz.example',
    status: 'QUARANTINED',
    receivedAt: hoursAgo(12),
    processedAt: hoursAgo(12),
    lastErrorSummary: 'Sender domain failed trusted-contact policy.',
    recipients: ['ops@caseflow.example'],
    cc: ['manager@allianz.example'],
    rawHeaders: {
      'x-provider': 'm365',
      'x-caseflow-mailbox': 'ops@caseflow.example',
    },
    payloadExcerpt: 'Quarantined pending customer policy review.',
    quarantineReason: 'Unknown sender blocked by trusted-contacts-only policy.',
    quarantinedAt: hoursAgo(12),
    replayedAt: null,
    relatedTicketId: 'tk-015',
  },
]

export function buildMockTicketEmails(): TicketEmailMessageResponse[] {
  return mockMessages
    .filter((message) => message.type === 'public_inbound' || message.type === 'public_outbound')
    .map((message) => {
      const ticket = mockTickets.find((item) => item.id === message.ticketId)
      const isInbound = message.type === 'public_inbound'
      return {
        id: message.id,
        ticketId: message.ticketId,
        threadKey: `thread-${message.ticketId}`,
        messageId: `msg-${message.id}`,
        providerMessageId: `provider-${message.id}`,
        mailboxId: ticket?.groupName.toLowerCase().includes('trade') ? 'mbx-trade' : 'mbx-ops',
        mailboxName: ticket?.groupName.toLowerCase().includes('trade') ? 'Trade Desk' : 'Operations Support',
        direction: isInbound ? 'INBOUND' : 'OUTBOUND',
        subject: ticket?.subject ?? 'CaseFlow Update',
        from: isInbound ? message.authorName : 'agent@caseflow.example',
        to: isInbound ? ['support@caseflow.example'] : [ticket?.customerName ? `${ticket.customerName.toLowerCase().replace(/\s+/g, '.')}@example.com` : 'customer@example.com'],
        cc: [],
        bcc: [],
        bodyText: message.content,
        bodyHtml: null,
        bodyPreview: message.content.slice(0, 180),
        sentAt: isInbound ? null : message.createdAt,
        receivedAt: isInbound ? message.createdAt : null,
        dispatchStatus: isInbound ? null : 'DELIVERED',
        attachments: (message.attachments ?? []).map((fileName, index) => ({
          id: `${message.id}-att-${index}`,
          fileName,
          contentType: 'application/octet-stream',
          size: 2048,
          downloadUrl: null,
        })),
      }
    })
}

export function buildMockReplyResponse(ticketId: string, mailboxId: string | null): SendTicketReplyResponse {
  return {
    requestId: `dispatch-${Date.now()}`,
    ticketId,
    outboundEmailId: `out-${Date.now()}`,
    mailboxId,
    status: 'QUEUED',
    acceptedAt: new Date().toISOString(),
    message: 'Reply queued for outbound delivery.',
  }
}

export function getMockCustomerName(customerId: string): string | null {
  return mockCustomers.find((customer) => customer.id === customerId)?.name ?? null
}