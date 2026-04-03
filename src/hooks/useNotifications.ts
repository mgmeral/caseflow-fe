import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/services/notification.service'

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll(),
    staleTime: 15_000,
    enabled,
  })
}

export function useNotificationUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 15_000,
    enabled,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })
}