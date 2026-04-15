import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { buildReportDateRange } from '@/lib/reportDateRange'

const useAdminAggregateReportSpy = vi.hoisted(() => vi.fn())
const exportAdminAggregateReportPdf = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canViewReports: true, canExport: true }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

vi.mock('@/lib/reportPdf', () => ({
  exportAdminAggregateReportPdf,
}))

vi.mock('@/hooks/useReports', () => ({
  useAdminAggregateReport: (page: number, size: number, filters: unknown) => {
    useAdminAggregateReportSpy(page, size, filters)
    return {
      data: {
        items: [
          {
            customerId: 'c1',
            customerName: 'Acme',
            customerColorHex: '#0d5ac9',
            totalCount: 10,
            openCount: 4,
            closedCount: 2,
            resolvedCount: 4,
            waitingCustomerCount: 1,
            byTag: [],
          },
        ],
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    }
  },
}))

const { ReportsPage } = await import('@/pages/ReportsPage')

function renderPage(initialEntry = '/reports') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ReportsPage', () => {
  it('loads with the default last 30 days filter', () => {
    renderPage()

    const defaultRange = buildReportDateRange('last30')

    expect(screen.getByText('Showing last 30 days. Default stays controlled, but all-time remains available when needed.')).toBeInTheDocument()
    expect(useAdminAggregateReportSpy).toHaveBeenCalledWith(0, 20, {
      dateFrom: defaultRange.dateFrom,
      dateTo: defaultRange.dateTo,
    })
  })

  it('refetches when the preset changes', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Today' }))

    const todayRange = buildReportDateRange('today')

    await waitFor(() => {
      expect(useAdminAggregateReportSpy).toHaveBeenLastCalledWith(0, 20, {
        dateFrom: todayRange.dateFrom,
        dateTo: todayRange.dateTo,
      })
    })
  })

  it('validates custom range input before refetching', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Custom range' }))
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-04-10' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-04-01' } })

    await waitFor(() => {
      expect(screen.getByText('Start date cannot be after end date.')).toBeInTheDocument()
    })
  })

  it('allows all-time access and clears date filters', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'All time' }))

    await waitFor(() => {
      expect(screen.getByText('Showing all time. Default stays controlled, but all-time remains available when needed.')).toBeInTheDocument()
      expect(useAdminAggregateReportSpy).toHaveBeenLastCalledWith(0, 20, {
        dateFrom: null,
        dateTo: null,
      })
    })
  })

  it('renders backend customer colors in the aggregate report', () => {
    const { container } = renderPage()

    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(container.querySelector('[style*="background-color: rgb(13, 90, 201)"]')).toBeTruthy()
  })

  it('exports the current aggregate report as a pdf', async () => {
    exportAdminAggregateReportPdf.mockResolvedValue(undefined)

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))

    await waitFor(() => {
      expect(exportAdminAggregateReportPdf).toHaveBeenCalledWith(expect.objectContaining({
        rows: expect.arrayContaining([expect.objectContaining({ customerId: 'c1' })]),
        range: expect.objectContaining({ preset: 'last30' }),
      }))
    })
  })
})