import { apiClient } from './api.client'
import type {
  NotificationResponse,
  PagedResponse,
  UnreadCountResponse,
} from '@/types/api.types'
import type { NotificationItem } from '@/types/notification.types'

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeNotification(raw: NotificationResponse): NotificationItem {
  return {
    id: String(raw.id),
    title: toText(raw.title),
    message: toText(raw.message ?? raw.content),
    type: toText(raw.type, 'INFO'),
    isRead: raw.isRead === true,
    createdAt: toText(raw.createdAt, new Date().toISOString()),
    ticketId: raw.ticketId == null ? null : String(raw.ticketId),
    ticketNo: raw.ticketNo == null ? null : String(raw.ticketNo),
  }
}

export const notificationService = {
  getAll: async (): Promise<NotificationItem[]> => {
    const response = await apiClient.get<PagedResponse<NotificationResponse> | NotificationResponse[]>('/notifications')
    const items = Array.isArray(response) ? response : response.items
    return items.map(normalizeNotification)
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count')
    return response.unreadCount ?? response.count ?? 0
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`, {})
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all', {})
  },

  markTicketNotificationsRead: async (ticketId: string): Promise<void> => {
    await apiClient.post(`/tickets/${ticketId}/notifications/read`, {})
  },
}