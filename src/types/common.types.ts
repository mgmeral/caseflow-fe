/**
 * Internal frontend role enum.
 * Real backend returns ADMIN/AGENT/VIEWER (see BackendRole in api.types.ts) which are
 * normalized to admin/agent/viewer. supervisor/trade_agent/operation_agent are mock-only.
 */
export type UserRole =
  | 'admin'
  | 'agent'           // normalized from backend AGENT
  | 'viewer'          // normalized from backend VIEWER
  | 'supervisor'      // mock-only
  | 'trade_agent'     // mock-only
  | 'operation_agent' // mock-only

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
