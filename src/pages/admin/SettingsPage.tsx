import { Link } from 'react-router-dom'
import {
  Activity,
  AtSign,
  FileText,
  Mail,
  ShieldOff,
  Tags,
  PlugZap,
  Webhook,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { usePermissions } from '@/hooks/usePermissions'

interface SettingsLinkItem {
  to: string
  label: string
  description: string
  icon: React.ReactNode
}

interface SettingsSection {
  title: string
  description: string
  items: SettingsLinkItem[]
}

export function SettingsPage() {
  const {
    canManageAdminConfig,
    canManageEmailConfig,
    canManageIntegrationConfig,
    canManageUsers,
    canViewEmailConfig,
  } = usePermissions()

  const canAccessSettingsHub = canManageAdminConfig || canManageIntegrationConfig || canViewEmailConfig || canManageEmailConfig || canManageUsers

  const sections: SettingsSection[] = [
    {
      title: 'Configuration',
      description: 'Configure shared communication and workspace defaults used across the product.',
      items: [
        ...(canManageEmailConfig ? [{ to: '/admin/email/customers', label: 'Email Settings', description: 'Control customer-specific email behavior and routing defaults.', icon: <AtSign size={18} /> }] : []),
        ...(canManageUsers ? [{ to: '/admin/templates', label: 'Templates', description: 'Maintain shared templates for outbound communication.', icon: <FileText size={18} /> }] : []),
        ...(canManageAdminConfig ? [{ to: '/admin/tags', label: 'Tag Management', description: 'Maintain the shared tag catalog used across tickets.', icon: <Tags size={18} /> }] : []),
      ],
    },
    {
      title: 'Integrations',
      description: 'Connect CaseFlow with external systems used in the ticket workflow.',
      items: [
        ...(canViewEmailConfig ? [{ to: '/admin/email/mailboxes', label: 'Mailboxes', description: 'Manage mailbox connections and available sending identities.', icon: <Mail size={18} /> }] : []),
        ...(canManageEmailConfig ? [{ to: '/admin/ingress/events', label: 'Ingress Events', description: 'Monitor, retry, quarantine and release failed inbound processing events.', icon: <Activity size={18} /> }] : []),
        ...(canManageIntegrationConfig ? [{ to: '/admin/integrations/jira', label: 'Jira Integration', description: 'Configure Jira issue creation defaults and connection settings.', icon: <PlugZap size={18} /> }] : []),
        ...(canManageIntegrationConfig ? [{ to: '/admin/integrations/channels', label: 'Notification Channels', description: 'Route ticket events into Slack or Teams notification channels.', icon: <Webhook size={18} /> }] : []),
      ],
    },
  ].filter((section) => section.items.length > 0)

  if (!canAccessSettingsHub) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to access settings."
        />
      </div>
    )
  }

  return (
    <div className="page-shell relative overflow-visible">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(31,111,255,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_28%),linear-gradient(180deg,rgba(231,240,255,0.9)_0%,rgba(240,246,255,0.58)_58%,transparent_100%)]" />
      <div className="page-header">
        <div className="relative z-10">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle max-w-3xl">Browse admin and configuration screens grouped by user-facing purpose, so operational work stays in the main navigation and setup lives here.</p>
        </div>
      </div>

      <div className="relative z-10 rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(248,251,255,0.92)_0%,rgba(236,244,255,0.72)_100%)] p-3 shadow-soft backdrop-blur-md md:p-4">
        <div className="grid gap-5 xl:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.title}
            className="relative overflow-hidden rounded-[1.75rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,249,255,0.94)_52%,rgba(239,245,255,0.98)_100%)] p-5 shadow-[0_24px_60px_-40px_rgba(37,99,235,0.18)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.22),transparent_62%)] opacity-90" />
            <div className="relative space-y-1 border-b border-sky-100/80 pb-4">
              <h2 className="text-base font-semibold text-slate-950">{section.title}</h2>
              <p className="text-sm text-slate-500">{section.description}</p>
            </div>

            <div className="relative grid gap-3 pt-4">
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-start gap-3 rounded-2xl border border-sky-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,255,0.92)_100%)] px-4 py-3.5 transition-all duration-200 hover:-translate-y-[1px] hover:border-[#7ba8ff]/52 hover:bg-[linear-gradient(180deg,rgba(232,242,255,0.94)_0%,rgba(219,234,254,0.82)_100%)] hover:shadow-[0_18px_32px_-24px_rgba(31,111,255,0.28)]"
                >
                  <div className="mt-0.5 rounded-xl border border-sky-100/80 bg-white/90 p-2 text-sky-700 transition-all duration-200 group-hover:border-[#7ba8ff]/44 group-hover:bg-white group-hover:text-sky-800">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-slate-900">{item.label}</div>
                      <span className="rounded-full border border-sky-100/80 bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-700 transition-colors group-hover:border-[#7ba8ff]/40 group-hover:text-sky-800">
                        Page
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  </div>
                  <div className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-100/80 bg-white/90 text-sky-700 transition-all duration-200 group-hover:border-[#7ba8ff]/40 group-hover:bg-white group-hover:text-sky-800">
                    <span className="text-sm">↗</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        </div>
      </div>
    </div>
  )
}
