import { Bell } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { Avatar } from '@/components/shared/Avatar'

export function Topbar() {
  const { currentUser } = useAuthStore()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 z-10">
      {/* Left: breadcrumb placeholder (pages will render their own) */}
      <div id="topbar-breadcrumb" />

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell (static indicator) */}
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User avatar */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <Avatar name={currentUser.fullName} color={currentUser.avatarColor} size="sm" />
            <span className="text-sm text-gray-700 font-medium hidden sm:block">
              {currentUser.fullName.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
