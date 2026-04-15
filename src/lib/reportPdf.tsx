import { format } from 'date-fns'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { createRoot } from 'react-dom/client'
import type { ReactNode } from 'react'
import type { ReportDateRange } from '@/lib/reportDateRange'
import type { AdminCustomerTicketAggregateItem, CustomerTicketReport } from '@/types/ticket.types'

interface AggregateTotals {
  total: number
  open: number
  resolved: number
  waitingCustomer: number
  closed: number
}

interface ExportSegment {
  label: string
  value: number
  color: string
}

interface ExportMetric {
  label: string
  value: number
  tone: string
}

type TableCellValue = ReactNode | string | number

interface AggregateExportPayload {
  rows: AdminCustomerTicketAggregateItem[]
  totals: AggregateTotals
  range: ReportDateRange
}

interface CustomerExportPayload {
  customerName: string
  report: CustomerTicketReport
  range: ReportDateRange
}

const EXPORT_WIDTH = 1122
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formatRangeLabel(range: ReportDateRange) {
  if (range.preset === 'custom' && range.dateFrom && range.dateTo) {
    return `${range.dateFrom} to ${range.dateTo}`
  }

  switch (range.preset) {
    case 'today':
      return 'Today'
    case 'last7':
      return 'Last 7 days'
    case 'last30':
      return 'Last 30 days'
    case 'thisMonth':
      return 'This month'
    case 'allTime':
      return 'All time'
    default:
      return 'Custom range'
  }
}

function buildFileName(prefix: string, range: ReportDateRange) {
  const rangePart = range.preset === 'custom' && range.dateFrom && range.dateTo
    ? `${range.dateFrom}-${range.dateTo}`
    : range.preset

  return `${slugify(prefix)}-${slugify(rangePart)}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
}

function buildAggregateSegments(totals: AggregateTotals): ExportSegment[] {
  return [
    { label: 'Open', value: totals.open, color: '#f59e0b' },
    { label: 'Resolved', value: totals.resolved, color: '#16a34a' },
    { label: 'Waiting Customer', value: totals.waitingCustomer, color: '#0ea5e9' },
    { label: 'Closed', value: totals.closed, color: '#64748b' },
  ].filter((segment) => segment.value > 0)
}

function buildCustomerSegments(report: CustomerTicketReport): ExportSegment[] {
  return [
    { label: 'Open', value: report.openCount, color: '#f59e0b' },
    { label: 'Resolved', value: report.resolvedCount, color: '#16a34a' },
    { label: 'Waiting Customer', value: report.waitingCustomerCount, color: '#0ea5e9' },
    { label: 'Closed', value: report.closedCount, color: '#64748b' },
    { label: 'Reopened', value: report.reopenedCount, color: '#8b5cf6' },
  ].filter((segment) => segment.value > 0)
}

function buildTagSegments(report: CustomerTicketReport): ExportSegment[] {
  return report.byTag
    .filter((item) => item.count > 0)
    .map((item, index) => ({
      label: item.tagName,
      value: item.count,
      color: item.tagColor ?? ['#ef4444', '#0ea5e9', '#16a34a', '#8b5cf6', '#f59e0b', '#ec4899'][index % 6],
    }))
}

function ColorSwatch({ color }: { color: string | null }) {
  return (
    <span
      style={{
        width: '10px',
        height: '10px',
        borderRadius: '999px',
        background: color ?? '#cbd5e1',
        flexShrink: 0,
        border: '1px solid rgba(148, 163, 184, 0.3)',
      }}
    />
  )
}

function LabelCell({ label, color }: { label: string; color: string | null }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      <ColorSwatch color={color} />
      <span>{label}</span>
    </div>
  )
}

async function waitForRender() {
  await new Promise((resolve) => requestAnimationFrame(resolve))
  await new Promise((resolve) => requestAnimationFrame(resolve))
}

async function renderToPdf(node: ReactNode, fileName: string) {
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-100000px'
  host.style.top = '0'
  host.style.width = `${EXPORT_WIDTH}px`
  host.style.background = '#ffffff'
  document.body.appendChild(host)

  const root = createRoot(host)

  try {
    root.render(node)
    await waitForRender()

    const target = host.firstElementChild as HTMLElement | null
    if (!target) {
      throw new Error('Report export layout could not be rendered.')
    }

    const imageData = await toPng(target, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    })

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const image = pdf.getImageProperties(imageData)
    const scaledHeight = (image.height * PAGE_WIDTH) / image.width

    let remainingHeight = scaledHeight
    let position = 0

    pdf.addImage(imageData, 'PNG', 0, position, PAGE_WIDTH, scaledHeight, undefined, 'FAST')
    remainingHeight -= PAGE_HEIGHT

    while (remainingHeight > 0) {
      position = remainingHeight - scaledHeight
      pdf.addPage()
      pdf.addImage(imageData, 'PNG', 0, position, PAGE_WIDTH, scaledHeight, undefined, 'FAST')
      remainingHeight -= PAGE_HEIGHT
    }

    pdf.save(fileName)
  } finally {
    root.unmount()
    host.remove()
  }
}

function DocumentShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div style={{ width: `${EXPORT_WIDTH}px`, background: '#ffffff', color: '#0f172a', fontFamily: 'Segoe UI, Arial, sans-serif', padding: '40px 44px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1258e3', marginBottom: '10px' }}>CaseFlow Report</div>
          <h1 style={{ margin: 0, fontSize: '30px', lineHeight: 1.15, fontWeight: 700 }}>{title}</h1>
          <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#475569' }}>{subtitle}</p>
        </div>
        <div style={{ minWidth: '220px', border: '1px solid #dbe7ff', borderRadius: '18px', padding: '16px 18px', background: 'linear-gradient(180deg,#f8fbff 0%,#eef5ff 100%)' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>Generated</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function MetricGrid({ metrics }: { metrics: ExportMetric[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '24px' }}>
      {metrics.map((metric) => (
        <div key={metric.label} style={{ border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px', background: '#ffffff' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px' }}>{metric.label}</div>
          <div style={{ fontSize: '28px', lineHeight: 1, fontWeight: 700, color: metric.tone }}>{metric.value}</div>
        </div>
      ))}
    </div>
  )
}

function PieCard({ title, segments, emptyLabel }: { title: string; segments: ExportSegment[]; emptyLabel: string }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  let current = 0
  const background = total === 0
    ? '#e2e8f0'
    : `conic-gradient(${segments.map((segment) => {
        const start = (current / total) * 100
        current += segment.value
        const end = (current / total) * 100
        return `${segment.color} ${start}% ${end}%`
      }).join(', ')})`

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '22px', padding: '22px', background: '#ffffff' }}>
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '18px' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', alignItems: 'center', gap: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '220px', height: '220px', borderRadius: '999px', background, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '34px', borderRadius: '999px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>Total</div>
                <div style={{ fontSize: '34px', fontWeight: 700, color: '#0f172a' }}>{total}</div>
              </div>
            </div>
          </div>
        </div>
        <div>
          {segments.length === 0 ? (
            <div style={{ fontSize: '14px', color: '#64748b' }}>{emptyLabel}</div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {segments.map((segment) => (
                <div key={segment.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: segment.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: '#1e293b' }}>{segment.label}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{segment.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TableCard({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<TableCellValue>> }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '22px', overflow: 'hidden', background: '#ffffff' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {headers.map((header) => (
              <th key={header} style={{ padding: '12px 16px', textAlign: header === headers[0] ? 'left' : 'right', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${title}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${title}-${rowIndex}-${cellIndex}`} style={{ padding: '13px 16px', textAlign: cellIndex === 0 ? 'left' : 'right', fontSize: '14px', color: '#1e293b', borderBottom: rowIndex === rows.length - 1 ? 'none' : '1px solid #f1f5f9' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export async function exportAdminAggregateReportPdf(payload: AggregateExportPayload) {
  const segments = buildAggregateSegments(payload.totals)

  await renderToPdf(
    <DocumentShell title="Customer Aggregate Report" subtitle={`Range: ${formatRangeLabel(payload.range)}`}>
      <MetricGrid
        metrics={[
          { label: 'Total Tickets', value: payload.totals.total, tone: '#0f172a' },
          { label: 'Open', value: payload.totals.open, tone: '#d97706' },
          { label: 'Resolved', value: payload.totals.resolved, tone: '#15803d' },
          { label: 'Waiting Customer', value: payload.totals.waitingCustomer, tone: '#0369a1' },
        ]}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '20px', marginBottom: '20px' }}>
        <PieCard title="Status Distribution" segments={segments} emptyLabel="No ticket counts are available for the selected range." />
        <TableCard
          title="Customer Totals"
          headers={['Customer', 'Total', 'Open', 'Resolved', 'Waiting']}
          rows={payload.rows.map((row) => [
            <LabelCell key={row.customerId} label={row.customerName} color={row.customerColorHex} />,
            row.totalCount,
            row.openCount,
            row.resolvedCount,
            row.waitingCustomerCount,
          ])}
        />
      </div>
    </DocumentShell>,
    buildFileName('customer-aggregate-report', payload.range),
  )
}

export async function exportCustomerReportPdf(payload: CustomerExportPayload) {
  const segments = buildCustomerSegments(payload.report)
  const tagSegments = buildTagSegments(payload.report)

  await renderToPdf(
    <DocumentShell title="Customer Report" subtitle={`${payload.customerName} | Range: ${formatRangeLabel(payload.range)}`}>
      <MetricGrid
        metrics={[
          { label: 'Total', value: payload.report.totalCount, tone: '#0f172a' },
          { label: 'Open', value: payload.report.openCount, tone: '#d97706' },
          { label: 'Resolved', value: payload.report.resolvedCount, tone: '#15803d' },
          { label: 'Waiting Customer', value: payload.report.waitingCustomerCount, tone: '#0369a1' },
        ]}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '20px', marginBottom: '20px' }}>
        <PieCard title="Status Distribution" segments={segments} emptyLabel="No customer report counts are available for the selected range." />
        <TableCard
          title="Status Summary"
          headers={['Metric', 'Count']}
          rows={[
            ['Closed', payload.report.closedCount],
            ['New', payload.report.newCount],
            ['In Progress', payload.report.inProgressCount],
            ['Reopened', payload.report.reopenedCount],
          ]}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '20px' }}>
        <PieCard title="Tag Breakdown" segments={tagSegments} emptyLabel="No tag breakdown is available for the selected range." />
        <TableCard
          title="Tag Breakdown"
          headers={['Tag', 'Count']}
          rows={payload.report.byTag.length > 0
            ? payload.report.byTag.map((item) => [<LabelCell key={item.tagId || item.tagCode} label={item.tagName} color={item.tagColor} />, item.count])
            : [['No tag breakdown returned', 0]]}
        />
      </div>
    </DocumentShell>,
    buildFileName(`${payload.customerName}-customer-report`, payload.range),
  )
}

export const reportPdfUtils = {
  buildAggregateSegments,
  buildCustomerSegments,
  buildTagSegments,
  buildFileName,
}