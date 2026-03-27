import { Avatar } from '@/components/shared/Avatar'

interface OwnerCellProps {
  userId: string | null
  userName: string | null
}

export function OwnerCell({ userId, userName }: OwnerCellProps) {
  if (!userId || !userName) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-200">
        Unassigned
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <Avatar name={userName} size="sm" />
      <span className="text-sm text-gray-700 truncate max-w-[120px]">{userName}</span>
    </span>
  )
}
