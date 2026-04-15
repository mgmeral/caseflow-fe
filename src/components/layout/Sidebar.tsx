import { NavLink, useNavigate } from 'react-router-dom'
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
  Shield,
  UsersRound,
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
  const navigate = useNavigate()
  const {
    canViewAdminPool,
    canViewReports,
    canManageUsers,
    canManageRoles,
    canManageGroups,
    canManageAdminConfig,
    canManageIntegrationConfig,
    canViewEmailConfig,
    canManageEmailConfig,
    canAccessEmailAdmin,
  } = usePermissions()

  const canAccessAdminSection = canManageUsers || canManageRoles || canManageGroups || canManageAdminConfig || canManageIntegrationConfig || canAccessEmailAdmin || canViewEmailConfig

  const mainNav: NavItem[] = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/tickets', icon: <Ticket size={18} />, label: 'Tickets' },
    { to: '/customers', icon: <Users size={18} />, label: 'Customers' },
    ...(canViewReports ? [{ to: '/reports', icon: <BarChart2 size={18} />, label: 'Reports' }] : []),
    ...(canViewAdminPool ? [{ to: '/pool', icon: <Inbox size={18} />, label: 'Queue' }] : []),
    ...(canManageUsers ? [{ to: '/admin/users', icon: <UserCog size={18} />, label: 'Users' }] : []),
    ...(canManageRoles ? [{ to: '/admin/roles', icon: <Shield size={18} />, label: 'Roles' }] : []),
    ...(canManageGroups ? [{ to: '/admin/groups', icon: <UsersRound size={18} />, label: 'Groups' }] : []),
    ...(canAccessAdminSection ? [{ to: '/admin', icon: <Settings size={18} />, label: 'Settings' }] : []),
  ]

  return (
    <aside
      className={clsx(
        'relative flex h-full flex-col border-r border-white/10 bg-[linear-gradient(180deg,#0b1730_0%,#10213f_48%,#0d1c36_100%)] text-slate-100 shadow-[24px_0_48px_-36px_rgba(11,19,36,0.6)] transition-all duration-200 ease-in-out flex-shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(31,111,255,0.22),transparent_58%)] opacity-90 pointer-events-none" />

      <div className="relative flex h-24 items-center justify-between border-b border-white/[0.06] px-3">
        <NavLink
          to="/dashboard"
          aria-label="Go to dashboard"
          className={clsx(
            'transition-opacity hover:opacity-90 focus:outline-none',
            sidebarCollapsed ? 'mx-auto' : 'min-w-0',
          )}
        >
          {sidebarCollapsed ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#2f7bff_0%,#1258e3_100%)] shadow-[0_14px_28px_-18px_rgba(31,111,255,0.9)] ring-1 ring-white/20">
              <img src="/favicon-192.png" alt="CaseFlow" className="h-6 w-6 object-contain" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(180deg,#2f7bff_0%,#1258e3_100%)] shadow-[0_20px_34px_-20px_rgba(31,111,255,0.92)] ring-1 ring-white/20">
                <img src="/favicon-192.png" alt="CaseFlow" className="h-6 w-6 object-contain" />
              </div>
              <div className="min-w-0">
                <div className="text-[1.05rem] font-semibold leading-none tracking-[-0.04em] text-white">CaseFlow</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200/70">Operations Desk</div>
              </div>
            </div>
          )}
        </NavLink>
        <button
          onClick={toggleSidebar}
          className="ml-auto rounded-xl border border-white/10 bg-white/[0.04] p-1.5 text-blue-100 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="relative flex-1 space-y-1.5 overflow-y-auto px-2.5 py-4">
        {mainNav.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      <div className="relative border-t border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-3">
        {currentUser && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/profile')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigate('/profile')
              }
            }}
            className={clsx(
              'rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2.5 flex items-center gap-3 transition-all duration-200 hover:border-white/18 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-[#5f98ff]/35',
              sidebarCollapsed && 'justify-center',
            )}
            aria-label="Open profile"
          >
            <Avatar name={currentUser.fullName} color={currentUser.avatarColor} size="sm" />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{currentUser.fullName}</div>
                <div className="text-[11px] text-blue-200/80 truncate uppercase tracking-[0.08em]">{currentUser.roleName ?? currentUser.role}</div>
              </div>
            )}
            <button
              onClick={(event) => {
                event.stopPropagation()
                logout()
              }}
              className="flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 text-blue-200/70 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
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
          'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium tracking-[-0.01em] transition-all duration-200',
          isActive
            ? 'bg-[linear-gradient(90deg,rgba(47,123,255,0.22)_0%,rgba(18,88,227,0.2)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_-18px_rgba(31,111,255,0.9)] ring-1 ring-[#5f98ff]/35'
            : 'text-blue-100/76 hover:bg-white/[0.07] hover:text-white',
          collapsed && 'justify-center',
        )
      }
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-current transition-all duration-200 group-hover:bg-white/[0.08]">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}

