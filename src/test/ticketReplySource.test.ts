import { describe, expect, it } from 'vitest'
import { mergeSelectedInboundEmail, resolveReplySourceEmail } from '@/lib/ticketReplySource'
import type { TicketEmailMessage } from '@/types/email.types'

function makeInboundEmail(overrides: Partial<TicketEmailMessage> = {}): TicketEmailMessage {
  return {
    id: 'email-1',
    emailDocumentId: 'email-1',
    ticketId: 'ticket-1',
    threadKey: null,
    messageId: '<message-1@mail.test>',
    providerMessageId: null,
    mailboxId: '1',
    mailboxName: 'Main',
    mailboxAddress: 'support@caseflow.com',
    sourceEventId: 101,
    direction: 'INBOUND',
    subject: 'Need help',
    from: 'customer@example.com',
    to: ['support@caseflow.com'],
    cc: [],
    bcc: [],
    replyTo: null,
    bodyText: 'Hello',
    bodyHtml: null,
    sanitizedHtmlBody: null,
    rawHtmlBody: null,
    bodyPreview: 'Hello',
    status: 'RECEIVED',
    failureReason: null,
    sentAt: null,
    receivedAt: '2026-04-01T00:00:00Z',
    createdAt: '2026-04-01T00:00:00Z',
    processingStatus: null,
    dispatchStatus: null,
    attachmentCount: 0,
    attachments: [],
    resolvedReplyTarget: 'customer@example.com',
    detailType: 'INBOUND',
    detailId: 'email-1',
    hasAttachments: false,
    isPreviewAvailable: true,
    templateInfo: null,
    replyContext: {
      sourceEventId: 101,
      sourceEmailDocumentId: 'email-1',
      resolvedReplyTarget: 'customer@example.com',
    },
    contentWasEdited: null,
    ...overrides,
  }
}

describe('ticketReplySource', () => {
  it('keeps sourceEventId from the selected inbound summary when detail omits it', () => {
    const summary = makeInboundEmail({ sourceEventId: 451, messageId: '<summary@mail.test>' })
    const detail = makeInboundEmail({
      sourceEventId: null,
      messageId: '<detail@mail.test>',
      bodyText: 'Detailed body',
      replyContext: {
        sourceEventId: null,
        sourceEmailDocumentId: 'email-1',
        resolvedReplyTarget: 'customer@example.com',
      },
    })

    const merged = mergeSelectedInboundEmail(summary, detail)

    expect(merged).toMatchObject({
      sourceEventId: 451,
      messageId: '<summary@mail.test>',
      bodyText: 'Detailed body',
      replyContext: expect.objectContaining({ sourceEventId: 451 }),
    })
  })

  it('does not let selected detail null out summary reply fields', () => {
    const summary = makeInboundEmail({
      sourceEventId: 777,
      mailboxId: '44',
      messageId: '<summary-777@mail.test>',
    })
    const detail = makeInboundEmail({
      sourceEventId: null,
      mailboxId: null,
      messageId: '',
      replyContext: null,
    })

    const merged = mergeSelectedInboundEmail(summary, detail)

    expect(merged).toMatchObject({
      sourceEventId: 777,
      mailboxId: '44',
      messageId: '<summary-777@mail.test>',
    })
  })

  it('does not use document ids as sourceEventId', () => {
    const summary = makeInboundEmail({
      sourceEventId: null,
      emailDocumentId: '69d8325094ebbe5f95845795',
      replyContext: {
        sourceEventId: null,
        sourceEmailDocumentId: '69d8325094ebbe5f95845795',
        resolvedReplyTarget: 'customer@example.com',
      },
    })
    const detail = makeInboundEmail({
      sourceEventId: null,
      emailDocumentId: '69d8325094ebbe5f95845795',
      replyContext: null,
    })

    const merged = mergeSelectedInboundEmail(summary, detail)

    expect(merged?.sourceEventId).toBeNull()
    expect(merged?.replyContext?.sourceEventId).toBeNull()
  })

  it('falls back to last inbound sourceEventId only when selected merged context is missing it', () => {
    const selectedInboundEmail = makeInboundEmail({
      sourceEventId: null,
      replyContext: {
        sourceEventId: null,
        sourceEmailDocumentId: 'email-selected',
        resolvedReplyTarget: 'selected@example.com',
      },
      mailboxId: '19',
      subject: 'Selected inbound',
    })
    const lastInboundEmail = makeInboundEmail({
      sourceEventId: 932,
      mailboxId: '21',
      subject: 'Last inbound',
    })

    const resolved = resolveReplySourceEmail({ selectedInboundEmail, lastInboundEmail })

    expect(resolved.sourceEventId).toBe(932)
    expect(resolved.email).toMatchObject({
      subject: 'Selected inbound',
      mailboxId: '19',
    })
  })
})