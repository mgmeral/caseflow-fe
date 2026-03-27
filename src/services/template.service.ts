import type { TicketTemplate } from '@/types/user.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockTemplates, getMockDelay } from '@/mock'

let _mockTemplates = [...mockTemplates]

const mockService = {
  getAll: async (): Promise<TicketTemplate[]> => {
    await getMockDelay()
    return [..._mockTemplates]
  },

  getById: async (id: string): Promise<TicketTemplate | null> => {
    await getMockDelay()
    return _mockTemplates.find((t) => t.id === id) ?? null
  },

  create: async (data: Omit<TicketTemplate, 'id'>): Promise<TicketTemplate> => {
    await getMockDelay()
    const newTemplate: TicketTemplate = { ...data, id: `t-${Date.now()}` }
    _mockTemplates.push(newTemplate)
    return { ...newTemplate }
  },

  update: async (id: string, data: Partial<TicketTemplate>): Promise<TicketTemplate> => {
    await getMockDelay()
    const idx = _mockTemplates.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error('Template not found')
    _mockTemplates[idx] = { ..._mockTemplates[idx], ...data }
    return { ..._mockTemplates[idx] }
  },

  delete: async (id: string): Promise<void> => {
    await getMockDelay()
    _mockTemplates = _mockTemplates.filter((t) => t.id !== id)
  },
}

const realService = {
  getAll: () => apiClient.get<TicketTemplate[]>('/templates'),
  getById: (id: string) => apiClient.get<TicketTemplate | null>(`/templates/${id}`),
  create: (data: Omit<TicketTemplate, 'id'>) => apiClient.post<TicketTemplate>('/templates', data),
  update: (id: string, data: Partial<TicketTemplate>) =>
    apiClient.put<TicketTemplate>(`/templates/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/templates/${id}`),
}

export const templateService = USE_MOCKS ? mockService : realService
