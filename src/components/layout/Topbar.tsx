import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Bell, CheckCheck, Circle, LogOut, UserRound } from 'lucide-react'
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
  const { currentUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const notificationsRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const notificationsQuery = useNotifications(isNotificationsOpen && !!currentUser)
  const unreadCountQuery = useNotificationUnreadCount(!!currentUser)
  const markReadMutation = useMarkNotificationRead()
  const markAllMutation = useMarkAllNotificationsRead()

  const notifications = notificationsQuery.data ?? []
  const unreadCount = unreadCountQuery.data ?? 0

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notificationId: string, isRead: boolean, ticketId: string | null) => {
    if (!isRead) {
      await markReadMutation.mutateAsync(notificationId)
    }

    setIsNotificationsOpen(false)

    if (ticketId) {
      navigate(`/tickets/${ticketId}`)
    }
  }

  return (
    <header className="relative z-40 mx-2 mt-2 flex h-14 flex-shrink-0 items-center justify-between rounded-2xl border border-white/55 bg-[linear-gradient(180deg,rgba(232,240,252,0.82)_0%,rgba(220,231,247,0.74)_48%,rgba(228,236,248,0.7)_100%)] px-4 shadow-soft backdrop-blur-md md:mx-3 md:mt-3">
      <div id="topbar-breadcrumb" />

      <div className="flex items-center gap-2 ml-auto">
        <div ref={notificationsRef} className="relative z-50">
          <button
            type="button"
            className={`relative rounded-xl border p-2 transition-all duration-200 ${
              isNotificationsOpen
                ? 'border-[#9dc0ff] bg-[linear-gradient(180deg,rgba(232,242,255,0.98)_0%,rgba(214,230,255,0.92)_100%)] text-[#1258e3] shadow-card ring-4 ring-[#1f6fff]/12'
                : 'border-transparent bg-white/45 text-slate-600 hover:border-[#b7d0ff] hover:bg-[#eef5ff] hover:text-[#1258e3] hover:shadow-soft'
            }`}
            aria-label="Notifications"
            title="Notifications"
            onClick={() => setIsNotificationsOpen((open) => !open)}
          >
            <span className="relative z-10">
              <Bell size={18} />
            </span>
            {isNotificationsOpen && <span className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_top,rgba(31,111,255,0.2),transparent_68%)]" aria-hidden="true" />}
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 z-10 min-w-[1.1rem] rounded-full bg-indigo-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 z-[70] mt-3 w-[22rem] overflow-hidden rounded-2xl border border-[#d7e6ff] bg-[linear-gradient(180deg,rgba(240,247,255,0.98)_0%,rgba(221,235,255,0.93)_100%)] shadow-[0_28px_80px_-28px_rgba(16,44,104,0.42)] ring-1 ring-white/75 backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />
              <div className="pointer-events-none absolute right-5 top-0 h-12 w-24 bg-[radial-gradient(circle_at_top,rgba(31,111,255,0.22),transparent_72%)]" />
              <div className="flex items-center justify-between border-b border-[#d9e7ff] bg-[linear-gradient(90deg,rgba(31,111,255,0.1)_0,rgba(31,111,255,0.1)_56px,transparent_56px),linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(235,244,255,0.78)_100%)] px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Notifications</div>
                  <div className="text-xs text-slate-500">{unreadCount} unread</div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-[#c6d8ff] bg-[#eef5ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1258e3] transition-colors hover:bg-[#e4efff] disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="flex w-full items-start gap-3 border-b border-white/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[linear-gradient(90deg,rgba(255,255,255,0.46)_0%,rgba(245,249,255,0.82)_100%)]"
                      onClick={() => handleNotificationClick(notification.id, notification.isRead, notification.ticketId)}
                    >
                      <span className={`pt-1 ${notification.isRead ? 'text-slate-300' : 'text-indigo-500'}`} aria-hidden="true">
                        <Circle size={10} fill={notification.isRead ? 'transparent' : 'currentColor'} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-900">
                            {notification.title || notification.type}
                          </span>
                          {notification.ticketNo && (
                            <span className="rounded-full border border-white/70 bg-white/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
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

        {currentUser && (
          <div ref={profileMenuRef} className="relative z-50">
            <button
              type="button"
              className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-all duration-200 ${
                isProfileMenuOpen
                  ? 'border-[#9dc0ff] bg-[linear-gradient(180deg,rgba(232,242,255,0.98)_0%,rgba(214,230,255,0.92)_100%)] shadow-card ring-4 ring-[#1f6fff]/12'
                  : 'border-transparent bg-white/45 hover:border-[#b7d0ff] hover:bg-[#eef5ff] hover:shadow-soft'
              }`}
              aria-label="User menu"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
            >
              <Avatar name={currentUser.fullName} color={currentUser.avatarColor} size="sm" />
              <div className="hidden text-left md:block">
                <div className="max-w-[160px] truncate text-sm font-medium text-slate-900">{currentUser.fullName}</div>
                <div className="max-w-[160px] truncate text-[11px] uppercase tracking-[0.08em] text-slate-500">{currentUser.roleName ?? currentUser.role}</div>
              </div>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 z-[70] mt-3 min-w-[14rem] overflow-hidden rounded-2xl border border-[#d7e6ff] bg-[linear-gradient(180deg,rgba(240,247,255,0.98)_0%,rgba(221,235,255,0.93)_100%)] shadow-[0_28px_80px_-28px_rgba(16,44,104,0.42)] ring-1 ring-white/75 backdrop-blur-xl">
                <div className="border-b border-white/70 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">{currentUser.fullName}</div>
                  <div className="mt-1 text-xs text-slate-500">{currentUser.email}</div>
                </div>
                <div className="p-2">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#eef5ff] hover:text-[#1258e3]"
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      navigate('/profile')
                    }}
                  >
                    <UserRound size={15} />
                    My Profile
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      logout()
                    }}
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
