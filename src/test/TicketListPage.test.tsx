import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const resetFilters = vi.hoisted(() => vi.fn())
const setFilters = vi.hoisted(() => vi.fn())
const replaceFilters = vi.hoisted(() => vi.fn())
const useTicketsSpy = vi.hoisted(() => vi.fn())
const ticketTableSpy = vi.hoisted(() => vi.fn())

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
  useActiveTags: () => ({ data: [], isLoading: false, isError: false }),
}))

vi.mock('@/components/tickets/TicketFilters', () => ({
  TicketFilters: () => null,
}))

vi.mock('@/services/tag.service', () => ({
  tagService: { addTagToTicket: vi.fn() },
}))

vi.mock('@/components/tickets/TicketTable', () => ({
  TicketTable: (props: Record<string, unknown>) => {
    ticketTableSpy(props)
    return null
  },
}))

const { TicketListPage } = await import('@/pages/TicketListPage')

describe('TicketListPage', () => {
  beforeEach(() => {
    resetFilters.mockReset()
    setFilters.mockReset()
    replaceFilters.mockReset()
    useTicketsSpy.mockReset()
    ticketTableSpy.mockReset()
  })

  it('does not blindly reset filters on page entry', () => {
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TicketListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(resetFilters).not.toHaveBeenCalled()
    expect(useTicketsSpy).toHaveBeenCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ search: 'stale', statuses: ['RESOLVED'] }),
    }))
  })

  it('applies dashboard preset filters from query params', () => {
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/tickets?dashboardFilter=unassigned']}>
          <TicketListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(replaceFilters).toHaveBeenCalledWith(expect.objectContaining({ openOnly: true, unassignedOnly: true }))
  })

  it('applies staleOpen24h preset (openOnly + overdueOnly) from query params', () => {
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/tickets?dashboardFilter=staleOpen24h']}>
          <TicketListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(replaceFilters).toHaveBeenCalledWith(expect.objectContaining({ openOnly: true, overdueOnly: true }))
  })

  it('applies slaBreached preset — openOnly=true, slaState=BREACHED (exact backend contract)', () => {
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/tickets?dashboardFilter=slaBreached']}>
          <TicketListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(replaceFilters).toHaveBeenCalledWith(expect.objectContaining({ openOnly: true, slaState: 'BREACHED' }))
    // Must NOT set the At Risk predicate simultaneously
    expect(replaceFilters).not.toHaveBeenCalledWith(expect.objectContaining({ slaState: 'AT_RISK' }))
  })

  it('applies slaAtRisk preset — openOnly=true, slaState=AT_RISK (exact backend contract)', () => {
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/tickets?dashboardFilter=slaAtRisk']}>
          <TicketListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(replaceFilters).toHaveBeenCalledWith(expect.objectContaining({ openOnly: true, slaState: 'AT_RISK' }))
    // Must NOT set the Breached predicate simultaneously
    expect(replaceFilters).not.toHaveBeenCalledWith(expect.objectContaining({ slaState: 'BREACHED' }))
  })

  it('wires bulk action callbacks to TicketTable', () => {
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TicketListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(ticketTableSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedIds: expect.any(Array),
        onSelectionChange: expect.any(Function),
        onBulkAssign: expect.any(Function),
        onBulkStatusChange: expect.any(Function),
        onBulkTag: expect.any(Function),
      }),
    )
  })
})
