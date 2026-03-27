import { useUIStore } from '@/store/ui.store'
import type { ToastType } from '@/store/ui.store'

export function useToast() {
  const addToast = useUIStore((s) => s.addToast)

  const toast = (message: string, type: ToastType = 'info', duration?: number) => {
    addToast({ message, type, duration })
  }

  return {
    toast,
    success: (message: string) => toast(message, 'success'),
    error: (message: string) => toast(message, 'error'),
    warning: (message: string) => toast(message, 'warning'),
    info: (message: string) => toast(message, 'info'),
  }
}
