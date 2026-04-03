export interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  ticketId: string | null
  ticketNo: string | null
}