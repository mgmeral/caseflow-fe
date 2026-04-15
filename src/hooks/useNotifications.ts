import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/services/notification.service'
import type { NotificationItem } from '@/types/notification.types'

function updateUnreadCount(current: number | undefined, delta: number) {
  return Math.max(0, (current ?? 0) + delta)
}

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll(),
    staleTime: 15_000,
    enabled,
    refetchInterval: enabled ? 15_000 : false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useNotificationUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 15_000,
    enabled,
    refetchInterval: enabled ? 10_000 : false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: (_data, id) => {
      const existing = queryClient.getQueryData<NotificationItem[]>(['notifications']) ?? []
      const target = existing.find((notification) => notification.id === id)
      queryClient.setQueryData<NotificationItem[]>(['notifications'], (current = []) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        ),
      )
      if (target && !target.isRead) {
        queryClient.setQueryData<number>(['notification-unread-count'], (current) => updateUnreadCount(current, -1))
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationItem[]>(['notifications'], (current = []) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      )
      queryClient.setQueryData<number>(['notification-unread-count'], 0)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useMarkTicketNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ticketId: string) => notificationService.markTicketNotificationsRead(ticketId),
    onSuccess: (_data, ticketId) => {
      const ticketIdString = String(ticketId)
      queryClient.setQueryData<NotificationItem[]>(['notifications'], (current = []) =>
        current.map((notification) =>
          notification.ticketId === ticketIdString ? { ...notification, isRead: true } : notification,
        ),
      )
      queryClient.setQueryData(['ticket', ticketId], (current: any) =>
        current ? { ...current, isUnread: false } : current,
      )
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })
}