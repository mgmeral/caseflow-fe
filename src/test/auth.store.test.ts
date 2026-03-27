/**
 * Tests for the auth store in mock mode.
 * These run without a backend — mock mode is implicitly active in tests
 * because VITE_USE_MOCKS is not set to 'false', and the store imports mock users.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Ensure mock mode is active for these tests
vi.mock('@/lib/env', () => ({ USE_MOCKS: true, API_URL: '' }))

// Dynamically import AFTER mocking env
const { useAuthStore } = await import('@/store/auth.store')
const { mockUsers } = await import('@/mock')

describe('useAuthStore (mock mode)', () => {
  beforeEach(() => {
    useAuthStore.setState({ currentUser: null, isAuthenticated: false })
  })

  it('logs in successfully with a known active email', async () => {
    const knownUser = mockUsers.find((u) => u.isActive)!
    await useAuthStore.getState().login(knownUser.email, 'any-password')
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.currentUser?.email.toLowerCase()).toBe(knownUser.email.toLowerCase())
  })

  it('throws for an unknown email', async () => {
    await expect(
      useAuthStore.getState().login('nobody@unknown.com', 'pw'),
    ).rejects.toThrow()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('throws for an inactive user', async () => {
    const inactiveUser = mockUsers.find((u) => !u.isActive)
    if (!inactiveUser) return // no inactive users in fixtures — skip
    await expect(
      useAuthStore.getState().login(inactiveUser.email, 'pw'),
    ).rejects.toThrow()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('logout clears auth state', async () => {
    const knownUser = mockUsers.find((u) => u.isActive)!
    await useAuthStore.getState().login(knownUser.email, '')
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.currentUser).toBeNull()
  })
})
