import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.hoisted(() => vi.fn())

const dashboardState = vi.hoisted(() => ({
  stats: {
    totalTickets: 3,
    activeTickets: 1,
    resolvedTickets: 1,
    closedTickets: 0,
    unassignedTickets: 1,
    waitingOver24h: 1,
    myActionRequired: 1,
    myActionRequiredItems: [
      {
        id: '1',
        subject: 'Assigned active ticket',
        customerName: 'Acme',
        priority: 'high',
        openDurationMinutes: 120,
        slaBreached: false,
        assignedUserId: 'u1',
        status: 'ASSIGNED',
        ticketNo: 'T-1',
        updatedAt: '2026-04-07T10:00:00Z',
        lastActionSummary: 'Updated',
      },
    ],
  },
  isLoading: false,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({ currentUser: { id: 'u1', fullName: 'Mehmet Gokhan' } }),
}))

vi.mock('@/hooks/useDashboard', () => ({
  useDashboardStats: () => ({
    data: dashboardState.stats,
    isLoading: dashboardState.isLoading,
  }),
}))

const { DashboardPage } = await import('@/pages/DashboardPage')

describe('DashboardPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('shows My Action Required and excludes resolved assigned tickets', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    const widgetHeading = screen.getByText('My Action Required')
    const widget = (widgetHeading.closest('div[class*="bg-white"]') ?? widgetHeading.parentElement?.parentElement) as HTMLElement | null

    expect(widgetHeading).toBeInTheDocument()
    expect(screen.queryByText('My Open Tickets')).not.toBeInTheDocument()
    expect(widget).toBeTruthy()
    if (!widget) throw new Error('My Action Required widget not found')
    expect(within(widget).getByText('Assigned active ticket')).toBeInTheDocument()
    expect(within(widget).queryByText('Resolved ticket')).not.toBeInTheDocument()
    expect(screen.getByText('Backend-driven operational snapshot.')).toBeInTheDocument()
    expect(screen.queryByText('Backend-driven operational snapshot for today.')).not.toBeInTheDocument()
  })

  it('navigates to tickets with a real preset when a KPI is clicked', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Waiting > 24h/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/tickets?dashboardFilter=waiting')
  })
})
