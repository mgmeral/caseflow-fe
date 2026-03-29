/**
 * Tests for ticketEmailService (mock mode).
 * Verifies the mock service matches the expected contract shape.
 */
import { describe, it, expect, vi } from 'vitest'

// Force mock mode
vi.mock('@/lib/env', () => ({ USE_MOCKS: true, API_URL: '' }))

const { ticketEmailService } = await import('@/services/ticketEmail.service')

describe('ticketEmailService (mock)', () => {
  describe('listThread', () => {
    it('returns TicketEmailMessage[] for known ticket', async () => {
      const thread = await ticketEmailService.listThread('tkt-1001')
      expect(Array.isArray(thread)).toBe(true)

      for (const msg of thread) {
        expect(msg).toHaveProperty('id')
        expect(msg).toHaveProperty('ticketId')
        expect(msg).toHaveProperty('messageId')
        expect(msg).toHaveProperty('direction')
        expect(['INBOUND', 'OUTBOUND']).toContain(msg.direction)
        expect(Array.isArray(msg.to)).toBe(true)
        expect(Array.isArray(msg.cc)).toBe(true)
        expect(Array.isArray(msg.bcc)).toBe(true)
        expect(Array.isArray(msg.attachments)).toBe(true)
      }
    })

    it('returns empty array for unknown ticket', async () => {
      const thread = await ticketEmailService.listThread('nonexistent')
      expect(thread).toEqual([])
    })

    it('messages are sorted chronologically', async () => {
      const thread = await ticketEmailService.listThread('tkt-1001')
      if (thread.length < 2) return

      for (let i = 1; i < thread.length; i++) {
        const prevTs = thread[i - 1].receivedAt ?? thread[i - 1].sentAt ?? ''
        const curTs = thread[i].receivedAt ?? thread[i].sentAt ?? ''
        expect(prevTs.localeCompare(curTs)).toBeLessThanOrEqual(0)
      }
    })
  })

  describe('getDetail', () => {
    it('returns a message when it exists', async () => {
      const thread = await ticketEmailService.listThread('tkt-1001')
      if (thread.length === 0) return

      const detail = await ticketEmailService.getDetail('tkt-1001', thread[0].id)
      expect(detail).not.toBeNull()
      expect(detail?.id).toBe(thread[0].id)
    })

    it('returns null for non-existent email', async () => {
      const detail = await ticketEmailService.getDetail('tkt-1001', 'no-such')
      expect(detail).toBeNull()
    })
  })

  describe('sendReply', () => {
    it('returns a SendTicketReplyResult with expected shape', async () => {
      const result = await ticketEmailService.sendReply('tkt-1001', {
        mailboxId: 'mb-support',
        to: ['customer@test.com'],
        cc: [],
        bcc: [],
        subject: 'Re: Test',
        body: 'Thanks for reaching out.',
        isHtml: false,
        attachments: [],
      })

      expect(result).toHaveProperty('requestId')
      expect(result).toHaveProperty('ticketId', 'tkt-1001')
      expect(result).toHaveProperty('status')
      expect(typeof result.requestId).toBe('string')
    })

    it('adds the reply to the thread', async () => {
      const before = await ticketEmailService.listThread('tkt-1001')
      const beforeCount = before.length

      await ticketEmailService.sendReply('tkt-1001', {
        mailboxId: null,
        to: ['test@test.com'],
        cc: [],
        bcc: [],
        subject: 'Re: thread test',
        body: 'Testing reply addition',
        isHtml: false,
        attachments: [],
      })

      const after = await ticketEmailService.listThread('tkt-1001')
      expect(after.length).toBe(beforeCount + 1)

      const newest = after[after.length - 1]
      expect(newest.direction).toBe('OUTBOUND')
      expect(newest.subject).toBe('Re: thread test')
    })

    it('handles file attachments in the reply payload', async () => {
      const file = new File(['test content'], 'doc.pdf', { type: 'application/pdf' })

      const result = await ticketEmailService.sendReply('tkt-1001', {
        mailboxId: 'mb-support',
        to: ['user@test.com'],
        cc: [],
        bcc: [],
        subject: 'With attachment',
        body: 'See attached.',
        isHtml: false,
        attachments: [file],
      })

      expect(result.ticketId).toBe('tkt-1001')
    })
  })
})
