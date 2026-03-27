/**
 * Tests for ProtectedRoute component behavior.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock the auth store — support both selector and no-selector call patterns
const mockAuthState = vi.hoisted(() => ({
  isAuthenticated: false,
  currentUser: null as { role: string } | null,
}))

vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector?: (s: typeof mockAuthState) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState,
}))

const { ProtectedRoute } = await import('@/router/ProtectedRoute')

function renderWithRouter(authState: Partial<typeof mockAuthState>, requiredRoles?: string[]) {
  Object.assign(mockAuthState, authState)

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute requiredRoles={requiredRoles as never}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderWithRouter({ isAuthenticated: false, currentUser: null })
    expect(screen.getByText('Login Page')).toBeTruthy()
  })

  it('renders children when authenticated and no role required', () => {
    renderWithRouter({ isAuthenticated: true, currentUser: { role: 'viewer' } })
    expect(screen.getByText('Protected Content')).toBeTruthy()
  })

  it('renders children when user has required role', () => {
    renderWithRouter(
      { isAuthenticated: true, currentUser: { role: 'admin' } },
      ['admin'],
    )
    expect(screen.getByText('Protected Content')).toBeTruthy()
  })

  it('redirects to /dashboard when user lacks required role', () => {
    renderWithRouter(
      { isAuthenticated: true, currentUser: { role: 'viewer' } },
      ['admin'],
    )
    expect(screen.getByText('Dashboard')).toBeTruthy()
  })

  it('agent role is accepted where trade_agent is listed (backend role normalization)', () => {
    renderWithRouter(
      { isAuthenticated: true, currentUser: { role: 'agent' } },
      ['trade_agent', 'operation_agent'],
    )
    expect(screen.getByText('Protected Content')).toBeTruthy()
  })

  it('trade_agent is accepted where agent is listed (backward compat)', () => {
    renderWithRouter(
      { isAuthenticated: true, currentUser: { role: 'trade_agent' } },
      ['agent'],
    )
    expect(screen.getByText('Protected Content')).toBeTruthy()
  })
})
