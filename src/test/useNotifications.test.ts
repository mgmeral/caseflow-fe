import { describe, expect, it, vi } from 'vitest'

const useQuerySpy = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => {
    useQuerySpy(options)
    return { data: undefined }
  },
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}))

vi.mock('@/services/notification.service', () => ({
  notificationService: {
    getAll: vi.fn(),
    getUnreadCount: vi.fn(),
  },
}))

const { useNotifications, useNotificationUnreadCount } = await import('@/hooks/useNotifications')

describe('useNotifications polling', () => {
  it('configures live refetching for notifications and unread count queries', () => {
    useNotifications(true)
    useNotificationUnreadCount(true)

    expect(useQuerySpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }))
    expect(useQuerySpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }))
  })
})