import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TicketFilters } from '@/types/ticket.types'
import type { SortState } from '@/types/common.types'

interface FilterStore {
  filters: TicketFilters
  sort: SortState
  page: number
  pageSize: number
  setFilters: (filters: Partial<TicketFilters>) => void
  setSort: (sort: SortState) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  resetFilters: () => void
}

const defaultFilters: TicketFilters = {
  search: '',
  statuses: [],
  priorities: [],
  assignedUserIds: [],
  groupIds: [],
  dateFrom: null,
  dateTo: null,
  unassignedOnly: false,
  overdueOnly: false,
  openOnly: false,
  transferredOnly: false,
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      sort: { field: 'updatedAt', direction: 'desc' },
      page: 1,
      pageSize: 25,

      setFilters: (partial) =>
        set((s) => ({ filters: { ...s.filters, ...partial }, page: 1 })),

      setSort: (sort) => set({ sort, page: 1 }),

      setPage: (page) => set({ page }),

      setPageSize: (pageSize) => set({ pageSize, page: 1 }),

      resetFilters: () => set({ filters: defaultFilters, page: 1 }),
    }),
    {
      name: 'csm-filters',
      partialize: (state) => ({
        sort: state.sort,
        pageSize: state.pageSize,
      }),
    },
  ),
)

export { defaultFilters }
