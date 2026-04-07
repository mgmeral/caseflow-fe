import { Link } from 'react-router-dom'
import {
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
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="max-w-3xl text-sm text-gray-500">Browse admin and configuration screens grouped by user-facing purpose, so operational work stays in the main navigation and setup lives here.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="rounded-xl border border-gray-200/60 bg-white shadow-soft p-5 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
              <p className="text-sm text-gray-500">{section.description}</p>
            </div>

            <div className="grid gap-3">
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-start gap-3 rounded-xl border border-gray-200/60 px-4 py-3 transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-soft"
                >
                  <div className="mt-0.5 rounded-xl bg-gray-50 p-2 text-gray-600 transition-colors group-hover:bg-indigo-100/70 group-hover:text-indigo-700">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 group-hover:text-blue-800">{item.label}</div>
                    <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
