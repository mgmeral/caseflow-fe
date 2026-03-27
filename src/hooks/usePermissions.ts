import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types/common.types'

/**
 * Role hierarchy for capability checks.
 *
 * Real backend roles: admin (5), agent (3), viewer (1).
 * Mock-only roles:    supervisor (4), trade_agent (3), operation_agent (3).
 *
 * Capability thresholds use explicit numeric levels — not role names — so real
 * mode does not depend on mock-only role constants.
 *   level 5 = admin only (real mode)
 *   level 4 = admin + supervisor (mock mode adds supervisor; real mode: admin only)
 *   level 3 = agent and above
 *   level 1 = viewer and above (everyone)
 */
const ROLE_LEVEL: Record<UserRole, number> = {
  admin: 5,
  supervisor: 4,      // mock-only
  trade_agent: 3,     // mock-only
  operation_agent: 3, // mock-only
  agent: 3,
  viewer: 1,
}

export function usePermissions() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const role = currentUser?.role ?? 'viewer'
  const level = ROLE_LEVEL[role] ?? 1

  return {
    role,
    isAdmin: role === 'admin',
    isSupervisor: role === 'supervisor',
    /** true for agent, trade_agent, and operation_agent */
    isAgent: role === 'agent' || role === 'trade_agent' || role === 'operation_agent',
    isViewer: role === 'viewer',
    // Capabilities — thresholds use explicit levels, not role-name lookups
    canManageUsers:     level >= 5,  // admin only
    canViewAdminPool:   level >= 4,  // admin + supervisor (real mode: admin only)
    canAssignTickets:   level >= 4,  // admin + supervisor (real mode: admin only)
    canTransferTickets: level >= 3,  // agent and above
    canCloseTickets:    level >= 3,  // agent and above
    canAddPublicReply:  level >= 3,  // agent and above
    canAddInternalNote: level >= 3,  // agent and above
    canChangePriority:  level >= 4,  // admin + supervisor (real mode: admin only)
    canViewReports:     level >= 3,  // agent and above
    canExport:          level >= 4,  // admin + supervisor (real mode: admin only)
  }
}
