/**
 * AI feature types — Phase 1: Summary + Reply Draft
 *
 * Backend shapes (DTOs) and normalized UI shapes are separated.
 * Normalization happens once in ai.service.ts; components consume the UI shapes.
 *
 * Backend endpoints (via CaseFlow BE — never call AI service directly):
 *   POST /tickets/{ticketId}/ai-summary
 *   POST /tickets/{ticketId}/ai-reply-draft
 *
 * Extension points for Phase 2 (add service + hook when BE is ready):
 *   POST /tickets/{ticketId}/ai-similar-cases
 *   POST /tickets/{ticketId}/ai-policy-guidance
 */

// ---------------------------------------------------------------------------
// Backend DTO shapes
// ---------------------------------------------------------------------------


// Backend contract DTOs
export interface AiAssistMetadataApi {
  model?: string | null
  promptVersion?: string | null
  generatedAt?: string | null
  correlationId?: string | null
  available: boolean
  unavailableReason?: string | null
}

export interface AiSummaryApiResponse {
  ticketId: number
  summary: string | null
  warnings?: string[] | null
  metadata: AiAssistMetadataApi
}

export interface AiReplyDraftApiResponse {
  ticketId: number
  draft: string | null
  toneApplied?: string | null
  warnings?: string[] | null
  metadata: AiAssistMetadataApi
}

// ---------------------------------------------------------------------------
// Normalized UI shapes — consumed by cards/hooks
// ---------------------------------------------------------------------------


// Normalized UI models
export interface AiSummaryResult {
  ticketId: number
  summary: string | null
  warnings: string[]
  available: boolean
  unavailableReason: string | null
  generatedAt: string | null
  model: string | null
  promptVersion: string | null
  correlationId: string | null
}

export interface AiReplyDraftResult {
  ticketId: number
  draft: string | null
  toneApplied: string | null
  warnings: string[]
  available: boolean
  unavailableReason: string | null
  generatedAt: string | null
  model: string | null
  promptVersion: string | null
  correlationId: string | null
}
