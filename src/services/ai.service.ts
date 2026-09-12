/**
 * AI Assist service — Phase 1
 *
 * All AI requests go through the CaseFlow backend.
 * Never call AI providers directly from FE.
 *
 * Normalization lives here; components receive clean UI-friendly shapes.
 */
import { apiClient } from './api.client'

import type {
  AiSummaryApiResponse,
  AiReplyDraftApiResponse,
  AiSummaryResult,
  AiReplyDraftResult,
} from '@/types/ai.types'


function normalizeSummary(raw: AiSummaryApiResponse): AiSummaryResult {
  return {
    ticketId: raw.ticketId,
    summary: raw.summary,
    warnings: raw.warnings ?? [],
    available: raw.metadata?.available ?? false,
    unavailableReason: raw.metadata?.unavailableReason ?? null,
    generatedAt: raw.metadata?.generatedAt ?? null,
    model: raw.metadata?.model ?? null,
    promptVersion: raw.metadata?.promptVersion ?? null,
    correlationId: raw.metadata?.correlationId ?? null,
  }
}

function normalizeReplyDraft(raw: AiReplyDraftApiResponse): AiReplyDraftResult {
  return {
    ticketId: raw.ticketId,
    draft: raw.draft,
    toneApplied: raw.toneApplied ?? null,
    warnings: raw.warnings ?? [],
    available: raw.metadata?.available ?? false,
    unavailableReason: raw.metadata?.unavailableReason ?? null,
    generatedAt: raw.metadata?.generatedAt ?? null,
    model: raw.metadata?.model ?? null,
    promptVersion: raw.metadata?.promptVersion ?? null,
    correlationId: raw.metadata?.correlationId ?? null,
  }
}

export const aiService = {
  /**
   * Request an AI-generated summary for a ticket.
   * POST /tickets/{ticketId}/ai-summary
   */
  async getSummary(ticketId: string): Promise<AiSummaryResult> {
    const raw = await apiClient.post<AiSummaryApiResponse>(`/api/tickets/${ticketId}/ai-summary`, null)
    return normalizeSummary(raw)
  },

  /**
   * Request an AI-generated reply draft for a ticket.
   * POST /api/tickets/{ticketId}/ai-reply-draft
   * Optionally accepts a toneHint (future extension).
   */
  async getReplyDraft(ticketId: string, toneHint?: string): Promise<AiReplyDraftResult> {
    const body = toneHint ? { toneHint } : null
    const raw = await apiClient.post<AiReplyDraftApiResponse>(`/api/tickets/${ticketId}/ai-reply-draft`, body)
    return normalizeReplyDraft(raw)
  },

  // ---------------------------------------------------------------------------
  // Extension points for Phase 2 — not implemented until BE is ready
  // ---------------------------------------------------------------------------
  // async getSimilarCases(ticketId: string): Promise<...>
  // async getPolicyGuidance(ticketId: string): Promise<...>
}
