import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types/common.types'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  supervisor: 4,
  trade_agent: 3,
  operation_agent: 3,
  viewer: 1,
}

export function usePermissions() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const role = currentUser?.role ?? 'viewer'
  const level = ROLE_HIERARCHY[role]

  return {
    role,
    isAdmin: role === 'admin',
    isSupervisor: role === 'supervisor',
    isAgent: role === 'trade_agent' || role === 'operation_agent',
    isViewer: role === 'viewer',
    canManageUsers: level >= ROLE_HIERARCHY['admin'],
    canViewAdminPool: level >= ROLE_HIERARCHY['supervisor'],
    canAssignTickets: level >= ROLE_HIERARCHY['supervisor'],
    canTransferTickets: level >= ROLE_HIERARCHY['trade_agent'],
    canCloseTickets: level >= ROLE_HIERARCHY['trade_agent'],
    canAddPublicReply: level >= ROLE_HIERARCHY['trade_agent'],
    canAddInternalNote: level >= ROLE_HIERARCHY['trade_agent'],
    canChangePriority: level >= ROLE_HIERARCHY['supervisor'],
    canViewReports: level >= ROLE_HIERARCHY['trade_agent'],
    canExport: level >= ROLE_HIERARCHY['supervisor'],
  }
}
