export interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  ticketId: string | null
  ticketPublicId?: string | null
  ticketNo: string | null
  groupId?: string | null
  actorUserId?: string | null
  noteId?: string | null
  readAt?: string | null
}