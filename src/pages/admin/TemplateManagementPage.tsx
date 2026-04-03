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
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useTemplatePreview } from '@/hooks/useTemplates'
import type { MailTemplate } from '@/types/template.types'
import { getTemplateSaveErrorMessage } from '@/services/template.service'

interface TemplateFormState {
  name: string
  code: string
  subjectTemplate: string
  htmlTemplate: string
  plainTextTemplate: string
  isActive: boolean
}

const EMPTY_FORM: TemplateFormState = {
  name: '',
  code: '',
  subjectTemplate: '',
  htmlTemplate: '',
  plainTextTemplate: '',
  isActive: true,
}

function formatTimestamp(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : format(date, 'MMM d, yyyy HH:mm')
}

export function TemplateManagementPage() {
  const { canManageUsers } = usePermissions()
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

  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!canManageUsers) {
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

  // --- Derived ---
  const filtered = useMemo(
    () => templates.filter((template) => {
      const value = search.trim().toLowerCase()
      if (!value) return true

      return template.code.toLowerCase().includes(value)
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
      code: form.code.trim(),
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
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Template Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {templates.length} şablon · {templates.filter((t) => t.isActive).length} aktif
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={16} />}
          onClick={openCreate}
        >
          Yeni Şablon
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Şablon ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10 text-gray-300" />}
          title="Şablon bulunamadı"
          description={search ? 'Arama kriterlerinize uygun şablon yok.' : 'Henüz şablon oluşturulmamış.'}
        />
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ad
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Kod
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Konu
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  İçerik
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Sistem
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Durum
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Güncellendi
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{tpl.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{tpl.code}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[260px] truncate">{tpl.subjectTemplate}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div className="flex gap-1.5">
                      {tpl.htmlTemplate && <Badge variant="info" size="sm">HTML</Badge>}
                      {tpl.plainTextTemplate && <Badge variant="outline" size="sm">Text</Badge>}
                      {!tpl.htmlTemplate && !tpl.plainTextTemplate && <span>—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {tpl.isBuiltIn ? (
                      <Badge variant="warning" size="sm">Built-in</Badge>
                    ) : (
                      <span className="text-xs text-gray-400">Custom</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(tpl.id)}
                      disabled={!tpl.canEdit}
                      className="flex items-center gap-1.5 text-xs"
                      title={tpl.isActive ? 'Devre dışı bırak' : 'Aktif et'}
                    >
                      {tpl.isActive ? (
                        <>
                          <ToggleRight size={18} className="text-indigo-600" />
                          <span className="text-indigo-600 font-medium">Aktif</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={18} className="text-gray-400" />
                          <span className="text-gray-400">Pasif</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatTimestamp(tpl.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setPreviewTemplateId(tpl.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title="Önizleme"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(tpl)}
                        disabled={!tpl.canEdit}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        title="Düzenle"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(tpl.id)}
                        disabled={!tpl.canDelete}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
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
              disabled={!isFormValid}
            >
              {modalMode === 'create' ? 'Oluştur' : 'Kaydet'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 p-1">
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Kod <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="ör. TICKET_REPLY_ACK"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>

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
              <p className="mt-1 text-xs text-gray-400">Backend bu alanı zorunlu istiyor.</p>
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
        </div>
      </Modal>

      <Modal
        isOpen={!!previewTemplateId}
        onClose={() => setPreviewTemplateId(null)}
        title="Şablon Önizleme"
        size="xl"
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
      />
    </div>
  )
}

