import type {
  CreateMailboxRequest,
  InitialSyncStrategy,
  MailProvider,
  MailboxAuthType,
  MailboxSourceType,
  InboundMode,
  OutboundMode,
} from '@/types/api.types'
import type { Mailbox } from '@/types/email.types'
import { normalizeInitialSyncStrategy } from '@/services/email-platform.normalizers'

export type MailboxFormAuthType = 'PASSWORD' | 'OAUTH2'

export interface MailboxFormState {
  name: string
  address: string
  displayName: string
  mailProvider: MailProvider
  authType: MailboxFormAuthType
  providerType: MailboxSourceType
  inboundMode: InboundMode
  outboundMode: OutboundMode
  imapHost: string
  imapPort: string
  imapUsername: string
  imapPassword: string
  imapFolder: string
  imapUseSsl: boolean
  pollingEnabled: boolean
  pollIntervalSeconds: string
  initialSyncStrategy: InitialSyncStrategy
  smtpHost: string
  smtpPort: string
  smtpUsername: string
  smtpPassword: string
  smtpUseSsl: boolean
  smtpStarttls: boolean
  oauthTenantId: string
  oauthClientId: string
  oauthClientSecret: string
  defaultGroupId: string
  defaultPriority: string
}

export type MailboxFormMode = 'create' | 'edit'

export interface MailboxFormValidationResult {
  name?: string
  address?: string
  imapHost?: string
  imapPort?: string
  imapUsername?: string
  imapPassword?: string
  imapFolder?: string
  oauthTenantId?: string
  oauthClientId?: string
  oauthClientSecret?: string
}

const GMAIL_PRESET = {
  providerType: 'IMAP',
  inboundMode: 'POLLING',
  outboundMode: 'SMTP',
  imapHost: 'imap.gmail.com',
  imapPort: '993',
  imapUseSsl: true,
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  smtpStarttls: true,
  smtpUseSsl: true,
} as const satisfies Partial<MailboxFormState>

const OUTLOOK_PRESET = {
  providerType: 'IMAP',
  inboundMode: 'POLLING',
  outboundMode: 'SMTP',
  imapHost: 'outlook.office365.com',
  imapPort: '993',
  imapUseSsl: true,
  smtpHost: 'smtp-mail.outlook.com',
  smtpPort: '587',
  smtpStarttls: true,
  smtpUseSsl: true,
} as const satisfies Partial<MailboxFormState>

export const EMPTY_FORM: MailboxFormState = {
  name: '',
  address: '',
  displayName: '',
  mailProvider: 'OTHER',
  authType: 'PASSWORD',
  providerType: 'IMAP',
  inboundMode: 'POLLING',
  outboundMode: 'SMTP',
  imapHost: '',
  imapPort: '',
  imapUsername: '',
  imapPassword: '',
  imapFolder: 'INBOX',
  imapUseSsl: true,
  pollingEnabled: true,
  pollIntervalSeconds: '60',
  initialSyncStrategy: 'NEW_MESSAGES_ONLY',
  smtpHost: '',
  smtpPort: '',
  smtpUsername: '',
  smtpPassword: '',
  smtpUseSsl: true,
  smtpStarttls: false,
  oauthTenantId: '',
  oauthClientId: '',
  oauthClientSecret: '',
  defaultGroupId: '',
  defaultPriority: '',
}

function normalizeFormAuthType(value: MailboxAuthType | null | undefined): MailboxFormAuthType {
  if (value === 'OAUTH2') return 'OAUTH2'
  return 'PASSWORD'
}

function inferMailProviderFromMailbox(mailbox: Pick<Mailbox, 'mailProvider' | 'authType' | 'imapHost' | 'smtpHost' | 'oauthTenantId' | 'oauthClientId'>): MailProvider {
  if (mailbox.mailProvider) return mailbox.mailProvider

  const imapHost = mailbox.imapHost?.toLowerCase() ?? ''
  const smtpHost = mailbox.smtpHost?.toLowerCase() ?? ''

  if (
    mailbox.authType === 'OAUTH2'
    || Boolean(mailbox.oauthTenantId)
    || Boolean(mailbox.oauthClientId)
    || imapHost.includes('outlook.office365.com')
    || smtpHost.includes('smtp.office365.com')
  ) {
    return 'OUTLOOK'
  }

  if (imapHost.includes('gmail.com') || smtpHost.includes('gmail.com')) {
    return 'GMAIL'
  }

  return 'OTHER'
}

function withProviderPreset(base: MailboxFormState, provider: MailProvider): MailboxFormState {
  if (provider === 'GMAIL') {
    return {
      ...base,
      mailProvider: 'GMAIL',
      authType: 'PASSWORD',
      ...GMAIL_PRESET,
      imapUsername: base.imapUsername || base.address,
      smtpUsername: base.smtpUsername || base.address,
      imapPassword: '',
      smtpPassword: '',
      oauthTenantId: '',
      oauthClientId: '',
      oauthClientSecret: '',
    }
  }

  if (provider === 'OUTLOOK') {
    return {
      ...base,
      mailProvider: 'OUTLOOK',
      authType: 'OAUTH2',
      ...OUTLOOK_PRESET,
      imapUsername: base.imapUsername || base.address,
      smtpUsername: base.smtpUsername || base.address,
      imapPassword: '',
      smtpPassword: '',
      oauthTenantId: base.oauthTenantId,
      oauthClientId: base.oauthClientId,
      oauthClientSecret: '',
    }
  }

  return {
    ...base,
    mailProvider: 'OTHER',
    authType: base.authType === 'OAUTH2' ? 'OAUTH2' : 'PASSWORD',
    providerType: 'IMAP',
    inboundMode: 'POLLING',
    outboundMode: 'SMTP',
    imapHost: '',
    imapPort: '',
    imapUseSsl: true,
    smtpHost: '',
    smtpPort: '',
    smtpUseSsl: true,
    smtpStarttls: false,
    imapPassword: '',
    smtpPassword: '',
    oauthTenantId: '',
    oauthClientId: '',
    oauthClientSecret: '',
  }
}

export function applyProviderSelection(form: MailboxFormState, provider: MailProvider): MailboxFormState {
  return withProviderPreset(form, provider)
}

export function applyAuthTypeSelection(form: MailboxFormState, authType: MailboxFormAuthType): MailboxFormState {
  if (authType === 'OAUTH2') {
    return {
      ...form,
      authType: 'OAUTH2',
      imapPassword: '',
      smtpPassword: '',
    }
  }

  return {
    ...form,
    authType: 'PASSWORD',
    oauthTenantId: '',
    oauthClientId: '',
    oauthClientSecret: '',
  }
}

export function createMailboxFormState(mailbox?: Mailbox | null): MailboxFormState {
  if (!mailbox) return EMPTY_FORM

  const mailProvider = inferMailProviderFromMailbox(mailbox)

  return {
    name: mailbox.name,
    address: mailbox.address,
    displayName: mailbox.displayName ?? '',
    mailProvider,
    authType: normalizeFormAuthType(mailbox.authType),
    providerType: mailbox.providerType ?? 'IMAP',
    inboundMode: mailbox.inboundMode ?? 'POLLING',
    outboundMode: mailbox.outboundMode ?? 'SMTP',
    imapHost: mailbox.imapHost ?? '',
    imapPort: mailbox.imapPort != null ? String(mailbox.imapPort) : '',
    imapUsername: mailbox.imapUsername ?? '',
    imapPassword: '',
    imapFolder: mailbox.imapFolder ?? 'INBOX',
    imapUseSsl: mailbox.imapUseSsl ?? true,
    pollingEnabled: mailbox.pollingEnabled,
    pollIntervalSeconds: String(mailbox.pollIntervalSeconds ?? 60),
    initialSyncStrategy: normalizeInitialSyncStrategy(mailbox.initialSyncStrategy) ?? 'NEW_MESSAGES_ONLY',
    smtpHost: mailbox.smtpHost ?? '',
    smtpPort: mailbox.smtpPort != null ? String(mailbox.smtpPort) : '',
    smtpUsername: mailbox.smtpUsername ?? '',
    smtpPassword: '',
    smtpUseSsl: mailbox.smtpUseSsl ?? true,
    smtpStarttls: mailbox.smtpStarttls ?? Boolean(mailbox.smtpPort === 587),
    oauthTenantId: mailbox.oauthTenantId ?? '',
    oauthClientId: mailbox.oauthClientId ?? '',
    oauthClientSecret: '',
    defaultGroupId: mailbox.defaultGroupId ?? '',
    defaultPriority: mailbox.defaultPriority?.toString() ?? '',
  }
}

export function validateMailboxForm(form: MailboxFormState, mode: MailboxFormMode, currentMailbox?: Mailbox | null): MailboxFormValidationResult {
  const errors: MailboxFormValidationResult = {}
  const requiresPollingFields = form.pollingEnabled
  const requiresOauthSecret = mode === 'create' || currentMailbox?.oauthConfigured !== true

  if (!form.name.trim()) errors.name = 'Mailbox name is required.'
  if (!form.address.trim()) errors.address = 'Mailbox address is required.'

  if (requiresPollingFields) {
    if (!form.imapHost.trim()) errors.imapHost = 'IMAP host is required when polling is enabled.'
    if (!form.imapPort.trim()) errors.imapPort = 'IMAP port is required when polling is enabled.'
    if (!form.imapUsername.trim()) errors.imapUsername = 'IMAP username is required when polling is enabled.'
    if (!form.imapFolder.trim()) errors.imapFolder = 'IMAP folder is required when polling is enabled.'
  }

  if (form.authType === 'PASSWORD' && mode === 'create' && !form.imapPassword.trim()) {
    errors.imapPassword = 'IMAP password is required for password authentication.'
  }

  if (form.authType === 'OAUTH2') {
    if (!form.oauthTenantId.trim()) errors.oauthTenantId = 'Tenant ID is required for OAuth2.'
    if (!form.oauthClientId.trim()) errors.oauthClientId = 'Client ID is required for OAuth2.'
    if (requiresOauthSecret && !form.oauthClientSecret.trim()) {
      errors.oauthClientSecret = 'Client secret is required for OAuth2.'
    }
  }

  return errors
}

export function buildMailboxPayload(form: MailboxFormState, currentMailbox?: Mailbox | null): CreateMailboxRequest {
  const pollInterval = Math.min(86_400, Math.max(30, parseInt(form.pollIntervalSeconds, 10) || 60))
  const imapPort = parseInt(form.imapPort, 10)
  const smtpPort = parseInt(form.smtpPort, 10)

  return {
    name: form.name.trim(),
    displayName: form.displayName.trim() || null,
    address: form.address.trim(),
    mailProvider: form.mailProvider,
    authType: form.authType,
    providerType: form.providerType,
    inboundMode: form.inboundMode,
    outboundMode: form.outboundMode,
    isActive: currentMailbox?.isActive ?? true,
    oauthTenantId: form.authType === 'OAUTH2' ? (form.oauthTenantId.trim() || null) : null,
    oauthClientId: form.authType === 'OAUTH2' ? (form.oauthClientId.trim() || null) : null,
    oauthClientSecret: form.authType === 'OAUTH2' ? (form.oauthClientSecret.trim() || null) : null,
    imapHost: form.imapHost.trim() || null,
    imapPort: Number.isFinite(imapPort) ? imapPort : null,
    imapUsername: form.imapUsername.trim() || null,
    imapPassword: form.authType === 'PASSWORD' ? (form.imapPassword.trim() || null) : null,
    imapUseSsl: form.imapUseSsl,
    imapFolder: form.imapFolder.trim() || 'INBOX',
    pollingEnabled: form.pollingEnabled,
    pollIntervalSeconds: pollInterval,
    initialSyncStrategy: form.initialSyncStrategy,
    smtpHost: form.smtpHost.trim() || null,
    smtpPort: Number.isFinite(smtpPort) ? smtpPort : null,
    smtpUsername: form.smtpUsername.trim() || null,
    smtpPassword: form.smtpPassword.trim() || null,
    smtpUseSsl: form.smtpUseSsl,
    smtpStarttls: form.smtpStarttls,
    defaultGroupId: form.defaultGroupId ? Number(form.defaultGroupId) : null,
    defaultPriority: form.defaultPriority.trim() || null,
  }
}

export function getProviderLabel(provider: MailProvider | null | undefined): string {
  switch (provider) {
    case 'GMAIL': return 'Gmail'
    case 'OUTLOOK': return 'Outlook / Microsoft 365'
    default: return 'Other IMAP'
  }
}

export function getAuthTypeLabel(authType: MailboxFormAuthType | MailboxAuthType | null | undefined): string {
  return authType === 'OAUTH2' ? 'OAuth2' : 'Password'
}