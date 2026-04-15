import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TicketFilters } from '@/components/tickets/TicketFilters'

describe('TicketFilters', () => {
  it('pushes tag id and code together when a tag filter is selected', () => {
    const onChange = vi.fn()

    render(
      <TicketFilters
        filters={{
          search: '',
          statuses: [],
          priorities: [],
          assignedUserIds: [],
          groupIds: [],
          tagIds: [],
          tagCodes: [],
          dateFrom: null,
          dateTo: null,
          unassignedOnly: false,
          overdueOnly: false,
          openOnly: false,
          transferredOnly: false,
        }}
        onChange={onChange}
        groups={[]}
        users={[]}
        tags={[{ id: '7', code: 'VIP', name: 'VIP', color: '#ef4444', isActive: true }]}
      />,
    )

    fireEvent.change(screen.getByDisplayValue('All Tags'), { target: { value: '7' } })

    expect(onChange).toHaveBeenCalledWith({ tagIds: ['7'], tagCodes: ['VIP'] })
  })
})