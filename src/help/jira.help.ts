import { helpText, type PageHelpConfig } from './types'

export const jiraHelp: PageHelpConfig = {
  id: 'jira',
  title: helpText('help.jira.title', 'Jira Integration'),
  summary: [
    helpText('help.jira.summary.1', 'Jira integration settings define how CaseFlow creates linked Jira issues from ticket workflows and how the application links users back into the correct Jira project.'),
    helpText('help.jira.summary.2', 'This page should make it clear which saved values control authentication, target project defaults, and connection testing.'),
  ],
  sections: {
    main: {
      title: helpText('help.jira.sections.main.title', 'Connection defaults'),
      description: helpText('help.jira.sections.main.description', 'Base URL, credentials, project key, and issue type must all point at a real Jira project that the saved user can access.'),
    },
    behavior: {
      title: helpText('help.jira.sections.behavior.title', 'Operational behavior'),
      description: helpText('help.jira.sections.behavior.description', 'Enablement and connection testing control whether ticket workflows can rely on the integration in day-to-day operations.'),
    },
  },
  fieldHints: {
    baseUrl: helpText('help.jira.fields.baseUrl', 'The Jira site URL, usually an Atlassian cloud base such as https://company.atlassian.net.'),
    authentication: helpText('help.jira.fields.authentication', 'This integration currently expects the saved authentication mode shown here.'),
    username: helpText('help.jira.fields.username', 'Usually the Jira account email associated with the API token used for issue creation.'),
    apiToken: helpText('help.jira.fields.apiToken', 'Leave blank during normal edits to preserve the stored token. Enter a new value only when rotating credentials.'),
    projectKey: helpText('help.jira.fields.projectKey', 'The Jira project key such as SUPPORT or OPS. New linked issues are created in this project.'),
    issueType: helpText('help.jira.fields.issueType', 'Must match an issue type available in the chosen Jira project, for example Task, Bug, or Story.'),
    defaultLabels: helpText('help.jira.fields.defaultLabels', 'Applied to every Jira issue created from CaseFlow. Keep labels operationally meaningful and easy to report on.'),
    appBaseUrl: helpText('help.jira.fields.appBaseUrl', 'Used when Jira issue links should bring users back into the correct CaseFlow environment.'),
    enabled: helpText('help.jira.fields.enabled', 'When disabled, the saved configuration remains stored but ticket workflows should not offer Jira issue creation as a normal path.'),
    testConnection: helpText('help.jira.fields.testConnection', 'Test Connection validates the saved backend configuration, not unsaved form edits.'),
  },
  recommendations: [
    {
      id: 'save-then-test',
      title: helpText('help.jira.recommendations.saveThenTest.title', 'Save before testing'),
      description: helpText('help.jira.recommendations.saveThenTest.description', 'If you changed credentials or project values, save first so the backend test endpoint checks the same configuration you see on screen.'),
    },
    {
      id: 'real-project',
      title: helpText('help.jira.recommendations.realProject.title', 'Use a project with stable workflow defaults'),
      description: helpText('help.jira.recommendations.realProject.description', 'Pick a project key and issue type that support your production workflow instead of temporary experimentation values.'),
    },
  ],
  warnings: [
    {
      id: 'bad-links',
      title: helpText('help.jira.warnings.appBaseUrl.title', 'Wrong app base URL creates broken return links'),
      description: helpText('help.jira.warnings.appBaseUrl.description', 'If the application base URL points to the wrong environment, Jira links back into CaseFlow can send users to a dead or incorrect instance.'),
    },
    {
      id: 'project-mismatch',
      title: helpText('help.jira.warnings.projectMismatch.title', 'Project key and issue type must agree'),
      description: helpText('help.jira.warnings.projectMismatch.description', 'A valid Jira site connection can still fail operationally if the selected issue type is not available in the target project.'),
    },
  ],
  faqs: [
    {
      id: 'project-key',
      question: helpText('help.jira.faq.projectKey.question', 'What is a project key?'),
      answer: helpText('help.jira.faq.projectKey.answer', 'It is the short Jira project identifier, such as SUPPORT, that tells CaseFlow where new issues should be created.'),
    },
    {
      id: 'issue-type',
      question: helpText('help.jira.faq.issueType.question', 'What does issue type control?'),
      answer: helpText('help.jira.faq.issueType.answer', 'Issue type decides the Jira work item kind created from CaseFlow, such as Task, Bug, Story, or another project-specific type.'),
    },
    {
      id: 'app-base-url',
      question: helpText('help.jira.faq.appBaseUrl.question', 'Why is the CaseFlow application base URL needed?'),
      answer: helpText('help.jira.faq.appBaseUrl.answer', 'It lets CaseFlow generate links from Jira back into the correct CaseFlow ticket page that operators should open.'),
    },
    {
      id: 'jira-flow',
      question: helpText('help.jira.faq.flow.question', 'How does Jira create or link flow work?'),
      answer: helpText('help.jira.faq.flow.answer', 'When a ticket requests Jira creation, CaseFlow uses the saved Jira settings to create the issue asynchronously and then records the linked result for the ticket UI.'),
    },
  ],
}
