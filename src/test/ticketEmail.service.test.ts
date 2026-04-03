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
      expect(result[0].direction).toBe('INBOUND')
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
        id: 11,
        mailboxId: 5,
        messageId: '<msg1>',
        rawFrom: 'c@test.com',
        rawSubject: 'Help',
        inReplyTo: null,
        rawReplyTo: null,
        receivedAt: '2024-01-01T00:00:00Z',
        status: 'RECEIVED',
        failureReason: null,
        processingAttempts: 1,
        lastAttemptAt: null,
        processedAt: null,
        documentId: null,
        ticketId: 100,
      })

      const result = await ticketEmailService.getDetail('tkt-1', 'e1')
      expect(mockGet).toHaveBeenCalledWith('/tickets/tkt-1/email/inbound/e1')
      expect(result).not.toBeNull()
      expect(result?.id).toBe('11')
    })

    it('calls outbound detail endpoint when direction is OUTBOUND', async () => {
      mockGet.mockResolvedValueOnce({
        id: 22,
        ticketId: 100,
        messageId: '<msg2>',
        fromAddress: 'support@test.com',
        toAddress: 'c@test.com',
        subject: 'Re: Help',
        status: 'SENT',
        attempts: 1,
        lastAttemptAt: '2024-01-02T00:00:00Z',
        sentAt: '2024-01-02T00:00:00Z',
        failureReason: null,
        scheduledAt: null,
        createdAt: '2024-01-02T00:00:00Z',
      })

      const result = await ticketEmailService.getDetail('tkt-1', 'dispatch-42', 'OUTBOUND')
      expect(mockGet).toHaveBeenCalledWith('/tickets/tkt-1/email/outbound/dispatch-42')
      expect(result?.id).toBe('22')
      expect(result?.direction).toBe('OUTBOUND')
    })

    it('returns null when API returns null', async () => {
      mockGet.mockResolvedValueOnce(null)
      const result = await ticketEmailService.getDetail('tkt-1', 'no-such')
      expect(result).toBeNull()
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
