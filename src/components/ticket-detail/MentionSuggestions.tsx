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
      <div className="ui-flyout absolute bottom-full left-0 right-0 z-20 mb-1 px-3 py-2">
        <span className="text-xs text-gray-400">No matching users</span>
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="ui-flyout absolute bottom-full left-0 right-0 z-20 mb-1 max-h-48 overflow-y-auto py-1"
      role="listbox"
    >
      {users.map((user, i) => (
        <button
          key={user.id}
          type="button"
          role="option"
          aria-selected={i === activeIndex}
          className={clsx(
            'ui-flyout-item',
            i === activeIndex && 'ui-flyout-item-active',
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
