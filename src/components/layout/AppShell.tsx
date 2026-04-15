import { Outlet, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastContainer } from '@/components/shared/Toast'

export function AppShell() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className={clsx(
      'flex h-screen overflow-hidden',
      isAdminRoute
        ? 'bg-[radial-gradient(circle_at_top_left,rgba(31,111,255,0.12),transparent_22%),linear-gradient(180deg,#edf3fb_0%,#dde8f5_100%)]'
        : 'bg-[radial-gradient(circle_at_top_left,rgba(31,111,255,0.09),transparent_22%),linear-gradient(180deg,#f8fbff_0%,#eef4f9_100%)]',
    )}>
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-2 pb-2 md:px-3 md:pb-3">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
