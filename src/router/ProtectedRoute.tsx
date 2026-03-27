import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types/common.types'

interface ProtectedRouteProps {
  requiredRoles?: UserRole[]
  children?: React.ReactNode
}

/**
 * Checks whether the user's role satisfies the route requirement.
 * Handles backward-compat: mock roles (trade_agent, operation_agent) are treated as
 * equivalent to the real backend role (agent), so any route that allows 'agent'
 * implicitly also allows trade_agent and operation_agent, and vice-versa.
 */
function roleAllowed(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (requiredRoles.includes(userRole)) return true
  // Normalize agent equivalence
  const agentRoles: UserRole[] = ['agent', 'trade_agent', 'operation_agent']
  if (agentRoles.includes(userRole) && requiredRoles.some((r) => agentRoles.includes(r))) return true
  return false
}

export function ProtectedRoute({ requiredRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser } = useAuthStore()

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles && requiredRoles.length > 0 && !roleAllowed(currentUser.role, requiredRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
