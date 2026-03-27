import { useState } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, FileText, ShieldOff, Search, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { Modal } from '@/components/shared/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '@/hooks/useTemplates'
import { useGroupsQuery } from '@/hooks/useUsers'
import type { TicketTemplate } from '@/types/user.types'
import { USE_MOCKS } from '@/lib/env'

type TemplateType = 'public_reply' | 'internal_note'
type Language = 'tr' | 'en'
type FilterType = 'all' | TemplateType

interface TemplateFormState {
  name: string
  subject: string
  content: string
  type: TemplateType
  groupId: string
  language: Language
}

const EMPTY_FORM: TemplateFormState = {
  name: '',
  subject: '',
  content: '',
  type: 'public_reply',
  groupId: '',
  language: 'tr',
}

function TypeBadge({ type }: { type: TemplateType }) {
  return type === 'public_reply' ? (
    <Badge variant="info" size="sm">Müşteri Yanıtı</Badge>
  ) : (
    <Badge variant="warning" size="sm">İç Not</Badge>
  )
}

export function TemplateManagementPage() {
  const { canManageUsers } = usePermissions()
  const { success, error } = useToast()

  const templatesQuery = useTemplates()
  const groupsQuery = useGroupsQuery()
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()
  const deleteMutation = useDeleteTemplate()

  const templates = templatesQuery.data ?? []
  const groups = groupsQuery.data ?? []

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null)
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

  // Template management is not supported by the current backend.
  // In real mode, return a clear "not available" screen instead of a broken UI.
  if (!USE_MOCKS) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FileText className="w-8 h-8 text-gray-400" />}
          title="Templates — Not Available in Real Mode"
          description="Template management requires mock mode. Set VITE_USE_MOCKS=true in .env.local to use this feature."
        />
      </div>
    )
  }

  // --- Derived ---
  const filtered = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || t.type === filterType
    return matchSearch && matchType
  })

  // --- Handlers ---
  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingTemplate(null)
    setModalMode('create')
  }

  const openEdit = (t: TicketTemplate) => {
    setForm({
      name: t.name,
      subject: t.subject,
      content: t.content,
      type: t.type,
      groupId: t.groupId ?? '',
      language: t.language,
    })
    setEditingTemplate(t)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingTemplate(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.content.trim()) return
    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync({
          name: form.name.trim(),
          subject: form.subject.trim(),
          content: form.content.trim(),
          type: form.type,
          groupId: form.groupId || null,
          language: form.language,
          isActive: true,
        })
        success('Şablon oluşturuldu')
      } else if (editingTemplate) {
        await updateMutation.mutateAsync({
          id: editingTemplate.id,
          data: {
            name: form.name.trim(),
            subject: form.subject.trim(),
            content: form.content.trim(),
            type: form.type,
            groupId: form.groupId || null,
            language: form.language,
          },
        })
        success('Şablon güncellendi')
      }
      closeModal()
    } catch {
      error('Şablon kaydedilemedi')
    }
  }

  const handleToggleActive = async (id: string) => {
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return
    try {
      await updateMutation.mutateAsync({ id, data: { isActive: !tpl.isActive } })
      success(tpl.isActive ? 'Şablon devre dışı bırakıldı' : 'Şablon aktif edildi')
    } catch {
      error('Güncelleme başarısız oldu')
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteMutation.mutateAsync(deletingId)
      success('Şablon silindi')
    } catch {
      error('Silme işlemi başarısız oldu')
    }
    setDeletingId(null)
  }

  const isFormValid = form.name.trim() && form.subject.trim() && form.content.trim()

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
        <div className="flex gap-1">
          {(['all', 'public_reply', 'internal_note'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterType(f)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
                filterType === f
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
              )}
            >
              {f === 'all' ? 'Tümü' : f === 'public_reply' ? 'Müşteri Yanıtı' : 'İç Not'}
            </button>
          ))}
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
                  Şablon Adı
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Konu
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tür
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Grup
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Dil
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Durum
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{tpl.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{tpl.subject}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={tpl.type} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {tpl.groupId
                      ? (groups.find((g) => g.id === tpl.groupId)?.name ?? tpl.groupId)
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 uppercase">{tpl.language}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(tpl.id)}
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => openEdit(tpl)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title="Düzenle"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(tpl.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
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
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Şablon Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ör. Genel Karşılama"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              E-posta Konusu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="ör. Destek Talebiniz Alındı"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>

          {/* Type + Language row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tür</label>
              <div className="relative">
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TemplateType }))}
                  className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                >
                  <option value="public_reply">Müşteri Yanıtı</option>
                  <option value="internal_note">İç Not</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Dil</label>
              <div className="relative">
                <select
                  value={form.language}
                  onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as Language }))}
                  className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">İngilizce</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Grup <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <div className="relative">
              <select
                value={form.groupId}
                onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
              >
                <option value="">Tüm Gruplar</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              İçerik <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Şablon içeriğini buraya yazın…"
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
            <p className="text-xs text-gray-400 mt-1">{form.content.length} karakter</p>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Şablonu Sil"
        message={`"${templates.find((t) => t.id === deletingId)?.name ?? ''}" şablonunu kalıcı olarak silmek istediğinizden emin misiniz?`}
        confirmLabel="Sil"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

