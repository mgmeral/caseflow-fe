import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user.types'
import type { LoginResponse, AuthMeResponse } from '@/types/api.types'
import { apiClient } from '@/services/api.client'
import { normalizeUser } from '@/services/normalizers'

function meResponseToUser(me: AuthMeResponse): User {
  return normalizeUser(me as unknown as Record<string, unknown>)
}

// ---------------------------------------------------------------------------
// Auth state interface
// ---------------------------------------------------------------------------

interface AuthState {
  currentUser: User | null
  accessToken: string | null
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
        // POST /auth/login -> tokens, then GET /auth/me -> user
        const tokens = await apiClient.post<LoginResponse>('/auth/login', { username, password })
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
        const me = await apiClient.get<AuthMeResponse>('/auth/me')
        set({
          currentUser: meResponseToUser(me),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        })
      },

      logout: () => {
        const { refreshToken } = useAuthStore.getState()
        if (refreshToken) {
          apiClient
            .post<void>('/auth/logout', { refreshToken })
            .catch(() => {/* ignore - clear session regardless */})
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
// 401 auto-logout
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout()
  })
}
