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

/**
 * Frontend view-model for a Customer.
 * Aligned to backend GET /api/customers/{id} (CustomerResponse).
 */
export interface Customer {
  id: string
  name: string
  code: string
  isActive: boolean
  colorHex: string | null
  createdAt: string | null
  updatedAt: string | null
}