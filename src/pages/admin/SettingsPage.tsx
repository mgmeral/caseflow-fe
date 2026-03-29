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

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <div className="text-sm font-semibold text-gray-800 mb-0.5">Application</div>
          <p className="text-xs text-gray-400">CSM CRM v1.0.0</p>
        </div>
        <div className="px-5 py-4">
          <div className="text-sm font-semibold text-gray-800 mb-0.5">SLA Policy</div>
          <p className="text-xs text-gray-400">Default SLA: 24 hours response time</p>
        </div>
        <div className="px-5 py-4">
          <div className="text-sm font-semibold text-gray-800 mb-0.5">Notifications</div>
          <p className="text-xs text-gray-400">Email notifications are enabled by default</p>
        </div>
      </div>
    </div>
  )
}
