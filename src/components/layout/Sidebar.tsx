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
  Mail,
  AtSign,
  Tags,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Avatar } from '@/components/shared/Avatar'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { usePermissions } from '@/hooks/usePermissions'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

export function Sidebar() {
  const { currentUser, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { canManageUsers, canManageRoles, canManageGroups, canManageAdminConfig, canViewAdminPool, canViewReports, canViewEmailConfig, canManageEmailConfig, canAccessEmailAdmin } = usePermissions()

  const canAccessAdminSection = canManageUsers || canManageRoles || canManageAdminConfig || canAccessEmailAdmin

  const mainNav: NavItem[] = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/tickets', icon: <Ticket size={18} />, label: 'Tickets' },
    { to: '/customers', icon: <Users size={18} />, label: 'Customers' },
  ]

  const adminNav: NavItem[] = [
    ...(canManageUsers ? [{ to: '/admin/users', icon: <UserCog size={18} />, label: 'Users' }] : []),
    ...(canManageRoles ? [{ to: '/admin/roles', icon: <Shield size={18} />, label: 'Roles' }] : []),
    ...(canManageGroups ? [{ to: '/admin/groups', icon: <UsersRound size={18} />, label: 'Groups' }] : []),
    ...(canManageUsers ? [{ to: '/admin/templates', icon: <FileText size={18} />, label: 'Templates' }] : []),
    ...(canManageAdminConfig ? [{ to: '/admin/tags', icon: <Tags size={18} />, label: 'Tag Management' }] : []),
    ...(canViewEmailConfig ? [{ to: '/admin/email/mailboxes', icon: <Mail size={18} />, label: 'Mailboxes' }] : []),
    ...(canManageEmailConfig ? [{ to: '/admin/email/customers', icon: <AtSign size={18} />, label: 'Email Settings' }] : []),
    ...(canManageUsers ? [{ to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' }] : []),
  ]

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-[#071a3d] text-slate-100 transition-all duration-200 ease-in-out flex-shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between h-24 px-3 border-b border-blue-900/70 bg-[#091f49]">
        <NavLink
          to="/dashboard"
          aria-label="Go to dashboard"
          className={clsx(
            'transition-opacity hover:opacity-90 focus:outline-none',
            sidebarCollapsed ? 'mx-auto' : 'min-w-0',
          )}
        >
          {sidebarCollapsed ? (
            <img src="/favicon-192.png" alt="CaseFlow" className="w-[2.125rem] h-[2.125rem] object-contain" />
          ) : (
            <div className="flex items-center gap-2.5">
              <img src="/favicon-192.png" alt="CaseFlow" className="w-[2.35rem] h-[2.35rem] object-contain" />
              <span className="text-[1.53rem] leading-none font-semibold tracking-tight text-white">Case</span>
              <span className="text-[1.53rem] leading-none font-semibold tracking-tight text-[#f0b323] -ml-1">Flow</span>
            </div>
          )}
        </NavLink>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-blue-800/70 transition-colors ml-auto text-blue-100"
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
                <span className="text-xs font-semibold text-blue-300/55 uppercase tracking-wider">
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

        {canAccessAdminSection && (
          <>
            {!sidebarCollapsed && (
              <div className="pt-4 pb-1 px-2">
                <span className="text-xs font-semibold text-blue-300/55 uppercase tracking-wider">
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
      <div className="border-t border-blue-900/70 p-3 bg-[#071736]">
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
                <div className="text-xs text-blue-200/80 truncate capitalize">{currentUser.roleName ?? currentUser.role}</div>
              </div>
            )}
            <button
              onClick={logout}
              className="p-1.5 rounded-md hover:bg-blue-800/70 transition-colors text-blue-200/70 hover:text-white flex-shrink-0"
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
            ? 'bg-[#0d5ac9] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]'
            : 'text-blue-100/90 hover:bg-blue-900/70 hover:text-white',
          collapsed && 'justify-center',
        )
      }
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}
