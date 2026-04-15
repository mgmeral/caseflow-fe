import { apiClient, ApiError, type FieldViolation } from './api.client'
import type {
  MailTemplatePreviewRequest,
  MailTemplatePreviewResponse,
  MailTemplateRequest,
  MailTemplateResponse,
  PagedResponse,
} from '@/types/api.types'
import type {
  MailTemplate,
  MailTemplatePreview,
  MailTemplateUpsertInput,
} from '@/types/template.types'

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toNullableText(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function normalizeTemplate(raw: MailTemplateResponse): MailTemplate {
  const isBuiltIn = raw.isBuiltIn === true
  const canEdit = typeof raw.canEdit === 'boolean' ? raw.canEdit : !isBuiltIn
  const canDelete = typeof raw.canDelete === 'boolean' ? raw.canDelete : !isBuiltIn

  return {
    id: String(raw.id),
    name: toText(raw.name, toText(raw.code)),
    code: toText(raw.code),
    usageType: toNullableText(raw.usageType),
    subjectTemplate: toText(raw.subjectTemplate),
    htmlTemplate: toText(raw.htmlTemplate),
    plainTextTemplate: toText(raw.plainTextTemplate),
    isActive: raw.isActive !== false,
    isBuiltIn,
    canEdit,
    canDelete,
    createdAt: toNullableText(raw.createdAt),
    updatedAt: toNullableText(raw.updatedAt),
  }
}

function toRequestBody(input: MailTemplateUpsertInput): MailTemplateRequest {
  const usageType = input.usageType?.trim()

  return {
    name: input.name.trim(),
    code: input.code.trim(),
    usageType: usageType || null,
    subjectTemplate: input.subjectTemplate.trim(),
    htmlTemplate: input.htmlTemplate.trim(),
    plainTextTemplate: input.plainTextTemplate.trim(),
    isActive: input.isActive,
  }
}

export function getTemplateSaveErrorMessage(cause: unknown): string {
  if (cause instanceof Error && 'violations' in cause) {
    const apiError = cause as ApiError
    const nameViolation = apiError.violations?.find((item: FieldViolation) => item.field === 'name')
    if (nameViolation) return 'Şablon adı zorunlu.'

    const htmlViolation = apiError.violations?.find((item: FieldViolation) => item.field === 'htmlTemplate')
    if (htmlViolation) return 'HTML şablonu boş bırakılamaz.'

    if (apiError.violations && apiError.violations.length > 0) {
      return apiError.violations.map((item: FieldViolation) => `${item.field}: ${item.message}`).join(' ')
    }

    return apiError.message
  }

  return 'Şablon kaydedilemedi.'
}

function normalizePreview(raw: MailTemplatePreviewResponse): MailTemplatePreview {
  return {
    subject: toText(raw.renderedSubject ?? raw.subject),
    html: toNullableText(raw.renderedHtml ?? raw.html),
    plainText: toNullableText(raw.renderedPlainText ?? raw.plainText),
  }
}

export const templateFeature = {
  supported: true,
  reason: null,
} as const

export const templateService = {
  getAll: async (): Promise<MailTemplate[]> => {
    const response = await apiClient.get<PagedResponse<MailTemplateResponse> | MailTemplateResponse[]>('/admin/mail-templates')
    const items = Array.isArray(response) ? response : response.items
    return items.map(normalizeTemplate)
  },

  getById: async (id: string): Promise<MailTemplate> => {
    const response = await apiClient.get<MailTemplateResponse>(`/admin/mail-templates/${id}`)
    return normalizeTemplate(response)
  },

  create: async (data: MailTemplateUpsertInput): Promise<MailTemplate> => {
    const response = await apiClient.post<MailTemplateResponse>('/admin/mail-templates', toRequestBody(data))
    return normalizeTemplate(response)
  },

  update: async (id: string, data: MailTemplateUpsertInput): Promise<MailTemplate> => {
    const response = await apiClient.put<MailTemplateResponse>(`/admin/mail-templates/${id}`, toRequestBody(data))
    return normalizeTemplate(response)
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/mail-templates/${id}`)
  },

  preview: async (id: string, request: MailTemplatePreviewRequest = {}): Promise<MailTemplatePreview> => {
    const response = await apiClient.post<MailTemplatePreviewResponse>(`/admin/mail-templates/${id}/preview`, request)
    return normalizePreview(response)
  },
}
