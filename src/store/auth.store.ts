import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user.types'
import { apiClient } from '@/services/api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockUsers } from '@/mock'

interface LoginResponse {
  token: string
  user: User
}

// User shape stored in local state — includes the token for auth header injection
type AuthUser = User & { token?: string }

interface AuthState {
  currentUser: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        if (USE_MOCKS) {
          // Mock mode: validate credentials strictly — no silent fallback
          await new Promise((r) => setTimeout(r, 400))
          const user = mockUsers.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.isActive,
          )
          if (!user) throw new Error('Invalid email or account is inactive.')
          set({ currentUser: user, isAuthenticated: true })
          return
        }

        // Real API login
        const data = await apiClient.post<LoginResponse>('/auth/login', {
          email,
          password,
        })
        set({
          currentUser: { ...data.user, token: data.token },
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false })
      },
    }),
    {
      name: 'csm-auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
