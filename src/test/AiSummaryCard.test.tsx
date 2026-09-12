import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { AiSummaryResult } from '@/types/ai.types'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const generateMutate = vi.hoisted(() => vi.fn())
const resetMutate = vi.hoisted(() => vi.fn())

const aiSummaryState = vi.hoisted(() => ({
  result: null as AiSummaryResult | null,
  isLoading: false,
  isError: false,
  error: null as Error | null,
}))

vi.mock('@/hooks/useAiSummary', () => ({
  useAiSummary: () => ({
    ...aiSummaryState,
    generate: generateMutate,
    reset: resetMutate,
  }),
}))

const { AiSummaryCard } = await import('@/components/ticket-detail/AiSummaryCard')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AiSummaryCard', () => {
  beforeEach(() => {
    generateMutate.mockReset()
    resetMutate.mockReset()
    aiSummaryState.result = null
    aiSummaryState.isLoading = false
    aiSummaryState.isError = false
    aiSummaryState.error = null
  })

  it('renders idle state with a generate button', () => {
    render(<AiSummaryCard ticketId="t1" />)

    expect(screen.getByText('AI Summary')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate summary/i })).toBeInTheDocument()
    expect(screen.queryByText(/generating/i)).not.toBeInTheDocument()
  })

  it('calls generate when Generate Summary is clicked', () => {
    render(<AiSummaryCard ticketId="t1" />)

    fireEvent.click(screen.getByRole('button', { name: /generate summary/i }))

    expect(generateMutate).toHaveBeenCalledTimes(1)
  })

  it('renders loading state', () => {
    aiSummaryState.isLoading = true
    render(<AiSummaryCard ticketId="t1" />)

    expect(screen.getByText(/generating summary/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /generate summary/i })).not.toBeInTheDocument()
  })

  it('renders error state with retry', () => {
    aiSummaryState.isError = true
    aiSummaryState.error = new Error('Service unavailable')
    render(<AiSummaryCard ticketId="t1" />)

    expect(screen.getByText('Service unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('retry button calls generate again', () => {
    aiSummaryState.isError = true
    aiSummaryState.error = new Error('Timeout')
    render(<AiSummaryCard ticketId="t1" />)

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(generateMutate).toHaveBeenCalledTimes(1)
  })

  it('renders success state with summary text', () => {
    aiSummaryState.result = {
      summary: 'Customer reports login failure since last update.',
      warnings: [],
      generatedAt: '2026-04-16T10:00:00Z',
      model: 'gpt-4o',
    }
    render(<AiSummaryCard ticketId="t1" />)

    expect(screen.getByText('Customer reports login failure since last update.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument()
  })

  it('shows backend warnings inside success state', () => {
    aiSummaryState.result = {
      summary: 'Summary text.',
      warnings: ['Low confidence — limited ticket history.'],
      generatedAt: null,
      model: null,
    }
    render(<AiSummaryCard ticketId="t1" />)

    expect(screen.getByText('Low confidence — limited ticket history.')).toBeInTheDocument()
    expect(screen.getByText('Summary text.')).toBeInTheDocument()
  })

  it('renders empty state when summary is blank', () => {
    aiSummaryState.result = { summary: '', warnings: [], generatedAt: null, model: null }
    render(<AiSummaryCard ticketId="t1" />)

    expect(screen.getByText(/no summary could be generated/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('displays model label when provided', () => {
    aiSummaryState.result = {
      summary: 'Ticket is about billing.',
      warnings: [],
      generatedAt: null,
      model: 'gpt-4o-mini',
    }
    render(<AiSummaryCard ticketId="t1" />)

    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument()
  })

  it('shows "Suggestion only" label to set expectations', () => {
    render(<AiSummaryCard ticketId="t1" />)

    expect(screen.getByText(/suggestion only/i)).toBeInTheDocument()
  })
})
