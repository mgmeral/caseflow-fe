import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user.types'
import type { LoginResponse, AuthMeResponse, BackendRole } from '@/types/api.types'
import type { UserRole } from '@/types/common.types'
import { apiClient } from '@/services/api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockUsers } from '@/mock'

// ---------------------------------------------------------------------------
// Role normalizer: backend ADMIN/AGENT/VIEWER → frontend UserRole
// ---------------------------------------------------------------------------

function normalizeBackendRole(role: BackendRole | string): UserRole {
  switch (role) {
    case 'ADMIN': return 'admin'
    case 'AGENT': return 'agent'
    case 'VIEWER': return 'viewer'
    default: return 'viewer'
  }
}

function meResponseToUser(me: AuthMeResponse): User {
  // Spec: GET /auth/me returns { id, username, email, fullName, role, roleId?, roleCode?, roleName?, permissionCodes?, ticketScope?, groupIds? }
  const nameParts = (me.fullName ?? '').trim().split(' ')
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ')
  return {
    id: String(me.id),
    firstName,
    lastName,
    fullName: me.fullName ?? me.username ?? '',
    email: me.email,
    role: normalizeBackendRole(me.role),
    roleId: me.roleId != null ? String(me.roleId) : undefined,
    roleCode: me.roleCode,
    roleName: me.roleName,
    permissionCodes: me.permissionCodes ?? [],
    ticketScope: me.ticketScope ?? 'OWN',
    groupIds: me.groupIds ? me.groupIds.map(String) : [],
    groupNames: [],
    adminLevel: 0,
    isActive: true,
    lastLoginAt: null,
    openTicketCount: 0,
    avatarColor: deriveAvatarColor(String(me.id)),
  }
}

/** Deterministically derive an avatar color from a user ID so it's stable across refreshes */
function deriveAvatarColor(id: string): string {
  const palette = [
    '#4f46e5', '#0891b2', '#16a34a', '#d97706',
    '#dc2626', '#7c3aed', '#0d9488', '#c2410c',
  ]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return palette[Math.abs(hash) % palette.length]
}

// ---------------------------------------------------------------------------
// Auth state interface
// ---------------------------------------------------------------------------

interface AuthState {
  currentUser: User | null
  /** JWT access token — used in Authorization header for all API requests */
  accessToken: string | null
  /** Refresh token — held for future token-refresh support */
  refreshToken: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        if (USE_MOCKS) {
          // Mock mode: look up user by email (mock usernames are email addresses)
          await new Promise((r) => setTimeout(r, 400))
          const user = mockUsers.find(
            (u) => u.email.toLowerCase() === username.toLowerCase() && u.isActive,
          )
          if (!user) throw new Error('Invalid email or account is inactive.')
          set({ currentUser: user, accessToken: null, refreshToken: null, isAuthenticated: true })
          return
        }

        // Real API: POST /auth/login → tokens, then GET /auth/me → user
        const tokens = await apiClient.post<LoginResponse>('/auth/login', { username, password })
        // Temporarily store token so the next request can be authenticated
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
        // Fetch the authenticated user's profile
        const me = await apiClient.get<AuthMeResponse>('/auth/me')
        set({
          currentUser: meResponseToUser(me),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        })
      },

      logout: () => {
        // Call POST /api/auth/logout with the refreshToken if we have one (fire-and-forget)
        const { refreshToken } = useAuthStore.getState()
        if (!USE_MOCKS && refreshToken) {
          apiClient
            .post<void>('/auth/logout', { refreshToken })
            .catch(() => {/* ignore — clear session regardless */})
        }
        set({ currentUser: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'csm-auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

// ---------------------------------------------------------------------------
// 401 auto-logout: when the API emits 'auth:unauthorized' (expired/revoked token),
// clear the auth session. ProtectedRoute will then redirect to /login.
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout()
  })
}
