import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TicketListPage } from '@/pages/TicketListPage'
import { TicketDetailPage } from '@/pages/TicketDetailPage'
import { CustomerListPage } from '@/pages/CustomerListPage'
import { CustomerDetailPage } from '@/pages/CustomerDetailPage'
import { AdminPoolPage } from '@/pages/AdminPoolPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { UserManagementPage } from '@/pages/admin/UserManagementPage'
import { RoleManagementPage } from '@/pages/admin/RoleManagementPage'
import { GroupManagementPage } from '@/pages/admin/GroupManagementPage'
import { TemplateManagementPage } from '@/pages/admin/TemplateManagementPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'tickets',
            element: <TicketListPage />,
          },
          {
            path: 'tickets/:id',
            element: <TicketDetailPage />,
          },
          {
            path: 'customers',
            element: <CustomerListPage />,
          },
          {
            path: 'customers/:id',
            element: <CustomerDetailPage />,
          },
          {
            path: 'pool',
            element: (
              <ProtectedRoute requiredRoles={['admin', 'supervisor']}>
                <AdminPoolPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'reports',
            element: (
              <ProtectedRoute requiredRoles={['admin', 'supervisor', 'trade_agent', 'operation_agent']}>
                <ReportsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'admin',
            element: <ProtectedRoute requiredRoles={['admin']} />,
            children: [
              {
                index: true,
                element: <Navigate to="/admin/users" replace />,
              },
              {
                path: 'users',
                element: <UserManagementPage />,
              },
              {
                path: 'roles',
                element: <RoleManagementPage />,
              },
              {
                path: 'groups',
                element: <GroupManagementPage />,
              },
              {
                path: 'templates',
                element: <TemplateManagementPage />,
              },
              {
                path: 'settings',
                element: <SettingsPage />,
              },
            ],
          },
          {
            path: '*',
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },
    ],
  },
])
