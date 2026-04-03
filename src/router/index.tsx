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
import { MailboxManagementPage } from '@/pages/admin/MailboxManagementPage'
import { CustomerEmailSettingsPage } from '@/pages/admin/CustomerEmailSettingsPage'
import { IngressEventsPage } from '@/pages/admin/IngressEventsPage'

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
              <ProtectedRoute requiredPermissions={['ADMIN_POOL_VIEW']}>
                <AdminPoolPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'reports',
            element: (
              <ProtectedRoute requiredPermissions={['REPORT_VIEW']}>
                <ReportsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'admin',
            element: <ProtectedRoute requiredPermissions={['USER_MANAGE', 'ROLE_MANAGE', 'GROUP_MANAGE', 'ADMIN_CONFIG', 'EMAIL_CONFIG_VIEW', 'EMAIL_CONFIG_MANAGE', 'EMAIL_OPERATIONS_VIEW', 'EMAIL_OPERATIONS_MANAGE']} />,
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
              {
                path: 'email/mailboxes',
                element: <MailboxManagementPage />,
              },
              {
                path: 'email/customers',
                element: <CustomerEmailSettingsPage />,
              },
              {
                path: 'email/ingress-events',
                element: <IngressEventsPage />,
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
