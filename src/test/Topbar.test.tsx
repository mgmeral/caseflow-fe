import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({
    currentUser: {
      fullName: 'Case Flow',
      avatarColor: '#123456',
    },
  }),
}))

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    data: [
      {
        id: 'n1',
        title: 'Ticket updated',
        message: 'TK-1 has a new reply',
        type: 'TICKET',
        isRead: false,
        createdAt: '2026-04-01T10:00:00Z',
        ticketId: 't1',
        ticketNo: 'TK-1',
      },
    ],
    isLoading: false,
  }),
  useNotificationUnreadCount: () => ({ data: 1 }),
  useMarkNotificationRead: () => ({ mutateAsync: vi.fn() }),
  useMarkAllNotificationsRead: () => ({ mutate: vi.fn(), isPending: false }),
}))

const { Topbar } = await import('@/components/layout/Topbar')

function renderTopbar() {
  const queryClient = new QueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Topbar />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Topbar', () => {
  it('renders unread notification count and opens the real notifications panel', () => {
    renderTopbar()

    const notificationsButton = screen.getByRole('button', { name: 'Notifications' })

    expect(notificationsButton).toBeEnabled()
    expect(notificationsButton).toHaveAttribute('title', 'Notifications')
    expect(screen.getByText('1')).toBeInTheDocument()

    fireEvent.click(notificationsButton)

    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Ticket updated')).toBeInTheDocument()
    expect(screen.getByText('TK-1 has a new reply')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeInTheDocument()
  })
})