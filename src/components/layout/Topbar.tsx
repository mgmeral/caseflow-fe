import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Bell, CheckCheck, Circle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Avatar } from '@/components/shared/Avatar'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useNotificationUnreadCount,
} from '@/hooks/useNotifications'

function formatNotificationTimestamp(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : format(date, 'MMM d, HH:mm')
}

export function Topbar() {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const notificationsQuery = useNotifications(isOpen && !!currentUser)
  const unreadCountQuery = useNotificationUnreadCount(!!currentUser)
  const markReadMutation = useMarkNotificationRead()
  const markAllMutation = useMarkAllNotificationsRead()

  const notifications = notificationsQuery.data ?? []
  const unreadCount = unreadCountQuery.data ?? 0

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notificationId: string, isRead: boolean, ticketId: string | null) => {
    if (!isRead) {
      await markReadMutation.mutateAsync(notificationId)
    }

    setIsOpen(false)

    if (ticketId) {
      navigate(`/tickets/${ticketId}`)
    }
  }

  return (
    <header className="h-14 bg-white/95 border-b border-blue-100 flex items-center justify-between px-4 flex-shrink-0 z-10">
      {/* Left: breadcrumb placeholder (pages will render their own) */}
      <div id="topbar-breadcrumb" />

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        <div ref={containerRef} className="relative">
          <button
            type="button"
            className="relative p-2 rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => setIsOpen((open) => !open)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 min-w-[1.1rem] rounded-full bg-indigo-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 z-30 mt-2 w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Notifications</div>
                  <div className="text-xs text-slate-500">{unreadCount} unread</div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={unreadCount === 0 || markAllMutation.isPending}
                  onClick={() => markAllMutation.mutate()}
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificationsQuery.isLoading ? (
                  <div className="px-4 py-6 text-sm text-slate-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">No notifications yet.</div>
                ) : (
                  notifications.slice(0, 8).map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50"
                      onClick={() => handleNotificationClick(notification.id, notification.isRead, notification.ticketId)}
                    >
                      <span className="pt-1 text-indigo-500" aria-hidden="true">
                        <Circle size={10} fill={notification.isRead ? 'transparent' : 'currentColor'} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-900">
                            {notification.title || notification.type}
                          </span>
                          {notification.ticketNo && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              {notification.ticketNo}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block whitespace-pre-wrap text-xs text-slate-600">
                          {notification.message || 'Open ticket activity.'}
                        </span>
                        <span className="mt-2 block text-[11px] text-slate-400">
                          {formatNotificationTimestamp(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-blue-100">
            <Avatar name={currentUser.fullName} color={currentUser.avatarColor} size="sm" />
            <span className="text-sm text-slate-700 font-medium hidden sm:block">
              {currentUser.fullName.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
