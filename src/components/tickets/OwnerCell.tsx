import { Avatar } from '@/components/shared/Avatar'

interface OwnerCellProps {
  userId: string | null
  userName: string | null
}

export function OwnerCell({ userId, userName }: OwnerCellProps) {
  if (!userId || !userName) {
    return (
      <div className="min-w-0">
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-200">
          Unassigned
        </span>
        <div className="mt-1 text-[11px] text-gray-400">No current assignee</div>
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <Avatar name={userName} size="sm" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-700 truncate max-w-[140px]">{userName}</span>
        <span className="block text-[11px] text-gray-400">Current assignee</span>
      </span>
    </span>
  )
}
