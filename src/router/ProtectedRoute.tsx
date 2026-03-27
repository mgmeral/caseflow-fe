import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types/common.types'

interface ProtectedRouteProps {
  requiredRoles?: UserRole[]
  children?: React.ReactNode
}

export function ProtectedRoute({ requiredRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser } = useAuthStore()

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
