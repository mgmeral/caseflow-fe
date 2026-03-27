import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface UIState {
  toasts: Toast[]
  sidebarCollapsed: boolean
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (value: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  sidebarCollapsed: false,

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    set((s) => ({
      toasts: [...s.toasts.slice(-2), { ...toast, id }],
    }))
    const duration = toast.duration ?? 4000
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
}))
