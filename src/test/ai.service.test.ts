import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiSummaryApiResponse, AiReplyDraftApiResponse } from '@/types/ai.types'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockPost = vi.hoisted(() => vi.fn())

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: mockPost,
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const { aiService } = await import('@/services/ai.service')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('aiService', () => {
  beforeEach(() => {
    mockPost.mockReset()
  })

  // -------------------------------------------------------------------------
  // getSummary
  // -------------------------------------------------------------------------

  describe('getSummary', () => {
    it('posts to the correct endpoint', async () => {
      const raw: AiSummaryApiResponse = {
        ticketId: 99,
        summary: 'Login issue since v2.3',
        warnings: [],
        metadata: { available: true }
      }
      mockPost.mockResolvedValueOnce(raw)

      await aiService.getSummary('ticket-99')

      expect(mockPost).toHaveBeenCalledWith('/api/tickets/ticket-99/ai-summary', null)
    })

    it('normalizes a full response', async () => {
      const raw: AiSummaryApiResponse = {
        ticketId: 1,
        summary: 'Customer cannot log in.',
        warnings: ['Low confidence'],
        metadata: {
          available: true,
          generatedAt: '2026-04-16T10:00:00Z',
          model: 'gpt-4o',
          promptVersion: 'v1',
          correlationId: 'abc',
        }
      }
      mockPost.mockResolvedValueOnce(raw)

      const result = await aiService.getSummary('t1')

      expect(result.summary).toBe('Customer cannot log in.')
      expect(result.warnings).toEqual(['Low confidence'])
      expect(result.generatedAt).toBe('2026-04-16T10:00:00Z')
      expect(result.model).toBe('gpt-4o')
      expect(result.promptVersion).toBe('v1')
      expect(result.correlationId).toBe('abc')
      expect(result.available).toBe(true)
    })

    it('normalizes null summary to empty string', async () => {
      mockPost.mockResolvedValueOnce({ ticketId: 1, summary: null, metadata: { available: true } })

      const result = await aiService.getSummary('t1')

      expect(result.summary).toBeNull()
    })

    it('normalizes missing warnings to empty array', async () => {
      mockPost.mockResolvedValueOnce({ ticketId: 1, summary: 'Some text', metadata: { available: true } })

      const result = await aiService.getSummary('t1')

      expect(result.warnings).toEqual([])
    })

    it('normalizes null optional fields', async () => {
      mockPost.mockResolvedValueOnce({ ticketId: 1, summary: 'Text', metadata: { available: true } })

      const result = await aiService.getSummary('t1')

      expect(result.generatedAt).toBeNull()
      expect(result.model).toBeNull()
    })

    it('propagates API errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('503 Service Unavailable'))

      await expect(aiService.getSummary('t1')).rejects.toThrow('503 Service Unavailable')
    })
  })

  // -------------------------------------------------------------------------
  // getReplyDraft
  // -------------------------------------------------------------------------

  describe('getReplyDraft', () => {
    it('posts to the correct endpoint', async () => {
      const raw: AiReplyDraftApiResponse = {
        ticketId: 77,
        draft: 'Hello, thank you for contacting us.',
        warnings: [],
        metadata: { available: true }
      }
      mockPost.mockResolvedValueOnce(raw)

      await aiService.getReplyDraft('ticket-77')

      expect(mockPost).toHaveBeenCalledWith('/api/tickets/ticket-77/ai-reply-draft', null)
    })

    it('normalizes a full response', async () => {
      const raw: AiReplyDraftApiResponse = {
        ticketId: 1,
        draft: 'We are looking into the issue.',
        warnings: ['Draft may not cover all details'],
        toneApplied: 'professional',
        metadata: {
          available: true,
          generatedAt: '2026-04-16T11:00:00Z',
          model: 'gpt-4o-mini',
          promptVersion: 'v2',
          correlationId: 'xyz',
        }
      }
      mockPost.mockResolvedValueOnce(raw)

      const result = await aiService.getReplyDraft('t1')

      expect(result.draft).toBe('We are looking into the issue.')
      expect(result.warnings).toEqual(['Draft may not cover all details'])
      expect(result.model).toBe('gpt-4o-mini')
      expect(result.promptVersion).toBe('v2')
      expect(result.correlationId).toBe('xyz')
      expect(result.toneApplied).toBe('professional')
    })

    it('normalizes null draft to empty string', async () => {
      mockPost.mockResolvedValueOnce({ ticketId: 1, draft: null, metadata: { available: true } })

      const result = await aiService.getReplyDraft('t1')

      expect(result.draft).toBeNull()
    })

    it('normalizes missing warnings to empty array', async () => {
      mockPost.mockResolvedValueOnce({ ticketId: 1, draft: 'Draft text', metadata: { available: true } })

      const result = await aiService.getReplyDraft('t1')

      expect(result.warnings).toEqual([])
    })

    it('propagates API errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('AI unavailable'))

      await expect(aiService.getReplyDraft('t1')).rejects.toThrow('AI unavailable')
    })
  })
})
