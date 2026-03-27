import type { TicketTemplate } from '@/types/user.types'
import { ApiError } from './api.client'
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

/**
 * Templates are not in the current backend contract.
 * Real mode returns empty list for reads and throws 501 for writes.
 * This feature is deferred to V2.
 */
const realService = {
  getAll: async (): Promise<TicketTemplate[]> => {
    // Return empty array — no backend endpoint for templates in current version
    return []
  },

  getById: async (_id: string): Promise<TicketTemplate | null> => null,

  create: async (_data: Omit<TicketTemplate, 'id'>): Promise<TicketTemplate> => {
    throw new ApiError(501, 'not_implemented', 'Template management is not supported by the current backend. Enable mock mode (VITE_USE_MOCKS=true) to use this feature.')
  },

  update: async (_id: string, _data: Partial<TicketTemplate>): Promise<TicketTemplate> => {
    throw new ApiError(501, 'not_implemented', 'Template management is not supported by the current backend. Enable mock mode (VITE_USE_MOCKS=true) to use this feature.')
  },

  delete: async (_id: string): Promise<void> => {
    throw new ApiError(501, 'not_implemented', 'Template management is not supported by the current backend. Enable mock mode (VITE_USE_MOCKS=true) to use this feature.')
  },
}

export const templateService = USE_MOCKS ? mockService : realService
