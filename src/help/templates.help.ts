import { helpText, type PageHelpConfig } from './types'

export const templatesHelp: PageHelpConfig = {
  id: 'templates',
  title: helpText('help.templates.title', 'Mail Templates'),
  summary: [
    helpText('help.templates.summary.1', 'Mail templates provide reusable outbound content for common communication scenarios such as acknowledgements, reminders, or operational updates.'),
    helpText('help.templates.summary.2', 'Operators should be able to tell when a template is active, which scenario it belongs to, and what placeholder data it expects.'),
  ],
  sections: {
    catalog: {
      title: helpText('help.templates.sections.catalog.title', 'Template catalog'),
      description: helpText('help.templates.sections.catalog.description', 'Use the list to review naming, activation state, and content format at a glance before editing.'),
    },
    editor: {
      title: helpText('help.templates.sections.editor.title', 'Template editor'),
      description: helpText('help.templates.sections.editor.description', 'Keep code, name, subject, and content aligned so operators can safely pick the right template in the composer.'),
    },
    preview: {
      title: helpText('help.templates.sections.preview.title', 'Preview and placeholders'),
      description: helpText('help.templates.sections.preview.description', 'Use preview to validate readability and placeholder placement before enabling the template for production use.'),
    },
  },
  fieldHints: {
    name: helpText('help.templates.fields.name', 'Operator-facing display name. Keep it descriptive enough that the correct template is obvious in the picker.'),
    code: helpText('help.templates.fields.code', 'Stable identifier for backend mapping and admin review. Prefer scenario-based names rather than ad-hoc wording.'),
    usageType: helpText('help.templates.fields.usageType', 'Use this when the backend distinguishes template scenarios such as replies, reminders, or general outbound messages.'),
    subjectTemplate: helpText('help.templates.fields.subjectTemplate', 'Subject shown to recipients after placeholders are rendered. Keep it short and understandable.'),
    htmlTemplate: helpText('help.templates.fields.htmlTemplate', 'Primary rich email body. Use structured HTML for branding and formatting when the receiving client supports it.'),
    plainTextTemplate: helpText('help.templates.fields.plainTextTemplate', 'Fallback for clients or flows that downgrade HTML. Include the same meaning, even if formatting is simpler.'),
    isActive: helpText('help.templates.fields.isActive', 'Inactive templates remain stored but should not be offered for normal operational use.'),
    placeholders: helpText('help.templates.fields.placeholders', 'Placeholders insert runtime data. If a placeholder is unsupported or misspelled, the final render may look broken or incomplete.'),
  },
  recommendations: [
    {
      id: 'paired-content',
      title: helpText('help.templates.recommendations.paired.title', 'Keep HTML and text aligned'),
      description: helpText('help.templates.recommendations.paired.description', 'Write the HTML and plain text versions to communicate the same message so replies remain readable in every client.'),
    },
    {
      id: 'clear-codes',
      title: helpText('help.templates.recommendations.clearCodes.title', 'Use scenario-based codes'),
      description: helpText('help.templates.recommendations.clearCodes.description', 'Codes such as TICKET_REPLY_ACK or PAYMENT_REMINDER are easier to govern than generic names that age badly.'),
    },
  ],
  warnings: [
    {
      id: 'inactive',
      title: helpText('help.templates.warnings.inactive.title', 'Inactive templates stay in storage'),
      description: helpText('help.templates.warnings.inactive.description', 'Deactivating a template usually prevents normal selection in the composer, but it does not remove the record or its historical references.'),
    },
    {
      id: 'placeholder-quality',
      title: helpText('help.templates.warnings.placeholder.title', 'Placeholder mistakes reach the final email'),
      description: helpText('help.templates.warnings.placeholder.description', 'Unsupported or malformed placeholders can create confusing output for customers. Preview before turning a new template on.'),
    },
  ],
  faqs: [
    {
      id: 'purpose',
      question: helpText('help.templates.faq.purpose.question', 'What is a template used for?'),
      answer: helpText('help.templates.faq.purpose.answer', 'Templates provide reusable outbound content for repeatable scenarios so operators do not rewrite the same message every time.'),
    },
    {
      id: 'html-required',
      question: helpText('help.templates.faq.html.question', 'Is HTML required?'),
      answer: helpText('help.templates.faq.html.answer', 'In this screen, HTML is the primary content body expected by the backend contract. Plain text is the fallback companion, not the main rich version.'),
    },
    {
      id: 'plain-text',
      question: helpText('help.templates.faq.plainText.question', 'Why does plain text exist if HTML is present?'),
      answer: helpText('help.templates.faq.plainText.answer', 'Some clients or delivery flows render text-only content. A good plain text version keeps the message readable when HTML is stripped or hidden.'),
    },
    {
      id: 'inactive-behavior',
      question: helpText('help.templates.faq.inactive.question', 'What does an inactive template do?'),
      answer: helpText('help.templates.faq.inactive.answer', 'It stays stored for reference and possible reactivation, but it should no longer be the normal operational choice in the composer.'),
    },
    {
      id: 'composer',
      question: helpText('help.templates.faq.composer.question', 'What happens when a template is selected in the composer?'),
      answer: helpText('help.templates.faq.composer.answer', 'CaseFlow uses the template subject and body as the starting content, then renders supported placeholders with the current runtime data.'),
    },
  ],
}
