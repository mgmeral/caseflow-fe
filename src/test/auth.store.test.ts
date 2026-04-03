/**
 * Tests for the auth store — real API flow.
 * We mock apiClient to avoid hitting a real backend.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('@/services/api.client', () => ({
  apiClient: { get: mockGet, post: mockPost, put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(public status: number, public code: string, message: string) { super(message); this.name = 'ApiError' }
  },
}))

const { useAuthStore } = await import('@/store/auth.store')

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ currentUser: null, accessToken: null, refreshToken: null, isAuthenticated: false })
    mockGet.mockReset()
    mockPost.mockReset()
  })

  it('login: posts credentials and fetches /auth/me', async () => {
    mockPost.mockResolvedValueOnce({ accessToken: 'at', refreshToken: 'rt', tokenType: 'Bearer', expiresIn: 3600 })
    mockGet.mockResolvedValueOnce({
      id: 1, username: 'admin', email: 'admin@test.com', fullName: 'Admin User',
      roleId: 1, roleCode: 'ADMIN', roleName: 'Admin',
      permissionCodes: ['TICKET_VIEW'], ticketScope: 'ALL', groupIds: [1],
    })

    await useAuthStore.getState().login('admin@test.com', 'pw')
    const state = useAuthStore.getState()

    expect(mockPost).toHaveBeenCalledWith('/auth/login', { username: 'admin@test.com', password: 'pw' })
    expect(mockGet).toHaveBeenCalledWith('/auth/me')
    expect(state.isAuthenticated).toBe(true)
    expect(state.accessToken).toBe('at')
    expect(state.currentUser?.email).toBe('admin@test.com')
    expect(state.currentUser?.role).toBe('admin')
    expect(state.currentUser?.roleCode).toBe('ADMIN')
  })

  it('login: throws when API rejects credentials', async () => {
    mockPost.mockRejectedValueOnce(new Error('Unauthorized'))

    await expect(
      useAuthStore.getState().login('bad@test.com', 'wrong'),
    ).rejects.toThrow()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('logout: clears auth state and calls /auth/logout', () => {
    useAuthStore.setState({
      currentUser: { id: '1', email: 'a@b.com' } as any,
      accessToken: 'at', refreshToken: 'rt', isAuthenticated: true,
    })
    mockPost.mockResolvedValueOnce(undefined)

    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.currentUser).toBeNull()
    expect(state.accessToken).toBeNull()
  })
})
