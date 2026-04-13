import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) => {
        // Decode JWT payload để lấy user info
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]))
          const user: User = {
            id: payload.sub,
            userId: payload.userId || payload.sub,
            email: payload.email || '',
            roles: Array.isArray(payload.roles) ? payload.roles : [payload.roles],
            account_number: payload.account_number || '',
          }
          set({ accessToken, refreshToken, user, isAuthenticated: true })
        } catch {
          set({ accessToken, refreshToken, isAuthenticated: true })
        }
      },

      setUser: (user) => set({ user }),

      logout: () => set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'finance-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
