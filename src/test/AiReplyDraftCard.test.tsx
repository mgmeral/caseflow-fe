import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { AiReplyDraftResult } from '@/types/ai.types'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const generateMutate = vi.hoisted(() => vi.fn())
const resetMutate = vi.hoisted(() => vi.fn())

const aiReplyDraftState = vi.hoisted(() => ({
  result: null as AiReplyDraftResult | null,
  isLoading: false,
  isError: false,
  error: null as Error | null,
}))

const permissionState = vi.hoisted(() => ({
  canSendTicketEmailReply: true,
}))

vi.mock('@/hooks/useAiReplyDraft', () => ({
  useAiReplyDraft: () => ({
    ...aiReplyDraftState,
    generate: generateMutate,
    reset: resetMutate,
  }),
}))

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => permissionState,
}))

const { AiReplyDraftCard } = await import('@/components/ticket-detail/AiReplyDraftCard')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AiReplyDraftCard', () => {
  const onApplyDraft = vi.fn()

  beforeEach(() => {
    generateMutate.mockReset()
    resetMutate.mockReset()
    onApplyDraft.mockReset()
    aiReplyDraftState.result = null
    aiReplyDraftState.isLoading = false
    aiReplyDraftState.isError = false
    aiReplyDraftState.error = null
    permissionState.canSendTicketEmailReply = true
  })

  it('renders idle state with generate button', () => {
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    expect(screen.getByText('Suggested Reply')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate reply draft/i })).toBeInTheDocument()
  })

  it('calls generate when button is clicked', () => {
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    fireEvent.click(screen.getByRole('button', { name: /generate reply draft/i }))

    expect(generateMutate).toHaveBeenCalledTimes(1)
  })

  it('renders loading state', () => {
    aiReplyDraftState.isLoading = true
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    expect(screen.getByText(/generating reply draft/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /generate reply draft/i })).not.toBeInTheDocument()
  })

  it('renders error state with retry', () => {
    aiReplyDraftState.isError = true
    aiReplyDraftState.error = new Error('AI service unreachable')
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    expect(screen.getByText('AI service unreachable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /apply to editor/i })).not.toBeInTheDocument()
  })

  it('retry button calls generate', () => {
    aiReplyDraftState.isError = true
    aiReplyDraftState.error = new Error('Timeout')
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(generateMutate).toHaveBeenCalledTimes(1)
  })

  it('renders draft text in success state', () => {
    aiReplyDraftState.result = {
      draft: 'Hello, thank you for reaching out. We are looking into the issue.',
      warnings: [],
      generatedAt: null,
      model: null,
    }
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    expect(screen.getByText('Hello, thank you for reaching out. We are looking into the issue.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /apply to editor/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument()
  })

  it('apply to editor calls onApplyDraft with draft text — does NOT auto-send', () => {
    const draftText = 'Please try clearing your cache.'
    aiReplyDraftState.result = { draft: draftText, warnings: [], generatedAt: null, model: null }
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    fireEvent.click(screen.getByRole('button', { name: /apply to editor/i }))

    expect(onApplyDraft).toHaveBeenCalledWith(draftText)
    expect(onApplyDraft).toHaveBeenCalledTimes(1)
    // generateMutate (send) must NOT be called
    expect(generateMutate).not.toHaveBeenCalled()
  })

  it('shows warnings alongside draft content', () => {
    aiReplyDraftState.result = {
      draft: 'Here is your answer.',
      warnings: ['Draft confidence is low.'],
      generatedAt: null,
      model: null,
    }
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    expect(screen.getByText('Draft confidence is low.')).toBeInTheDocument()
    expect(screen.getByText('Here is your answer.')).toBeInTheDocument()
  })

  it('renders empty state when draft is blank', () => {
    aiReplyDraftState.result = { draft: '', warnings: [], generatedAt: null, model: null }
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    expect(screen.getByText(/no reply draft could be generated/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /apply to editor/i })).not.toBeInTheDocument()
  })

  it('does not render when user lacks reply permission', () => {
    permissionState.canSendTicketEmailReply = false
    const { container } = render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    expect(container.firstChild).toBeNull()
  })

  it('shows boundary reminder text in success state', () => {
    aiReplyDraftState.result = { draft: 'Some draft', warnings: [], generatedAt: null, model: null }
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    expect(screen.getByText(/edit it before sending/i)).toBeInTheDocument()
  })

  it('shows "Draft only" label in header', () => {
    render(<AiReplyDraftCard ticketId="t1" onApplyDraft={onApplyDraft} />)

    expect(screen.getByText(/draft only/i)).toBeInTheDocument()
  })
})
