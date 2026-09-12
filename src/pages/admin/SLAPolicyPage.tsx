import { useState } from 'react'
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react'
import { HelpDrawer } from '@/components/shared/help'
import { slaHelp } from '@/help/sla.help'
import { HelpCircle } from 'lucide-react'

export function SLAPolicyPage() {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">SLA Policies</h1>
          <p className="page-subtitle">Define response and resolution deadlines enforced across ticket groups and customer tiers.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-sky-50 hover:text-sky-700"
        >
          <HelpCircle size={13} />
          Help
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">SLA Configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">SLA policies are configured at the server level. The information below describes how SLA enforcement works in this environment.</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">How SLA Works in This Environment</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-slate-700">
              <Clock size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <span>The SLA deadline is calculated from ticket creation time according to rules configured on the backend. Each ticket displays its computed deadline in the detail view.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-700">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
              <span><strong>At Risk</strong> — shown when fewer than 2 hours remain before the SLA deadline. The threshold is set by the backend policy for the ticket's tier or group.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-700">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-red-500" />
              <span><strong>Breached</strong> — flagged by the backend once the deadline passes without a resolution event. Breached tickets surface on the dashboard and can be filtered in the ticket list.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
          <p className="text-xs text-amber-800">
            To change SLA policy parameters (targets, tiers, escalation rules), contact your system administrator or update the backend configuration directly. SLA policy management through this interface is not available in the current deployment.
          </p>
        </div>
      </div>

      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} config={slaHelp} />
    </div>
  )
}
