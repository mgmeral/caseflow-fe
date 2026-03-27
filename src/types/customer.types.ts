export type CustomerSegment = 'bank' | 'insurance' | 'leasing' | 'corporate' | 'other'

export interface Customer {
  id: string
  name: string
  segment: CustomerSegment
  emails: string[]
  phone: string | null
  assignedAgentId: string | null
  assignedAgentName: string | null
  totalTickets: number
  openTickets: number
  createdAt: string
  isActive: boolean
  notes: string
}
