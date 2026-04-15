import { helpText, type PageHelpConfig } from './types'

export const mailboxesHelp: PageHelpConfig = {
  id: 'mailboxes',
  title: helpText('help.mailboxes.title', 'Mailbox Management'),
  summary: [
    helpText('help.mailboxes.summary.1', 'Mailbox settings control how CaseFlow imports inbound mail and how it sends outbound replies for a connected mailbox.'),
    helpText('help.mailboxes.summary.2', 'Save stores configuration, but activation and polling behavior can still be separate operator decisions.'),
  ],
  sections: {
    provider: {
      title: helpText('help.mailboxes.sections.provider.title', 'Provider and credentials'),
      description: helpText('help.mailboxes.sections.provider.description', 'Pick the provider first so the correct auth flow, host defaults, and required secrets are visible.'),
    },
    polling: {
      title: helpText('help.mailboxes.sections.polling.title', 'Polling and initial sync'),
      description: helpText('help.mailboxes.sections.polling.description', 'Inbound polling decides how CaseFlow checks for new mail. Initial sync decides whether old messages are scanned before steady-state polling begins.'),
    },
    advanced: {
      title: helpText('help.mailboxes.sections.advanced.title', 'Advanced connection settings'),
      description: helpText('help.mailboxes.sections.advanced.description', 'Host, port, and transport security must match your provider. Small mistakes here can break import or send behavior.'),
    },
    testing: {
      title: helpText('help.mailboxes.sections.testing.title', 'Connection testing'),
      description: helpText('help.mailboxes.sections.testing.description', 'IMAP and SMTP are tested separately. A passing inbound test does not guarantee outbound send health.'),
    },
  },
  fieldHints: {
    name: helpText('help.mailboxes.fields.name', 'Internal label shown to operators. Keep it recognizable and stable.'),
    address: helpText('help.mailboxes.fields.address', 'The real mailbox address CaseFlow connects to for send and receive operations.'),
    displayName: helpText('help.mailboxes.fields.displayName', 'Optional sender display name shown to recipients when outbound mail is sent.'),
    imapUsername: helpText('help.mailboxes.fields.imapUsername', 'Often the full mailbox address. Use the credential format expected by your mail provider.'),
    imapPassword: helpText('help.mailboxes.fields.imapPassword', 'Use provider-specific secrets such as Gmail App Passwords instead of personal sign-in passwords when required.'),
    oauthTenantId: helpText('help.mailboxes.fields.oauthTenantId', 'Microsoft tenant identifier used for Outlook / Microsoft 365 OAuth2 mailbox access.'),
    oauthClientId: helpText('help.mailboxes.fields.oauthClientId', 'The registered application identifier for the mailbox integration.'),
    oauthClientSecret: helpText('help.mailboxes.fields.oauthClientSecret', 'Stored secret for the Outlook OAuth2 application. Leave blank on edit if you are not rotating it.'),
    smtpUsername: helpText('help.mailboxes.fields.smtpUsername', 'If outbound SMTP uses a different credential than inbound IMAP, enter it here.'),
    smtpPassword: helpText('help.mailboxes.fields.smtpPassword', 'Leave blank on edit to preserve the current stored secret.'),
    imapFolder: helpText('help.mailboxes.fields.imapFolder', 'Usually INBOX. Changing this to a custom folder can limit what inbound mail is imported.'),
    pollIntervalSeconds: helpText('help.mailboxes.fields.pollIntervalSeconds', 'Shorter intervals detect new mail faster but increase connection churn and provider load.'),
    initialSyncStrategy: helpText('help.mailboxes.fields.initialSyncStrategy', 'Recommended default: New messages only. Historical scans can import old conversations and create large backlogs.'),
    pollingEnabled: helpText('help.mailboxes.fields.pollingEnabled', 'This arms polling for later activation. Save alone does not necessarily start import traffic.'),
    imapPort: helpText('help.mailboxes.fields.imapPort', 'Match the provider port with the correct IMAP SSL/TLS expectation or login attempts will fail.'),
    smtpPort: helpText('help.mailboxes.fields.smtpPort', 'Port 587 usually pairs with STARTTLS. Port 465 usually expects implicit SSL/TLS.'),
    smtpSecurity: helpText('help.mailboxes.fields.smtpSecurity', 'Avoid mixing 587 with implicit SSL or 465 with STARTTLS unless your provider explicitly requires it.'),
    testConnection: helpText('help.mailboxes.fields.testConnection', 'Run tests after saving if you changed advanced values. The test endpoint verifies saved configuration.'),
  },
  recommendations: [
    {
      id: 'safe-start',
      title: helpText('help.mailboxes.recommendations.safeStart.title', 'Recommended first rollout'),
      description: helpText('help.mailboxes.recommendations.safeStart.description', 'Save the mailbox inactive, choose New messages only, verify IMAP and SMTP separately, then activate once the test results are clean.'),
    },
    {
      id: 'provider-choice',
      title: helpText('help.mailboxes.recommendations.providerChoice.title', 'Provider selection matters'),
      description: helpText('help.mailboxes.recommendations.providerChoice.description', 'Use Gmail or Outlook presets when possible. Choose Other IMAP only when you truly need manual host, port, and auth control.'),
    },
  ],
  warnings: [
    {
      id: 'smtp-security',
      title: helpText('help.mailboxes.warnings.smtpSecurity.title', 'SMTP security mismatch'),
      description: helpText('help.mailboxes.warnings.smtpSecurity.description', '587 plus STARTTLS and 465 plus implicit SSL/TLS are common safe defaults. A wrong port and transport combination can block send or cause handshake failures.'),
    },
    {
      id: 'historical-sync',
      title: helpText('help.mailboxes.warnings.historicalSync.title', 'Historical sync risk'),
      description: helpText('help.mailboxes.warnings.historicalSync.description', 'Initial scans can ingest old mail, unrelated threads, or a large backlog before the mailbox settles into normal polling.'),
    },
  ],
  faqs: [
    {
      id: 'polling',
      question: helpText('help.mailboxes.faq.polling.question', 'What does inbound polling mean?'),
      answer: helpText('help.mailboxes.faq.polling.answer', 'Inbound polling is the recurring mailbox check CaseFlow performs to discover new emails. If polling is off, the mailbox stays configured but new inbound mail is not imported automatically.'),
    },
    {
      id: 'smtp',
      question: helpText('help.mailboxes.faq.smtp.question', 'What does outbound SMTP mean?'),
      answer: helpText('help.mailboxes.faq.smtp.answer', 'Outbound SMTP is the delivery path used when CaseFlow sends replies or notifications from this mailbox. It is independent from inbound IMAP health.'),
    },
    {
      id: 'save-vs-activate',
      question: helpText('help.mailboxes.faq.saveActivate.question', 'Is Save the same as Activate?'),
      answer: helpText('help.mailboxes.faq.saveActivate.answer', 'No. Save persists settings. Activation enables the mailbox operationally, and polling starts only when the mailbox is active and polling is armed.'),
    },
    {
      id: 'providers',
      question: helpText('help.mailboxes.faq.providers.question', 'How do Gmail, Outlook, and custom SMTP differ?'),
      answer: helpText('help.mailboxes.faq.providers.answer', 'Gmail usually relies on App Passwords, Outlook commonly uses OAuth2 with tenant and app credentials, and custom providers require manual host, port, and security alignment.'),
    },
    {
      id: 'test-connection',
      question: helpText('help.mailboxes.faq.testConnection.question', 'What does Test Connection verify?'),
      answer: helpText('help.mailboxes.faq.testConnection.answer', 'Test IMAP checks inbound login and access. Test SMTP checks outbound delivery connectivity. Run both when the mailbox will send and receive mail.'),
    },
  ],
}
