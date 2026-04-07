import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { TicketTagAssignment } from '@/types/ticket.types'

const mockSuccess = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())
const addMutate = vi.hoisted(() => vi.fn())
const removeMutate = vi.hoisted(() => vi.fn())

const ticketTagsState = vi.hoisted(() => ({
  data: [
    {
      id: 'tt1',
      ticketId: 't1',
      tagId: '1',
      taggedAt: '2026-04-05T10:00:00Z',
      taggedBy: 'u1',
      taggedByName: 'Agent',
      tagCode: 'VIP',
      tagName: 'VIP',
      tagColor: '#ef4444',
      tagIsActive: true,
      tag: null,
    },
  ] as TicketTagAssignment[],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}))

const activeTagsState = vi.hoisted(() => ({
  data: [
    { id: '1', code: 'VIP', name: 'VIP', color: '#ef4444', isActive: true },
    { id: '2', code: 'ESC', name: 'Escalated', color: null, isActive: true },
  ],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}))

vi.mock('@/hooks/useTags', () => ({
  useTicketTags: () => ticketTagsState,
  useActiveTags: () => activeTagsState,
  useAddTicketTag: () => ({ mutate: addMutate, isPending: false }),
  useRemoveTicketTag: () => ({ mutate: removeMutate, isPending: false }),
}))

const { TicketTagsCard } = await import('@/components/ticket-detail/TicketTagsCard')

describe('TicketTagsCard', () => {
  beforeEach(() => {
    mockSuccess.mockReset()
    mockError.mockReset()
    addMutate.mockReset()
    removeMutate.mockReset()
    ticketTagsState.data = [
      {
        id: 'tt1',
        ticketId: 't1',
        tagId: '1',
        taggedAt: '2026-04-05T10:00:00Z',
        taggedBy: 'u1',
        taggedByName: 'Agent',
        tagCode: 'VIP',
        tagName: 'VIP',
        tagColor: '#ef4444',
        tagIsActive: true,
        tag: null,
      },
    ]
    ticketTagsState.isLoading = false
    ticketTagsState.isError = false
    ticketTagsState.refetch.mockReset()
    activeTagsState.data = [
      { id: '1', code: 'VIP', name: 'VIP', color: '#ef4444', isActive: true },
      { id: '2', code: 'ESC', name: 'Escalated', color: null, isActive: true },
    ]
    activeTagsState.isLoading = false
    activeTagsState.isError = false
    activeTagsState.refetch.mockReset()
  })

  it('loads assigned tags and active tag options', () => {
    ticketTagsState.data = [
      {
        id: 'tt1',
        ticketId: 't1',
        tagId: '1',
        taggedAt: '2026-04-05T10:00:00Z',
        taggedBy: 'u1',
        taggedByName: 'Agent',
        tagCode: 'VIP',
        tagName: 'VIP',
        tagColor: '#ef4444',
        tagIsActive: true,
        tag: null,
      },
      {
        id: 'tt2',
        ticketId: 't1',
        tagId: '3',
        taggedAt: '2026-04-05T10:05:00Z',
        taggedBy: 'u1',
        taggedByName: 'Agent',
        tagCode: 'BILLING',
        tagName: 'Billing',
        tagColor: '#0d5ac9',
        tagIsActive: true,
        tag: null,
      },
    ]
    activeTagsState.data = [
      { id: '1', code: 'VIP', name: 'VIP', color: '#ef4444', isActive: true },
      { id: '2', code: 'ESC', name: 'Escalated', color: null, isActive: true },
      { id: '3', code: 'BILLING', name: 'Billing', color: '#0d5ac9', isActive: true },
    ]

    render(<TicketTagsCard ticketId="t1" />)

    expect(screen.getByRole('button', { name: 'Remove VIP' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Billing' })).toBeInTheDocument()
    expect(screen.getByText('Assigned Tags')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Escalated (ESC)' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'VIP (VIP)' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Billing (BILLING)' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Add tag')).toBeInTheDocument()
  })

  it('adds a tag through the active tag selector', () => {
    render(<TicketTagsCard ticketId="t1" />)

    fireEvent.change(screen.getByRole('combobox', { name: 'Add tag' }), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Tag' }))

    expect(addMutate).toHaveBeenCalledWith('2', expect.any(Object))
  })

  it('removes an assigned tag', () => {
    render(<TicketTagsCard ticketId="t1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove VIP' }))

    expect(removeMutate).toHaveBeenCalledWith('1', expect.any(Object))
  })

  it('falls back to tagCode and tagId for assigned chip labels and skips empty chips', () => {
    ticketTagsState.data = [
      {
        id: 'tt1',
        ticketId: 't1',
        tagId: '7',
        taggedAt: '2026-04-05T10:00:00Z',
        taggedBy: 'u1',
        taggedByName: 'Agent',
        tagCode: 'ESC',
        tagName: null,
        tagColor: null,
        tagIsActive: true,
        tag: null,
      },
      {
        id: 'tt2',
        ticketId: 't1',
        tagId: '8',
        taggedAt: '2026-04-05T10:00:00Z',
        taggedBy: 'u1',
        taggedByName: 'Agent',
        tagCode: null,
        tagName: null,
        tagColor: null,
        tagIsActive: true,
        tag: null,
      },
      {
        id: 'tt3',
        ticketId: 't1',
        tagId: '',
        taggedAt: '2026-04-05T10:00:00Z',
        taggedBy: 'u1',
        taggedByName: 'Agent',
        tagCode: null,
        tagName: null,
        tagColor: null,
        tagIsActive: true,
        tag: null,
      },
    ]

    render(<TicketTagsCard ticketId="t1" />)

    expect(screen.getByText('ESC')).toBeInTheDocument()
    expect(screen.getByText('Tag #8')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove Tag #' })).not.toBeInTheDocument()
  })

  it('handles duplicate add errors gracefully', () => {
    addMutate.mockImplementation((_tagId, options) => {
      options.onError?.({ status: 409, message: 'duplicate tag' })
    })

    render(<TicketTagsCard ticketId="t1" />)

    fireEvent.change(screen.getByRole('combobox', { name: 'Add tag' }), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Tag' }))

    expect(screen.getByText('This tag is already assigned to the ticket.')).toBeInTheDocument()
    expect(mockError).toHaveBeenCalledWith('This tag is already assigned to the ticket.')
  })

  it('renders clean empty state text when no tags are assigned', () => {
    ticketTagsState.data = []

    render(<TicketTagsCard ticketId="t1" />)

    expect(screen.getByText('No tags assigned to this ticket.')).toBeInTheDocument()
  })

  it('renders retryable error state when ticket tags fail to load', () => {
    ticketTagsState.isError = true

    render(<TicketTagsCard ticketId="t1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(ticketTagsState.refetch).toHaveBeenCalled()
    expect(activeTagsState.refetch).toHaveBeenCalled()
  })
})