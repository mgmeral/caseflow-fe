import { helpText, type PageHelpConfig } from './types'

export const reportsHelp: PageHelpConfig = {
  id: 'reports',
  title: helpText('help.reports.title', 'Reports'),
  summary: [
    helpText('help.reports.summary.1', 'Reports provide aggregate visibility into ticket volume, resolution rates, and customer activity across a selected time range.'),
    helpText('help.reports.summary.2', 'The active date filter applies to all report data on this screen. When you export, the export reflects exactly the active filter range.'),
  ],
  sections: {
    dateFilter: {
      title: helpText('help.reports.sections.dateFilter.title', 'Date Filter'),
      description: helpText('help.reports.sections.dateFilter.description', 'Presets such as Last 7 days or Last 30 days are relative to today. Custom range lets you pick exact dates. All time means no date boundary.'),
    },
    aggregate: {
      title: helpText('help.reports.sections.aggregate.title', 'Customer Aggregate Table'),
      description: helpText('help.reports.sections.aggregate.description', 'Shows ticket counts per customer for the selected date range. Compare open, resolved, and waiting counts across customers at a glance.'),
    },
    export: {
      title: helpText('help.reports.sections.export.title', 'Export'),
      description: helpText('help.reports.sections.export.description', 'Export downloads exactly what you see on screen, including the active date filter. The exported label and filename reflect the current range.'),
    },
  },
  fieldHints: {
    dateFrom: helpText('help.reports.fields.dateFrom', 'Start of the reporting period. Tickets created before this date are excluded.'),
    dateTo: helpText('help.reports.fields.dateTo', 'End of the reporting period. Tickets created after this date are excluded.'),
    totalCount: helpText('help.reports.fields.totalCount', 'All tickets for this customer in the selected period, across all statuses.'),
    openCount: helpText('help.reports.fields.openCount', 'Tickets in active, non-terminal states (assigned, in progress, etc.) at the end of the period.'),
    resolvedCount: helpText('help.reports.fields.resolvedCount', 'Tickets moved to the Resolved status within the period.'),
    waitingCustomerCount: helpText('help.reports.fields.waitingCount', 'Tickets in Waiting Customer state — pending a response from the customer.'),
  },
  recommendations: [
    {
      id: 'use-presets',
      title: helpText('help.reports.recommendations.presets.title', 'Use presets for standard review cadence'),
      description: helpText('help.reports.recommendations.presets.description', 'Last 7 days is useful for weekly standups. Last 30 days works for monthly reviews. All time gives a lifetime view, but large datasets may be slow.'),
    },
    {
      id: 'export-with-filter',
      title: helpText('help.reports.recommendations.export.title', 'Always check the active filter before exporting'),
      description: helpText('help.reports.recommendations.export.description', 'The export reflects exactly the visible data. If you switched filters mid-session, confirm the range label above the table before downloading.'),
    },
  ],
  warnings: [
    {
      id: 'all-time-performance',
      title: helpText('help.reports.warnings.allTime.title', 'All time queries may be slow'),
      description: helpText('help.reports.warnings.allTime.description', 'Querying all tickets without a date boundary can take longer to load, especially if your account has a large ticket history.'),
    },
  ],
  faqs: [
    {
      id: 'filter-scope',
      question: helpText('help.reports.faq.scope.question', 'What does the date filter affect?'),
      answer: helpText('help.reports.faq.scope.answer', 'The date filter applies to ticket creation date. It filters the entire aggregate table and any summary metrics on screen.'),
    },
    {
      id: 'export-format',
      question: helpText('help.reports.faq.export.question', 'What format is the export?'),
      answer: helpText('help.reports.faq.export.answer', 'The current export generates a PDF. The exported report includes the active filter range in the header so the reader knows what period is covered.'),
    },
    {
      id: 'customer-report',
      question: helpText('help.reports.faq.customer.question', 'Where do I see reports for a single customer?'),
      answer: helpText('help.reports.faq.customer.answer', 'Go to the customer detail page and open the Report tab. That view shows the same date filter but scoped only to that customer.'),
    },
    {
      id: 'waiting-vs-open',
      question: helpText('help.reports.faq.waiting.question', 'What is the difference between Open and Waiting?'),
      answer: helpText('help.reports.faq.waiting.answer', 'Open includes all active states (assigned, in progress, etc.). Waiting Customer is a subset — tickets specifically waiting for a customer reply before the team can proceed.'),
    },
  ],
}
