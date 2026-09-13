/**
 * Transfer service — aligned to CaseFlow API v2.0.0 /api/transfers endpoints.
 */
import type { TransferRecord } from '@/types/ticket.types'
import type { TransferResponse, TransferListItem, TransferTicketRequest } from '@/types/api.types'
import { apiClient } from './api.client'
import { toArrayPayload } from '@/lib/apiList'

export type { TransferTicketRequest }

function toTransferRecord(t: TransferResponse): TransferRecord {
  return {
    id: t.id,
    ticketId: String(t.ticketId),
    fromGroupId: String(t.fromGroupId),
    fromGroupName: '',
    toGroupId: String(t.toGroupId),
    toGroupName: '',
    transferredByName: t.transferredBy ?? '',
    reason: t.reason ?? '',
    note: null,
    createdAt: t.transferredAt,
  }
}

function toTransferRecordFromListItem(t: TransferListItem): TransferRecord {
  return {
    id: t.id,
    ticketId: String(t.ticketId),
    fromGroupId: String(t.fromGroupId),
    fromGroupName: '',
    toGroupId: String(t.toGroupId),
    toGroupName: '',
    transferredByName: '',
    reason: '',
    note: null,
    createdAt: t.transferredAt,
  }
}

export const transferService = {
  getByTicket: async (ticketId: string): Promise<TransferRecord[]> => {
    const res = await apiClient.get<unknown>(`/transfers/by-ticket/${ticketId}`)
    return toArrayPayload(res)
      .map((item) => toTransferRecordFromListItem(item as TransferListItem))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  create: async (req: TransferTicketRequest): Promise<TransferRecord> => {
    const body = {
      ticketId: Number(req.ticketId),
      fromGroupId: Number(req.fromGroupId),
      toGroupId: Number(req.toGroupId),
      ...(req.reason !== undefined ? { reason: req.reason } : {}),
      ...(req.clearAssignee !== undefined ? { clearAssignee: req.clearAssignee } : {}),
    }
    const res = await apiClient.post<TransferResponse>('/transfers', body)
    return toTransferRecord(res)
  },
}
