import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const resetFilters = vi.hoisted(() => vi.fn())
const setFilters = vi.hoisted(() => vi.fn())

vi.mock('@/store/filter.store', () => ({
  useFilterStore: () => ({
    filters: { search: 'stale', statuses: ['RESOLVED'], priorities: [], assignedUserIds: [], groupIds: [], dateFrom: null, dateTo: null, unassignedOnly: false, overdueOnly: false, openOnly: false, transferredOnly: false },
    sort: { field: 'status', direction: 'asc' },
    page: 3,
    pageSize: 50,
    setFilters,
    setSort: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    resetFilters,
  }),
}))

vi.mock('@/hooks/useTickets', () => ({
  useTickets: () => ({ data: { tickets: [], total: 0 }, isLoading: false }),
}))

vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({ users: [], groups: [] }),
}))

vi.mock('@/components/tickets/TicketFilters', () => ({
  TicketFilters: () => null,
}))

vi.mock('@/components/tickets/TicketTable', () => ({
  TicketTable: () => null,
}))

const { TicketListPage } = await import('@/pages/TicketListPage')

describe('TicketListPage', () => {
  it('resets filter state on page entry', () => {
    render(
      <MemoryRouter>
        <TicketListPage />
      </MemoryRouter>,
    )
    expect(resetFilters).toHaveBeenCalled()
  })

  it('applies dashboard preset filters from query params', () => {
    render(
      <MemoryRouter initialEntries={['/tickets?dashboardFilter=unassigned']}>
        <TicketListPage />
      </MemoryRouter>,
    )

    expect(setFilters).toHaveBeenCalledWith({ openOnly: true, unassignedOnly: true })
  })
})
