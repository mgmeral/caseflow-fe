import { helpText, type PageHelpConfig } from './types'

export const notificationChannelsHelp: PageHelpConfig = {
  id: 'notification-channels',
  title: helpText('help.notificationChannels.title', 'Notification Channels'),
  summary: [
    helpText('help.notificationChannels.summary.1', 'Notification channels control where CaseFlow sends operational events such as ticket lifecycle changes or outbound communication signals.'),
    helpText('help.notificationChannels.summary.2', 'Channel scope matters: the wrong target can send sensitive operational noise to the wrong team or customer context.'),
  ],
  sections: {
    list: {
      title: helpText('help.notificationChannels.sections.list.title', 'Configured channels'),
      description: helpText('help.notificationChannels.sections.list.description', 'Review provider, enabled state, subscribed events, and scope before editing an existing channel.'),
    },
    form: {
      title: helpText('help.notificationChannels.sections.form.title', 'Channel setup'),
      description: helpText('help.notificationChannels.sections.form.description', 'Channel type selects the webhook style, while scope and subscribed events decide where and when notifications are sent.'),
    },
  },
  fieldHints: {
    name: helpText('help.notificationChannels.fields.name', 'Internal label only. Use a name operators can map to a real Slack or Teams destination quickly.'),
    channelType: helpText('help.notificationChannels.fields.channelType', 'Slack and Teams use different webhook endpoints. Choose the real target platform before pasting the URL.'),
    webhookUrl: helpText('help.notificationChannels.fields.webhookUrl', 'Keep this secret. The stored value is intentionally hidden after save to avoid accidental disclosure.'),
    scope: helpText('help.notificationChannels.fields.scope', 'Global covers the whole workspace. Group and Customer narrow event delivery to a smaller operational audience.'),
    scopeTarget: helpText('help.notificationChannels.fields.scopeTarget', 'Only required for Group or Customer scopes. Pick the exact target that should receive these events.'),
    enabled: helpText('help.notificationChannels.fields.enabled', 'Disable a channel to keep its configuration without sending live notifications.'),
    subscribedEvents: helpText('help.notificationChannels.fields.subscribedEvents', 'Choose only the event types that the destination really needs so channels do not become noisy or ignored.'),
  },
  recommendations: [
    {
      id: 'scope-carefully',
      title: helpText('help.notificationChannels.recommendations.scope.title', 'Start narrow when possible'),
      description: helpText('help.notificationChannels.recommendations.scope.description', 'Use Group or Customer scope if only one audience needs the events. Reserve Global for workspace-wide operational channels.'),
    },
    {
      id: 'signal-over-noise',
      title: helpText('help.notificationChannels.recommendations.signal.title', 'Keep subscribed events intentional'),
      description: helpText('help.notificationChannels.recommendations.signal.description', 'Channels with too many event types become background noise and important alerts get ignored.'),
    },
  ],
  warnings: [
    {
      id: 'wrong-target',
      title: helpText('help.notificationChannels.warnings.target.title', 'Wrong scope can leak notifications'),
      description: helpText('help.notificationChannels.warnings.target.description', 'A misplaced Group or Customer target can send operational context to the wrong audience. Verify scope before saving.'),
    },
    {
      id: 'webhook-secret',
      title: helpText('help.notificationChannels.warnings.secret.title', 'Webhook URLs are credentials'),
      description: helpText('help.notificationChannels.warnings.secret.description', 'Treat webhook URLs like secrets. Anyone with the value may be able to post into the destination channel.'),
    },
  ],
  faqs: [
    {
      id: 'global-scope',
      question: helpText('help.notificationChannels.faq.scope.question', 'What is the difference between GLOBAL and a target scope?'),
      answer: helpText('help.notificationChannels.faq.scope.answer', 'GLOBAL applies across the workspace. Group or Customer scope limits delivery to one team or one customer context.'),
    },
    {
      id: 'providers',
      question: helpText('help.notificationChannels.faq.providers.question', 'How do Slack, Teams, and webhook channels work here?'),
      answer: helpText('help.notificationChannels.faq.providers.answer', 'CaseFlow stores a provider-specific incoming webhook URL and sends subscribed event payloads to that destination when matching events occur.'),
    },
    {
      id: 'events',
      question: helpText('help.notificationChannels.faq.events.question', 'Which events send notifications?'),
      answer: helpText('help.notificationChannels.faq.events.answer', 'Only the subscribed event types selected for the channel will be delivered to that destination.'),
    },
    {
      id: 'testing',
      question: helpText('help.notificationChannels.faq.testing.question', 'What should operators verify if a channel is not behaving correctly?'),
      answer: helpText('help.notificationChannels.faq.testing.answer', 'Check the saved webhook, the selected scope, and whether the needed event types are subscribed. A correct provider with the wrong target still produces the wrong operational result.'),
    },
  ],
}
