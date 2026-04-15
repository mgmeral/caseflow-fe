import { helpText, type PageHelpConfig } from './types'

export const customerEmailSettingsHelp: PageHelpConfig = {
  id: 'customer-email-settings',
  title: helpText('help.customerEmailSettings.title', 'Customer Email Settings'),
  summary: [
    helpText('help.customerEmailSettings.summary.1', 'Customer email settings decide how inbound messages are interpreted for a specific customer context and how unmatched senders should be handled.'),
    helpText('help.customerEmailSettings.summary.2', 'Routing rules are powerful but risky: a broad rule can attach inbound mail to the wrong customer or mailbox.'),
  ],
  sections: {
    settings: {
      title: helpText('help.customerEmailSettings.sections.settings.title', 'Customer-level defaults'),
      description: helpText('help.customerEmailSettings.sections.settings.description', 'These defaults apply before a more specific routing rule takes over.'),
    },
    rules: {
      title: helpText('help.customerEmailSettings.sections.rules.title', 'Routing rules'),
      description: helpText('help.customerEmailSettings.sections.rules.description', 'Rules match sender addresses or domains and direct matching mail into the expected customer mailbox flow.'),
    },
  },
  fieldHints: {
    isEnabled: helpText('help.customerEmailSettings.fields.isEnabled', 'Turn this off if inbound email should not create or attach activity for the selected customer.'),
    unknownSenderPolicy: helpText('help.customerEmailSettings.fields.unknownSenderPolicy', 'Controls what happens when incoming mail cannot be matched confidently to an approved sender.'),
    allowSubdomains: helpText('help.customerEmailSettings.fields.allowSubdomains', 'When enabled, domain-based logic can treat subdomains such as support.eu.example.com as part of the same allowed sender family.'),
    defaultGroupId: helpText('help.customerEmailSettings.fields.defaultGroupId', 'Optional fallback ownership target when inbound customer mail needs an initial group assignment.'),
    defaultPriority: helpText('help.customerEmailSettings.fields.defaultPriority', 'Optional fallback priority applied when no more specific routing behavior overrides it.'),
    senderMatchType: helpText('help.customerEmailSettings.fields.senderMatchType', 'Exact Email matches one sender only. Domain Suffix matches every sender under a domain pattern.'),
    senderMatchValue: helpText('help.customerEmailSettings.fields.senderMatchValue', 'Use the narrowest safe match. Broad domain rules are easier to misconfigure than exact addresses.'),
    recipientMailboxId: helpText('help.customerEmailSettings.fields.recipientMailboxId', 'Optional mailbox override for the rule. Leave empty to use the normal customer default handling.'),
    priority: helpText('help.customerEmailSettings.fields.priority', 'Lower numbers are usually interpreted as higher precedence. Keep the ordering intentional so a broad rule does not shadow a specific one.'),
    notes: helpText('help.customerEmailSettings.fields.notes', 'Short operator note explaining why the rule exists or what it should cover.'),
    ruleActive: helpText('help.customerEmailSettings.fields.ruleActive', 'Inactive rules stay stored for review but should not participate in routing decisions.'),
  },
  recommendations: [
    {
      id: 'specific-first',
      title: helpText('help.customerEmailSettings.recommendations.specific.title', 'Prefer exact rules for high-risk senders'),
      description: helpText('help.customerEmailSettings.recommendations.specific.description', 'Use Exact Email for shared mailboxes, finance addresses, or external partners that should never bleed into a broader domain rule.'),
    },
    {
      id: 'document-priority',
      title: helpText('help.customerEmailSettings.recommendations.priority.title', 'Keep priority ordering documented'),
      description: helpText('help.customerEmailSettings.recommendations.priority.description', 'If multiple rules could match the same sender, record why the chosen priority order is correct.'),
    },
  ],
  warnings: [
    {
      id: 'misrouting',
      title: helpText('help.customerEmailSettings.warnings.misrouting.title', 'Broad rules can misroute customer mail'),
      description: helpText('help.customerEmailSettings.warnings.misrouting.description', 'A wide domain suffix or careless allow-subdomains setting can attach inbound customer email to the wrong customer record.'),
    },
    {
      id: 'priority',
      title: helpText('help.customerEmailSettings.warnings.priority.title', 'Priority changes can alter routing unexpectedly'),
      description: helpText('help.customerEmailSettings.warnings.priority.description', 'If a broad rule outranks a narrow one, the wrong mailbox or customer association may win before operators notice.'),
    },
  ],
  faqs: [
    {
      id: 'routing-rule',
      question: helpText('help.customerEmailSettings.faq.routingRule.question', 'What does a routing rule do?'),
      answer: helpText('help.customerEmailSettings.faq.routingRule.answer', 'A routing rule matches an inbound sender and applies a mailbox or handling path for the selected customer context.'),
    },
    {
      id: 'exact-vs-domain',
      question: helpText('help.customerEmailSettings.faq.matching.question', 'What is the difference between exact email and domain suffix?'),
      answer: helpText('help.customerEmailSettings.faq.matching.answer', 'Exact Email matches one full sender address such as alerts@example.com. Domain Suffix matches many addresses under a domain pattern such as @example.com.'),
    },
    {
      id: 'subdomains',
      question: helpText('help.customerEmailSettings.faq.subdomains.question', 'What does allow subdomains mean?'),
      answer: helpText('help.customerEmailSettings.faq.subdomains.answer', 'It widens domain-based matching so subdomains can be treated as valid related senders. Use it carefully because it broadens who can match.'),
    },
    {
      id: 'priority-order',
      question: helpText('help.customerEmailSettings.faq.priority.question', 'Why does priority matter?'),
      answer: helpText('help.customerEmailSettings.faq.priority.answer', 'When more than one rule could match, priority determines which one wins first. A wrong order can silently change customer association behavior.'),
    },
  ],
}
