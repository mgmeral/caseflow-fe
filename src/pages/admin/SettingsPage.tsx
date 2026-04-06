import { usePermissions } from '@/hooks/usePermissions'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShieldOff } from 'lucide-react'

export function SettingsPage() {
  const { canManageUsers } = usePermissions()

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to access settings."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>
    </div>
  )
}
