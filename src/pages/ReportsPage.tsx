import { useState } from 'react'
import { useAdminAggregateReport } from '@/hooks/useReports'
import { usePermissions } from '@/hooks/usePermissions'
import { getErrorMessage } from '@/lib/errors'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { BarChart2, ShieldOff } from 'lucide-react'
import { Button } from '@/components/shared/Button'

export function ReportsPage() {
  const { canViewReports } = usePermissions()
  const [page, setPage] = useState(0)
  const pageSize = 20
  const { data, isLoading, isError, error } = useAdminAggregateReport(page, pageSize)

  const totals = (data?.items ?? []).reduce((acc, item) => ({
    total: acc.total + item.totalCount,
    open: acc.open + item.openCount,
    resolved: acc.resolved + item.resolvedCount,
    waitingCustomer: acc.waitingCustomer + item.waitingCustomerCount,
  }), {
    total: 0,
    open: 0,
    resolved: 0,
    waitingCustomer: 0,
  })

  if (!canViewReports) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to view reports."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Reports</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Tickets" value={totals.total} isLoading={isLoading} />
        <SummaryCard label="Open / Active" value={totals.open} isLoading={isLoading} />
        <SummaryCard label="Resolved" value={totals.resolved} isLoading={isLoading} />
        <SummaryCard label="Waiting Customer" value={totals.waitingCustomer} isLoading={isLoading} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Customer Aggregate Report</h2>
        </div>

        {isLoading ? (
          <table className="w-full">
            <tbody>
              <SkeletonRow colCount={4} />
              <SkeletonRow colCount={4} />
              <SkeletonRow colCount={4} />
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Customer</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Total</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Open</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Resolved</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Waiting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm text-amber-700">{getErrorMessage(error, 'Failed to load aggregate report.')}</td>
                </tr>
              ) : (data?.items ?? []).map((item) => (
                <tr key={item.customerId}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-800">{item.customerName}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 font-medium">{item.totalCount}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{item.openCount}</td>
                  <td className="px-4 py-3 text-right text-green-600">{item.resolvedCount}</td>
                  <td className="px-4 py-3 text-right text-sky-600">{item.waitingCustomerCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0 || isLoading}>
          Previous
        </Button>
        <span className="text-sm text-gray-500">Page {page + 1}{data ? ` of ${Math.max(data.totalPages, 1)}` : ''}</span>
        <Button variant="secondary" size="sm" onClick={() => setPage((current) => current + 1)} disabled={isLoading || (data ? page + 1 >= data.totalPages : false)}>
          Next
        </Button>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, isLoading }: { label: string; value: number; isLoading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{isLoading ? '...' : value}</div>
    </div>
  )
}
