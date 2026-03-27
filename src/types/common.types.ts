export type UserRole =
  | 'admin'
  | 'supervisor'
  | 'trade_agent'
  | 'operation_agent'
  | 'viewer'

export interface SelectOption {
  value: string
  label: string
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

export interface DateRange {
  from: string | null
  to: string | null
}
