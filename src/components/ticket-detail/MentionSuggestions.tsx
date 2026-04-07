import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { Avatar } from '@/components/shared/Avatar'
import type { User } from '@/types/user.types'

interface MentionSuggestionsProps {
  users: User[]
  activeIndex: number
  onSelect: (user: User) => void
}

export function MentionSuggestions({ users, activeIndex, onSelect }: MentionSuggestionsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // Keep active item visible
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (users.length === 0) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-2 px-3">
        <span className="text-xs text-gray-400">No matching users</span>
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto"
      role="listbox"
    >
      {users.map((user, i) => (
        <button
          key={user.id}
          type="button"
          role="option"
          aria-selected={i === activeIndex}
          className={clsx(
            'flex items-center gap-2.5 w-full text-left px-3 py-1.5 transition-colors',
            i === activeIndex ? 'bg-indigo-50' : 'hover:bg-gray-50',
          )}
          onMouseDown={(e) => {
            e.preventDefault() // prevent textarea blur
            onSelect(user)
          }}
        >
          <Avatar name={user.fullName} color={user.avatarColor} size="xs" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">{user.fullName}</div>
            <div className="text-[11px] text-gray-400 truncate">
              {user.email}
              {user.roleName && <span className="ml-1.5 text-gray-300">·</span>}
              {user.roleName && <span className="ml-1.5">{user.roleName}</span>}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
