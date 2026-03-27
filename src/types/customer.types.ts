export type CustomerSegment = 'bank' | 'insurance' | 'leasing' | 'corporate' | 'other'

/** Aligns to backend ContactResponse */
export interface Contact {
  id: string
  customerId: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  isActive: boolean
  isPrimary: boolean
}

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
