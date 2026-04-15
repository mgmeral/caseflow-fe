import { helpText, type PageHelpConfig } from './types'

export const tagsHelp: PageHelpConfig = {
  id: 'tags',
  title: helpText('help.tags.title', 'Tag Management'),
  summary: [
    helpText('help.tags.summary.1', 'Tags provide reusable labels for tickets so operators can classify, filter, and report on work consistently.'),
    helpText('help.tags.summary.2', 'Keep the tag code stable, the name human-readable, and the activation state intentional so historical reporting stays understandable.'),
  ],
  sections: {
    catalog: {
      title: helpText('help.tags.sections.catalog.title', 'Tag catalog'),
      description: helpText('help.tags.sections.catalog.description', 'Review active and inactive tags together so operators can understand current choices without losing historical context.'),
    },
    editor: {
      title: helpText('help.tags.sections.editor.title', 'Tag editor'),
      description: helpText('help.tags.sections.editor.description', 'Code, display name, color, and active state each serve a different operational purpose.'),
    },
  },
  fieldHints: {
    code: helpText('help.tags.fields.code', 'Stable identifier used for backend-controlled tag definitions. Avoid renaming codes casually once reporting depends on them.'),
    name: helpText('help.tags.fields.name', 'Human-readable label operators see in the UI. Keep it short and obvious.'),
    color: helpText('help.tags.fields.color', 'Color is primarily visual. It helps scanning, but the tag meaning should still be clear from the name alone.'),
    isActive: helpText('help.tags.fields.isActive', 'Inactive tags should stop appearing for new operational use while remaining visible on historical tickets and reports.'),
  },
  recommendations: [
    {
      id: 'stable-codes',
      title: helpText('help.tags.recommendations.codes.title', 'Treat codes as stable references'),
      description: helpText('help.tags.recommendations.codes.description', 'If people export, report on, or integrate with tag codes, code churn creates unnecessary operational confusion.'),
    },
    {
      id: 'meaningful-colors',
      title: helpText('help.tags.recommendations.colors.title', 'Use color only as a secondary cue'),
      description: helpText('help.tags.recommendations.colors.description', 'Choose readable colors, but keep the real meaning in the tag name because color alone is not reliable for reporting or accessibility.'),
    },
  ],
  warnings: [
    {
      id: 'inactive-history',
      title: helpText('help.tags.warnings.inactive.title', 'Inactive does not erase history'),
      description: helpText('help.tags.warnings.inactive.description', 'Turning a tag inactive should stop new use, but existing tickets and historical reports may still reference it.'),
    },
  ],
  faqs: [
    {
      id: 'code-vs-name',
      question: helpText('help.tags.faq.codeName.question', 'What is the difference between code and name?'),
      answer: helpText('help.tags.faq.codeName.answer', 'Code is the stable identifier for systems and governance. Name is the operator-facing label shown in the UI.'),
    },
    {
      id: 'color-purpose',
      question: helpText('help.tags.faq.color.question', 'Is color only visual?'),
      answer: helpText('help.tags.faq.color.answer', 'Mostly yes. Color helps quick scanning, but it should not carry the full meaning of the tag by itself.'),
    },
    {
      id: 'inactive-behavior',
      question: helpText('help.tags.faq.inactive.question', 'What happens to old tickets when a tag becomes inactive?'),
      answer: helpText('help.tags.faq.inactive.answer', 'Historical tickets keep the tag reference so operators can still understand past activity and reports.'),
    },
    {
      id: 'reporting',
      question: helpText('help.tags.faq.reporting.question', 'How do tags affect reporting?'),
      answer: helpText('help.tags.faq.reporting.answer', 'Stable tag definitions make filters, exports, and operational reporting easier to interpret over time.'),
    },
  ],
}
