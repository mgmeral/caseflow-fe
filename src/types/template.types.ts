export interface MailTemplate {
  id: string
  name: string
  code: string
  usageType: string | null
  description: string | null
  supportedPlaceholders: string | null
  customerVisible: boolean | null
  defaultStatusAfterSend: string | null
  subjectTemplate: string
  htmlTemplate: string
  plainTextTemplate: string
  isActive: boolean
  isBuiltIn: boolean
  canEdit: boolean
  canDelete: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface MailTemplateUpsertInput {
  name: string
  code: string
  usageType?: string | null
  description?: string | null
  supportedPlaceholders?: string | null
  customerVisible?: boolean | null
  defaultStatusAfterSend?: string | null
  subjectTemplate?: string | null
  htmlTemplate: string
  plainTextTemplate: string
  isActive: boolean
}

export interface MailTemplatePreview {
  subject: string
  html: string | null
  /** Spec field */
  text: string | null
  /** @deprecated alias */
  plainText?: string | null
}