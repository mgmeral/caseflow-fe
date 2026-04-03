export interface MailTemplate {
  id: string
  name: string
  code: string
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
  subjectTemplate: string
  htmlTemplate: string
  plainTextTemplate: string
  isActive: boolean
}

export interface MailTemplatePreview {
  subject: string
  html: string | null
  plainText: string | null
}