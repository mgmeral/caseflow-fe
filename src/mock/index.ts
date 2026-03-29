export { mockCustomers } from './customers.mock'
export { mockUsers, mockGroups, mockGroupTypes, mockTemplates } from './users.mock'
export { mockTickets } from './tickets.mock'
export { mockMessages, mockTransferRecords } from './messages.mock'
export { mockRoles, mockPermissionDefs } from './roles.mock'
export {
  mockMailboxes,
  mockCustomerEmailSettings,
  mockCustomerRoutingRules,
  mockIngressEvents,
} from './email-platform.mock'

export function getMockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 400))
}
