import { helpText, type PageHelpConfig } from './types'

export const slaHelp: PageHelpConfig = {
  id: 'sla',
  title: helpText('help.sla.title', 'SLA & Timing'),
  summary: [
    helpText('help.sla.summary.1', 'SLA (Service Level Agreement) defines the maximum time allowed before a ticket must receive a first response or be resolved.'),
    helpText('help.sla.summary.2', 'Breached means the deadline has passed. At Risk means less than 2 hours remain. Age shows how long the ticket has been open.'),
  ],
  sections: {
    badges: {
      title: helpText('help.sla.sections.badges.title', 'SLA Badges'),
      description: helpText('help.sla.sections.badges.description', 'SLA Breached (red) — the response or resolution deadline has passed. At Risk (amber) — less than 2 hours remain. Green/gray — the ticket is within normal time.'),
    },
    timing: {
      title: helpText('help.sla.sections.timing.title', 'Ticket Age vs SLA Deadline'),
      description: helpText('help.sla.sections.timing.description', 'Age is the total time a ticket has been open. SLA Deadline is a fixed point in time set by your SLA policy. A ticket can be old without being breached if it was resolved and reopened.'),
    },
    dashboard: {
      title: helpText('help.sla.sections.dashboard.title', 'Dashboard SLA Cards'),
      description: helpText('help.sla.sections.dashboard.description', 'SLA cards appear on the dashboard only when the backend provides this data. Clicking a card takes you to the filtered ticket list.'),
    },
  },
  fieldHints: {
    slaDeadlineAt: helpText('help.sla.fields.slaDeadlineAt', 'The timestamp by which this ticket must be resolved according to its SLA policy. Set by the backend based on customer or ticket configuration.'),
    slaBreached: helpText('help.sla.fields.slaBreached', 'True when the SLA deadline has passed without a resolution. This is a backend-computed field and cannot be manually reset from this interface.'),
    openDurationMinutes: helpText('help.sla.fields.openDurationMinutes', 'Total elapsed minutes since the ticket was created. Does not reset on status changes.'),
    atRisk: helpText('help.sla.fields.atRisk', 'Tickets approaching their SLA deadline. The threshold is configurable per backend policy; the UI shows At Risk when less than 2 hours remain.'),
  },
  recommendations: [
    {
      id: 'prioritize-breached',
      title: helpText('help.sla.recommendations.prioritize.title', 'Act on breached tickets first'),
      description: helpText('help.sla.recommendations.prioritize.description', 'SLA Breached tickets are already past their deadline. Filter by breached and treat them as highest priority regardless of their ticket priority label.'),
    },
    {
      id: 'watch-at-risk',
      title: helpText('help.sla.recommendations.atRisk.title', 'Monitor At Risk before it becomes Breached'),
      description: helpText('help.sla.recommendations.atRisk.description', 'At Risk tickets still have a window. A quick status update or response can prevent a breach. Check at the start of every shift.'),
    },
  ],
  warnings: [
    {
      id: 'sla-not-configured',
      title: helpText('help.sla.warnings.notConfigured.title', 'SLA may not be configured for all tickets'),
      description: helpText('help.sla.warnings.notConfigured.description', "If a ticket shows no SLA deadline, either the customer's SLA policy is not set, or the ticket type is excluded from SLA tracking."),
    },
  ],
  faqs: [
    {
      id: 'what-is-sla',
      question: helpText('help.sla.faq.what.question', 'What does SLA mean?'),
      answer: helpText('help.sla.faq.what.answer', 'SLA stands for Service Level Agreement. It defines how quickly you must respond to or resolve a support ticket for a given customer or ticket type.'),
    },
    {
      id: 'breached-vs-atrisk',
      question: helpText('help.sla.faq.breached.question', 'What is the difference between Breached and At Risk?'),
      answer: helpText('help.sla.faq.breached.answer', 'Breached means the SLA deadline has already passed. At Risk means the deadline is approaching — typically within 2 hours — and the ticket still needs action.'),
    },
    {
      id: 'sla-reset',
      question: helpText('help.sla.faq.reset.question', 'Does the SLA reset when I change the ticket status?'),
      answer: helpText('help.sla.faq.reset.answer', 'SLA behavior depends on your backend policy configuration. In most setups, resolving or closing a ticket stops the SLA clock, but reopening it may restart the timer.'),
    },
    {
      id: 'age-vs-deadline',
      question: helpText('help.sla.faq.age.question', 'Why does a ticket show as old but not breached?'),
      answer: helpText('help.sla.faq.age.answer', 'Age is how long the ticket has been open. Breach only happens when the SLA deadline passes. A ticket without an SLA policy will show age but never breach.'),
    },
  ],
}
