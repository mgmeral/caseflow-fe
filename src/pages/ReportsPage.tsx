import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdminAggregateReport } from '@/hooks/useReports'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { exportAdminAggregateReportPdf } from '@/lib/reportPdf'
import { ReportDateFilter } from '@/components/reports/ReportDateFilter'
import {
  applyReportDateRangeSearchParams,
  formatReportDateRangeLabel,
  parseReportDateRangeSearchParams,
} from '@/lib/reportDateRange'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { HelpDrawer } from '@/components/shared/help'
import { reportsHelp } from '@/help/reports.help'
import { BarChart2, Download, HelpCircle, ShieldOff } from 'lucide-react'
import { Button } from '@/components/shared/Button'

function CustomerColorDot({ colorHex }: { colorHex: string | null }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full border border-gray-200"
      style={{ backgroundColor: colorHex ?? '#e5e7eb' }}
      aria-hidden="true"
    />
  )
}

export function ReportsPage() {
  const { canViewReports, canExport } = usePermissions()
  const { success, error: showError } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const pageSize = 20
  const dateRange = useMemo(() => parseReportDateRangeSearchParams(searchParams), [searchParams])
  const { data, isLoading, isError, error } = useAdminAggregateReport(page, pageSize, {
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  })

  const totals = (data?.items ?? []).reduce((acc, item) => ({
    total: acc.total + item.totalCount,
    newCount: acc.newCount + item.newCount,
    inProgress: acc.inProgress + item.inProgressCount,
    open: acc.open + item.openCount,
    closed: acc.closed + item.closedCount,
    resolved: acc.resolved + item.resolvedCount,
    reopened: acc.reopened + item.reopenedCount,
    waitingCustomer: acc.waitingCustomer + item.waitingCustomerCount,
  }), {
    total: 0,
    newCount: 0,
    inProgress: 0,
    open: 0,
    closed: 0,
    resolved: 0,
    reopened: 0,
    waitingCustomer: 0,
  })

  const handleExportPdf = async () => {
    if (!data || data.items.length === 0) return

    setIsExporting(true)
    try {
      await exportAdminAggregateReportPdf({
        rows: data.items,
        totals,
        range: dateRange,
      })
      success(`${formatReportDateRangeLabel(dateRange)} PDF exported.`)
    } catch (exportError) {
      showError(getErrorMessage(exportError, 'Report PDF could not be exported.'))
    } finally {
      setIsExporting(false)
    }
  }

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
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            Aggregate volume, open load, and customer breakdowns.
            {' '}<span className="text-gray-400">Showing: {formatReportDateRangeLabel(dateRange)}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<HelpCircle size={14} />}
          onClick={() => setIsHelpOpen(true)}
        >
          Help
        </Button>
      </div>

      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} config={reportsHelp} />

      <ReportDateFilter
        value={dateRange}
        onChange={(nextRange) => {
          setPage(0)
          setSearchParams(applyReportDateRangeSearchParams(searchParams, nextRange))
        }}
        actions={canExport ? (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleExportPdf}
            isLoading={isExporting}
            disabled={isLoading || isError || !data || data.items.length === 0}
            title={`Export ${formatReportDateRangeLabel(dateRange)}`}
          >
            Export PDF ({formatReportDateRangeLabel(dateRange)})
          </Button>
        ) : null}
      />

      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        <SummaryCard label="Total Tickets" value={totals.total} isLoading={isLoading} />
        <SummaryCard label="New" value={totals.newCount} isLoading={isLoading} />
        <SummaryCard label="In Progress" value={totals.inProgress} isLoading={isLoading} />
        <SummaryCard label="Open / Active" value={totals.open} isLoading={isLoading} />
        <SummaryCard label="Resolved" value={totals.resolved} isLoading={isLoading} />
        <SummaryCard label="Closed" value={totals.closed} isLoading={isLoading} />
        <SummaryCard label="Reopened" value={totals.reopened} isLoading={isLoading} />
        <SummaryCard label="Waiting Customer" value={totals.waitingCustomer} isLoading={isLoading} />
      </div>

      <div className="section-shell overflow-hidden">
        <div className="section-header gap-2">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Customer Aggregate Report</h2>
          <span className="ml-auto text-xs text-gray-400">{formatReportDateRangeLabel(dateRange)}</span>
        </div>

        {isLoading ? (
          <table className="w-full">
            <tbody>
              <SkeletonRow colCount={9} />
              <SkeletonRow colCount={9} />
              <SkeletonRow colCount={9} />
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(244,248,255,0.64)_100%)]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Customer</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Total</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">New</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">In Progress</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Open</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Resolved</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Closed</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Reopened</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Waiting</th>
              </tr>
            </thead>
            <tbody className="table-body-striped divide-y divide-white/50">
              {isError ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-sm text-amber-700">{getErrorMessage(error, 'Failed to load aggregate report.')}</td>
                </tr>
              ) : (data?.items ?? []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-sm text-slate-500">No report rows were returned for the selected date range.</td>
                </tr>
              ) : (data?.items ?? []).map((item) => (
                <tr key={item.customerId}>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <CustomerColorDot colorHex={item.customerColorHex} />
                      <span className="text-sm font-medium text-gray-800">{item.customerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 font-medium">{item.totalCount}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{item.newCount}</td>
                  <td className="px-4 py-3 text-right text-indigo-600">{item.inProgressCount}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{item.openCount}</td>
                  <td className="px-4 py-3 text-right text-green-600">{item.resolvedCount}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.closedCount}</td>
                  <td className="px-4 py-3 text-right text-orange-500">{item.reopenedCount}</td>
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
    <div className="premium-stat-card flex items-center gap-3 px-3 py-2.5">
      <div className="text-xl font-semibold tracking-[-0.03em] text-slate-950 tabular-nums">{isLoading ? '…' : value}</div>
      <div className="premium-stat-kicker text-[10px] tracking-[0.12em] leading-tight">{label}</div>
    </div>
  )
}
