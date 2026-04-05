/**
 * Tests for ticketEmailService — real API flow.
 * We mock apiClient to verify the correct endpoints and normalizers are used.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('@/services/api.client', () => ({
  apiClient: { get: mockGet, post: mockPost, put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const { ticketEmailService } = await import('@/services/ticketEmail.service')

describe('ticketEmailService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
  })

  describe('listThread', () => {
    it('calls GET /tickets/:id/email/thread and returns normalized messages', async () => {
      mockGet.mockResolvedValueOnce([
        {
          direction: 'INBOUND',
          id: 1,
          emailId: 'eml-1',
          messageId: '<msg1>',
          fromAddress: 'c@test.com',
          toAddress: null,
          subject: 'Help',
          status: 'RECEIVED',
          timestamp: '2024-01-01T00:00:00Z',
          bodyPreview: 'Need help',
        },
      ])

      const result = await ticketEmailService.listThread('tkt-1')
      expect(mockGet).toHaveBeenCalledWith('/tickets/tkt-1/email/thread')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
      expect(result[0].emailDocumentId).toBe('eml-1')
      expect(result[0].direction).toBe('INBOUND')
    })

    it('keeps thread event ids separate from real email document ids', async () => {
      mockGet.mockResolvedValueOnce([
        {
          direction: 'INBOUND',
          id: 74,
          emailDocumentId: 'email-74',
          messageId: '<msg74>',
          fromAddress: 'c@test.com',
          toAddress: null,
          subject: 'Help',
          status: 'RECEIVED',
          timestamp: '2024-01-01T00:00:00Z',
          bodyPreview: 'Need help',
        },
      ])

      const result = await ticketEmailService.listThread('tkt-1')

      expect(result[0].id).toBe('74')
      expect(result[0].emailDocumentId).toBe('email-74')
      expect(result[0].sourceEventId).toBe('74')
    })

    it('falls back to a non-numeric thread id when the backend uses it as the real email document id', async () => {
      mockGet.mockResolvedValueOnce([
        {
          direction: 'INBOUND',
          id: '69d239b6d87d2153052e7461',
          sourceEventId: '79',
          messageId: '<msg74>',
          fromAddress: 'c@test.com',
          toAddress: null,
          subject: 'Help',
          status: 'RECEIVED',
          timestamp: '2024-01-01T00:00:00Z',
          bodyPreview: 'Need help',
          attachmentCount: 2,
        },
      ])

      const result = await ticketEmailService.listThread('tkt-1')

      expect(result[0].id).toBe('69d239b6d87d2153052e7461')
      expect(result[0].emailDocumentId).toBe('69d239b6d87d2153052e7461')
      expect(result[0].sourceEventId).toBe('79')
    })

    it('does not infer legacy event-like ids as email document ids', async () => {
      mockGet.mockResolvedValueOnce([
        {
          direction: 'INBOUND',
          id: 'evt-74',
          messageId: '<msg74>',
          fromAddress: 'c@test.com',
          toAddress: null,
          subject: 'Help',
          status: 'RECEIVED',
          timestamp: '2024-01-01T00:00:00Z',
          bodyPreview: 'Need help',
          attachmentCount: 2,
        },
      ])

      const result = await ticketEmailService.listThread('tkt-1')

      expect(result[0].emailDocumentId).toBeNull()
      expect(result[0].sourceEventId).toBe('evt-74')
    })

    it('returns sorted results by date', async () => {
      mockGet.mockResolvedValueOnce([
        { direction: 'OUTBOUND', id: 2, messageId: '<m2>', fromAddress: 's@t.com', toAddress: 'c@t.com', subject: 'Re', status: 'SENT', timestamp: '2024-01-02T00:00:00Z', bodyPreview: 'Reply' },
        { direction: 'INBOUND', id: 1, messageId: '<m1>', fromAddress: 'c@t.com', toAddress: null, subject: 'Help', status: 'RECEIVED', timestamp: '2024-01-01T00:00:00Z', bodyPreview: 'Need help' },
      ])

      const result = await ticketEmailService.listThread('tkt-1')
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
    })
  })

  describe('getDetail', () => {
    it('returns normalized message for a valid email', async () => {
      mockGet.mockResolvedValueOnce({
        detailType: 'INBOUND',
        id: 'e1',
        messageId: '<msg1>',
        ticketPublicId: 'tkt-1',
        subject: 'Help',
        fromAddress: 'c@test.com',
        toAddress: ['support@test.com'],
        direction: 'INBOUND',
        cc: [],
        receivedAt: '2024-01-01T00:00:00Z',
        bodyText: 'Need help',
        bodyHtml: '<p>Need help</p>',
        attachments: [
          { id: '501', fileName: 'invoice.pdf', downloadPath: '/api/tickets/100/emails/e1/attachments/501/content', contentType: 'application/pdf', size: 2048, previewSupported: true },
        ],
      })

      const result = await ticketEmailService.getDetail('tkt-1', 'e1')
      expect(mockGet).toHaveBeenCalledWith('/tickets/tkt-1/email/detail/INBOUND/e1')
      expect(result).not.toBeNull()
      expect(result?.id).toBe('e1')
      expect(result?.emailDocumentId).toBe('e1')
      expect(result?.attachments).toEqual([
        expect.objectContaining({
          fileName: 'invoice.pdf',
          id: '501',
          downloadUrl: '/api/tickets/100/emails/e1/attachments/501/content',
          previewSupported: true,
        }),
      ])
    })

    it('hydrates outbound email detail from /emails/{id} and keeps outbound direction', async () => {
      mockGet.mockResolvedValueOnce({
        detailType: 'OUTBOUND',
        id: 'dispatch-42',
        ticketPublicId: 'tkt-1',
        direction: 'OUTBOUND',
        messageId: '<msg2>',
        subject: 'Re: Help',
        fromAddress: 'support@test.com',
        toAddress: ['c@test.com'],
        cc: [],
        sentAt: '2024-01-02T00:00:00Z',
        bodyText: 'Reply body',
        bodyHtml: null,
        attachments: [],
      })

      const result = await ticketEmailService.getDetail('tkt-1', 'dispatch-42', 'OUTBOUND')
      expect(mockGet).toHaveBeenCalledWith('/tickets/tkt-1/email/detail/OUTBOUND/dispatch-42')
      expect(result?.id).toBe('dispatch-42')
      expect(result?.detailId).toBe('dispatch-42')
      expect(result?.direction).toBe('OUTBOUND')
      expect(result?.sentAt).toBe('2024-01-02T00:00:00Z')
      expect(result?.receivedAt).toBeNull()
    })

    it('returns null when API returns null', async () => {
      mockGet.mockResolvedValueOnce(null)
      const result = await ticketEmailService.getDetail('tkt-1', 'no-such')
      expect(result).toBeNull()
    })
  })

  describe('previewReply', () => {
    it('calls the ticket-scoped preview endpoint and normalizes the response', async () => {
      mockPost.mockResolvedValueOnce({
        derivedToAddress: 'customer@test.com',
        derivedFromAddress: 'support@test.com',
        subject: 'Re: Help',
        bodyText: 'Preview body',
        bodyHtml: '<p>Preview body</p>',
        warnings: ['Template fallback applied'],
        placeholderDiagnostics: [
          { placeholder: 'customer.name', status: 'EMPTY', message: 'Customer name is missing' },
        ],
      })

      const result = await ticketEmailService.previewReply('tkt-1', {
        sourceEventId: 'evt-1',
        mailboxId: '1',
        templateId: 'tpl-1',
      })

      expect(mockPost).toHaveBeenCalledWith('/tickets/tkt-1/email/reply/preview', {
        sourceEventId: 'evt-1',
        mailboxId: '1',
        templateId: 'tpl-1',
      })
      expect(result.derivedToAddress).toBe('customer@test.com')
      expect(result.placeholderDiagnostics[0]?.placeholder).toBe('customer.name')
    })
  })

  describe('sendReply', () => {
    it('throws when mailboxId is missing', async () => {
      await expect(
        ticketEmailService.sendReply('tkt-1', {
          mailboxId: null,
          sourceEventId: 'evt-1',
          subject: 'Re: Help',
          textBody: 'Here is help.',
        }),
      ).rejects.toThrow('mailboxId is required for ticket email replies')

      expect(mockPost).not.toHaveBeenCalled()
    })

    it('posts a source-event reply payload for normal threaded replies', async () => {
      mockPost.mockResolvedValueOnce({ requestId: 'req-1', ticketId: 'tkt-1', status: 'QUEUED' })

      const result = await ticketEmailService.sendReply('tkt-1', {
        mailboxId: '1',
        sourceEventId: 'evt-1',
        subject: 'Re: Help',
        textBody: 'Here is help.',
        inReplyToMessageId: '<msg1>',
      })

      expect(mockPost).toHaveBeenCalledWith('/tickets/tkt-1/email/reply', {
        mailboxId: 1,
        sourceEventId: 'evt-1',
        subject: 'Re: Help',
        textBody: 'Here is help.',
        inReplyToMessageId: '<msg1>',
      })
      expect(result.requestId).toBe('req-1')
      expect(result.ticketId).toBe('tkt-1')
    })

    it('posts the direct-reply contract without unsupported fields', async () => {
      mockPost.mockResolvedValueOnce({ requestId: 'req-2', ticketId: 'tkt-1', status: 'QUEUED' })

      await ticketEmailService.sendReply('tkt-1', {
        mailboxId: '1',
        toAddress: 'c@test.com',
        subject: 'With attachment',
        textBody: 'See attached.',
      })

      expect(mockPost).toHaveBeenCalledWith('/tickets/tkt-1/email/reply', {
        mailboxId: 1,
        toAddress: 'c@test.com',
        subject: 'With attachment',
        textBody: 'See attached.',
      })
    })

    it('uses an unknown fallback status when the backend does not return a structured reply body', async () => {
      mockPost.mockResolvedValueOnce(undefined)

      const result = await ticketEmailService.sendReply('tkt-1', {
        mailboxId: '1',
        sourceEventId: 'evt-1',
        subject: 'Re: Help',
        textBody: 'Here is help.',
      })

      expect(result.status).toBe('UNKNOWN')
    })

    it('extracts plain email from display-name recipient format', async () => {
      mockPost.mockResolvedValueOnce({ requestId: 'req-3', ticketId: 'tkt-1', status: 'QUEUED' })

      await ticketEmailService.sendReply('tkt-1', {
        mailboxId: '1',
        toAddress: '"Irem Meral" <iremizbudak1@gmail.com>',
        subject: 'Re: Hello',
        textBody: 'Hello back',
      })

      expect(mockPost).toHaveBeenCalledWith('/tickets/tkt-1/email/reply', {
        mailboxId: 1,
        toAddress: 'iremizbudak1@gmail.com',
        subject: 'Re: Hello',
        textBody: 'Hello back',
      })
    })

    it('throws when neither sourceEventId nor toAddress is provided', async () => {
      await expect(
        ticketEmailService.sendReply('tkt-1', {
          mailboxId: '1',
          subject: 'Re: Help',
          textBody: 'Here is help.',
        } as unknown as Parameters<typeof ticketEmailService.sendReply>[1]),
      ).rejects.toThrow('sourceEventId or toAddress is required for ticket email replies')
    })
  })
})
