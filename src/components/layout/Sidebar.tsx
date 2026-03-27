import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Inbox,
  UserCog,
  UsersRound,
  Shield,
  FileText,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Avatar } from '@/components/shared/Avatar'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { usePermissions } from '@/hooks/usePermissions'
import { USE_MOCKS } from '@/lib/env'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

export function Sidebar() {
  const { currentUser, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { isAdmin, canViewAdminPool, canViewReports } = usePermissions()

  const mainNav: NavItem[] = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/tickets', icon: <Ticket size={18} />, label: 'Tickets' },
    { to: '/customers', icon: <Users size={18} />, label: 'Customers' },
  ]

  const adminNav: NavItem[] = [
    { to: '/admin/users',     icon: <UserCog size={18} />,    label: 'Users' },
    { to: '/admin/roles',     icon: <Shield size={18} />,     label: 'Roles' },
    { to: '/admin/groups',    icon: <UsersRound size={18} />, label: 'Groups' },
    // Templates are mock-only — only show the link when mock mode is active
    ...(USE_MOCKS ? [{ to: '/admin/templates', icon: <FileText size={18} />, label: 'Templates' }] : []),
    { to: '/admin/settings',  icon: <Settings size={18} />,   label: 'Settings' },
  ]

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-gray-900 text-gray-100 transition-all duration-200 ease-in-out flex-shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-gray-700">
        {!sidebarCollapsed && (
          <span className="text-base font-bold text-white tracking-wide">CSM CRM</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-gray-700 transition-colors ml-auto"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-1 px-2">
        {mainNav.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={sidebarCollapsed} />
        ))}

        {(canViewAdminPool || canViewReports) && (
          <>
            {!sidebarCollapsed && (
              <div className="pt-4 pb-1 px-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Management
                </span>
              </div>
            )}
            {canViewAdminPool && (
              <SidebarLink
                item={{ to: '/pool', icon: <Inbox size={18} />, label: 'Admin Pool' }}
                collapsed={sidebarCollapsed}
              />
            )}
            {canViewReports && (
              <SidebarLink
                item={{ to: '/reports', icon: <BarChart2 size={18} />, label: 'Reports' }}
                collapsed={sidebarCollapsed}
              />
            )}
          </>
        )}

        {isAdmin && (
          <>
            {!sidebarCollapsed && (
              <div className="pt-4 pb-1 px-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin
                </span>
              </div>
            )}
            {adminNav.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={sidebarCollapsed} />
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-700 p-3">
        {currentUser && (
          <div
            className={clsx(
              'flex items-center gap-3',
              sidebarCollapsed && 'justify-center',
            )}
          >
            <Avatar name={currentUser.fullName} color={currentUser.avatarColor} size="sm" />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{currentUser.fullName}</div>
                <div className="text-xs text-gray-400 truncate capitalize">{currentUser.role}</div>
              </div>
            )}
            <button
              onClick={logout}
              className="p-1.5 rounded-md hover:bg-gray-700 transition-colors text-gray-400 hover:text-white flex-shrink-0"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors w-full',
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white',
          collapsed && 'justify-center',
        )
      }
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}
