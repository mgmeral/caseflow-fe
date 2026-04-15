import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const resetFilters = vi.hoisted(() => vi.fn())
const setFilters = vi.hoisted(() => vi.fn())
const replaceFilters = vi.hoisted(() => vi.fn())
const useTicketsSpy = vi.hoisted(() => vi.fn())

vi.mock('@/store/filter.store', () => ({
  useFilterStore: () => ({
    filters: { search: 'stale', statuses: ['RESOLVED'], priorities: [], assignedUserIds: [], groupIds: [], tagIds: [], tagCodes: [], dateFrom: null, dateTo: null, unassignedOnly: false, overdueOnly: false, openOnly: false, transferredOnly: false },
    sort: { field: 'status', direction: 'asc' },
    page: 3,
    pageSize: 50,
    setFilters,
    replaceFilters,
    setSort: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    resetFilters,
  }),
  defaultFilters: { search: '', statuses: [], priorities: [], assignedUserIds: [], groupIds: [], tagIds: [], tagCodes: [], dateFrom: null, dateTo: null, unassignedOnly: false, overdueOnly: false, openOnly: false, transferredOnly: false },
}))

vi.mock('@/hooks/useTickets', () => ({
  useTickets: (options: unknown) => {
    useTicketsSpy(options)
    return { data: { tickets: [], total: 0 }, isLoading: false }
  },
}))

vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({ users: [], groups: [] }),
}))

vi.mock('@/hooks/useTags', () => ({
  useAllTags: () => ({ data: [], isLoading: false, isError: false }),
}))

vi.mock('@/components/tickets/TicketFilters', () => ({
  TicketFilters: () => null,
}))

vi.mock('@/components/tickets/TicketTable', () => ({
  TicketTable: () => null,
}))

const { TicketListPage } = await import('@/pages/TicketListPage')

describe('TicketListPage', () => {
  beforeEach(() => {
    resetFilters.mockReset()
    setFilters.mockReset()
    replaceFilters.mockReset()
    useTicketsSpy.mockReset()
  })

  it('does not blindly reset filters on page entry', () => {
    render(
      <MemoryRouter>
        <TicketListPage />
      </MemoryRouter>,
    )
    expect(resetFilters).not.toHaveBeenCalled()
    expect(useTicketsSpy).toHaveBeenCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ search: 'stale', statuses: ['RESOLVED'] }),
    }))
  })

  it('applies dashboard preset filters from query params', () => {
    render(
      <MemoryRouter initialEntries={['/tickets?dashboardFilter=unassigned']}>
        <TicketListPage />
      </MemoryRouter>,
    )

    expect(replaceFilters).toHaveBeenCalledWith(expect.objectContaining({ openOnly: true, unassignedOnly: true }))
  })
})
