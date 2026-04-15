import { useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, FileText, ShieldOff, Search, Eye } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { FieldHint, HelpDrawer, InlineCallout, PageIntro, SectionHelp } from '@/components/shared/help'
import { templatesHelp } from '@/help/templates.help'
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useTemplatePreview } from '@/hooks/useTemplates'
import type { MailTemplate } from '@/types/template.types'
import { getTemplateSaveErrorMessage } from '@/services/template.service'

interface TemplateFormState {
  name: string
  code: string
  usageType: string
  subjectTemplate: string
  htmlTemplate: string
  plainTextTemplate: string
  isActive: boolean
}

const EMPTY_FORM: TemplateFormState = {
  name: '',
  code: '',
  usageType: '',
  subjectTemplate: '',
  htmlTemplate: '',
  plainTextTemplate: '',
  isActive: true,
}

function normalizeTemplateCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function extractPlaceholders(...values: string[]): string[] {
  return Array.from(new Set(
    values
      .flatMap((value) => value.match(/{{\s*[A-Za-z0-9_.-]+\s*}}/g) ?? [])
      .map((token) => token.replace(/\s+/g, '')),
  ))
}

function formatTimestamp(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : format(date, 'MMM d, yyyy HH:mm')
}

export function TemplateManagementPage() {
  const { canViewEmailConfig, canManageEmailConfig } = usePermissions()
  const { success, error } = useToast()

  const templatesQuery = useTemplates()
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()
  const deleteMutation = useDeleteTemplate()
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null)
  const previewQuery = useTemplatePreview(previewTemplateId, !!previewTemplateId)

  const templates = templatesQuery.data ?? []

  const [search, setSearch] = useState('')

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<MailTemplate | null>(null)
  const [form, setForm] = useState<TemplateFormState>(EMPTY_FORM)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!canViewEmailConfig) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldOff className="w-8 h-8 text-gray-400" />}
          title="Access Denied"
          description="You don't have permission to manage templates."
        />
      </div>
    )
  }

  const availableUsageTypes = Array.from(new Set(templates.map((template) => template.usageType).filter((value): value is string => Boolean(value))))
  const showUsageTypeField = availableUsageTypes.length > 0 || Boolean(editingTemplate?.usageType) || modalMode === 'create'
  const detectedPlaceholders = extractPlaceholders(form.subjectTemplate, form.htmlTemplate, form.plainTextTemplate)
  const previewPlainText = form.plainTextTemplate.trim() || form.htmlTemplate.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  // --- Derived ---
  const filtered = useMemo(
    () => templates.filter((template) => {
      const value = search.trim().toLowerCase()
      if (!value) return true

      return template.code.toLowerCase().includes(value)
        || template.name.toLowerCase().includes(value)
        || template.subjectTemplate.toLowerCase().includes(value)
    }),
    [search, templates],
  )

  // --- Handlers ---
  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingTemplate(null)
    setModalMode('create')
  }

  const openEdit = (template: MailTemplate) => {
    setForm({
      name: template.name,
      code: template.code,
      usageType: template.usageType ?? '',
      subjectTemplate: template.subjectTemplate,
      htmlTemplate: template.htmlTemplate,
      plainTextTemplate: template.plainTextTemplate,
      isActive: template.isActive,
    })
    setEditingTemplate(template)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingTemplate(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.subjectTemplate.trim() || !form.htmlTemplate.trim()) return

    const payload = {
      name: form.name.trim(),
      code: normalizeTemplateCode(form.code),
      usageType: form.usageType.trim() || null,
      subjectTemplate: form.subjectTemplate.trim(),
      htmlTemplate: form.htmlTemplate.trim(),
      plainTextTemplate: form.plainTextTemplate.trim(),
      isActive: form.isActive,
    }

    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(payload)
        success('Şablon oluşturuldu')
      } else if (editingTemplate) {
        await updateMutation.mutateAsync({
          id: editingTemplate.id,
          data: payload,
        })
        success('Şablon güncellendi')
      }
      closeModal()
    } catch (cause) {
      error(getTemplateSaveErrorMessage(cause))
    }
  }

  const handleToggleActive = async (id: string) => {
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          name: tpl.name,
          code: tpl.code,
          usageType: tpl.usageType,
          subjectTemplate: tpl.subjectTemplate,
          htmlTemplate: tpl.htmlTemplate,
          plainTextTemplate: tpl.plainTextTemplate,
          isActive: !tpl.isActive,
        },
      })
      success(tpl.isActive ? 'Şablon devre dışı bırakıldı' : 'Şablon aktif edildi')
    } catch {
      error('Güncelleme başarısız oldu.')
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteMutation.mutateAsync(deletingId)
      success('Şablon silindi')
    } catch {
      error('Silme işlemi başarısız oldu.')
    }
    setDeletingId(null)
  }

  const isFormValid = form.name.trim() && form.code.trim() && form.subjectTemplate.trim() && form.htmlTemplate.trim()

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header relative z-10">
        <div>
          <h1 className="admin-page-title">Template Management</h1>
          <p className="admin-page-subtitle">
            {templates.length} şablon · {templates.filter((t) => t.isActive).length} aktif
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => setIsHelpOpen(true)}>
            Help
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={openCreate}
            disabled={!canManageEmailConfig}
          >
            Yeni Şablon
          </Button>
        </div>
      </div>

      <PageIntro summary={templatesHelp.summary} />

      {!canManageEmailConfig ? (
        <div className="admin-panel-soft px-4 py-3 text-sm text-blue-50/90">
          Read-only mode. You can review templates here, but create, edit, activate, and delete actions require email configuration management permission.
        </div>
      ) : null}

      <div className="admin-panel-soft flex items-center gap-3 px-4 py-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Şablon adı, kodu veya konuya göre ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ui-input ui-input-with-icon pr-3"
          />
        </div>
      </div>

      <SectionHelp title={templatesHelp.sections.catalog.title} description={templatesHelp.sections.catalog.description} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10 text-gray-300" />}
          title="Şablon bulunamadı"
          description={search ? 'Arama kriterlerinize uygun şablon yok.' : 'Henüz şablon oluşturulmamış.'}
        />
      ) : (
        <div className="admin-table-shell overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">
                  Ad
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">
                  Kod
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">
                  Usage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">
                  Konu
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">
                  İçerik
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-100/72">
                  Güncellendi
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="admin-table-striped divide-y divide-white/10">
              {filtered.map((tpl) => (
                <tr key={tpl.id} className="transition-colors hover:bg-white/[0.08]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{tpl.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-blue-50">{tpl.code}</div>
                  </td>
                  <td className="px-4 py-3 text-blue-100/72">{tpl.usageType ?? 'GENERAL'}</td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-blue-100/72">{tpl.subjectTemplate}</td>
                  <td className="px-4 py-3 text-xs text-blue-100/60">
                    <div className="flex gap-1.5">
                      {tpl.htmlTemplate && <Badge variant="info" size="sm">HTML</Badge>}
                      {tpl.plainTextTemplate && <Badge variant="outline" size="sm">Text</Badge>}
                      {!tpl.htmlTemplate && !tpl.plainTextTemplate && <span>—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(tpl.id)}
                      disabled={!canManageEmailConfig || !tpl.canEdit}
                      className="flex items-center gap-1.5 text-xs"
                      title={tpl.isActive ? 'Devre dışı bırak' : 'Aktif et'}
                    >
                      {tpl.isActive ? (
                        <>
                          <ToggleRight size={18} className="text-emerald-300" />
                          <span className="font-medium text-emerald-100">Aktif</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={18} className="text-blue-100/40" />
                          <span className="text-blue-100/48">Pasif</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-blue-100/60">{formatTimestamp(tpl.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setPreviewTemplateId(tpl.id)}
                        className="rounded p-1.5 text-blue-100/52 transition-colors hover:bg-white/[0.08] hover:text-white"
                        title="Önizleme"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(tpl)}
                        disabled={!canManageEmailConfig || !tpl.canEdit}
                        className="rounded p-1.5 text-blue-100/52 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        title="Düzenle"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(tpl.id)}
                        disabled={!canManageEmailConfig || !tpl.canDelete}
                        className="rounded p-1.5 text-blue-100/52 transition-colors hover:bg-red-500/12 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Yeni Şablon Oluştur' : 'Şablonu Düzenle'}
        size="xl"
        variant="admin"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending}>
              İptal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={!isFormValid || !canManageEmailConfig}
            >
              {modalMode === 'create' ? 'Oluştur' : 'Kaydet'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 p-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <SectionHelp title={templatesHelp.sections.editor.title} description={templatesHelp.sections.editor.description} />

            <InlineCallout title={templatesHelp.sections.preview.title}>
              Detected placeholders: {detectedPlaceholders.length > 0 ? detectedPlaceholders.join(', ') : 'No placeholders detected yet.'}
            </InlineCallout>

            <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Ad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ör. Ticket Reply Acknowledgement"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
            <FieldHint text={templatesHelp.fieldHints.name} />
            </div>

            <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Kod <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: normalizeTemplateCode(e.target.value) }))}
              placeholder="ör. TICKET_REPLY_ACK"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
              <FieldHint text={templatesHelp.fieldHints.code} />
            </div>

            {showUsageTypeField ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Usage Type</label>
                <input
                  type="text"
                  list="template-usage-types"
                  value={form.usageType}
                  onChange={(e) => setForm((current) => ({ ...current, usageType: e.target.value.toUpperCase() }))}
                  placeholder="ör. TICKET_REPLY"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
                <datalist id="template-usage-types">
                  {availableUsageTypes.map((usageType) => (
                    <option key={usageType} value={usageType} />
                  ))}
                </datalist>
                <FieldHint text={templatesHelp.fieldHints.usageType} />
              </div>
            ) : null}

            <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Konu Şablonu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.subjectTemplate}
              onChange={(e) => setForm((f) => ({ ...f, subjectTemplate: e.target.value }))}
              placeholder="ör. Destek Talebiniz Alındı"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
            <FieldHint text={templatesHelp.fieldHints.subjectTemplate} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">HTML Şablonu</label>
              <textarea
                value={form.htmlTemplate}
                onChange={(e) => setForm((f) => ({ ...f, htmlTemplate: e.target.value }))}
                placeholder="HTML template"
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              />
              <FieldHint text={templatesHelp.fieldHints.htmlTemplate} />
              </div>
              <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Plain Text Şablonu</label>
              <textarea
                value={form.plainTextTemplate}
                onChange={(e) => setForm((f) => ({ ...f, plainTextTemplate: e.target.value }))}
                placeholder="Plain text template"
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              />
                <FieldHint text={templatesHelp.fieldHints.plainTextTemplate} />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
              Şablon aktif
            </label>
            <FieldHint className="mt-0" text={templatesHelp.fieldHints.isActive} />
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subject Preview</div>
                <div className="mt-1 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-gray-800">{form.subjectTemplate.trim() || 'No subject yet'}</div>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">HTML Preview</div>
                <div className="min-h-[14rem] rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800">
                  {form.htmlTemplate.trim() ? (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.htmlTemplate) }} />
                  ) : (
                    <span className="text-gray-400">HTML preview is empty.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Plain Text Preview</div>
                <div className="min-h-[14rem] rounded-lg border border-gray-200 bg-slate-950 p-3 text-sm text-slate-100">
                  {previewPlainText ? (
                    <pre className="whitespace-pre-wrap font-sans">{previewPlainText}</pre>
                  ) : (
                    <span className="text-slate-400">Plain text preview is empty.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} config={templatesHelp} />

      <Modal
        isOpen={!!previewTemplateId}
        onClose={() => setPreviewTemplateId(null)}
        title="Şablon Önizleme"
        size="xl"
        variant="admin"
      >
        {previewQuery.isLoading ? (
          <div className="text-sm text-gray-500">Önizleme yükleniyor...</div>
        ) : previewQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Önizleme alınamadı.
          </div>
        ) : previewQuery.data ? (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rendered Subject</div>
              <div className="mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
                {previewQuery.data.subject || '—'}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">HTML</div>
                <div className="min-h-[16rem] rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800">
                  {previewQuery.data.html ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewQuery.data.html) }}
                    />
                  ) : (
                    <span className="text-gray-400">HTML preview is empty.</span>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Plain Text</div>
                <div className="min-h-[16rem] rounded-lg border border-gray-200 bg-slate-950 p-3 text-sm text-slate-100">
                  {previewQuery.data.plainText ? (
                    <pre className="whitespace-pre-wrap font-sans">{previewQuery.data.plainText}</pre>
                  ) : (
                    <span className="text-slate-400">Plain text preview is empty.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Şablonu Sil"
        message={`"${templates.find((t) => t.id === deletingId)?.code ?? ''}" şablonunu kalıcı olarak silmek istediğinizden emin misiniz?`}
        confirmLabel="Sil"
        isDestructive
        isLoading={deleteMutation.isPending}
        variant="admin"
      />
    </div>
  )
}

