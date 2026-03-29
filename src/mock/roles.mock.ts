import type { RoleRecord, PermissionDef } from '@/types/user.types'

/** Canonical permission catalogue — returned by GET /api/roles/permissions */
export const mockPermissionDefs: PermissionDef[] = [
  { code: 'ADMIN_POOL_VIEW',    label: 'View Admin Pool',       description: 'Access the unassigned ticket pool',           category: 'Admin' },
  { code: 'USER_MANAGE',        label: 'Manage Users & Groups', description: 'Create, edit and deactivate users and groups', category: 'Admin' },
  { code: 'ROLE_MANAGE',        label: 'Manage Roles',          description: 'Create, edit and deactivate roles',            category: 'Admin' },
  { code: 'TICKET_ASSIGN',      label: 'Assign Tickets',        description: 'Assign tickets to agents',                    category: 'Tickets' },
  { code: 'TICKET_TRANSFER',    label: 'Transfer Tickets',      description: 'Transfer tickets between groups',              category: 'Tickets' },
  { code: 'TICKET_CLOSE',       label: 'Close Tickets',         description: 'Mark tickets as closed or resolved',           category: 'Tickets' },
  { code: 'TICKET_PRIORITY',    label: 'Change Priority',       description: 'Change ticket priority level',                category: 'Tickets' },
  { code: 'TICKET_STATUS',      label: 'Change Status',         description: 'Change ticket status',                        category: 'Tickets' },
  { code: 'REPLY_PUBLIC',       label: 'Send Customer Reply',   description: 'Reply to customers (email out)',               category: 'Communication' },
  { code: 'NOTE_INTERNAL',      label: 'Add Internal Note',     description: 'Write notes visible only to team',             category: 'Communication' },
  { code: 'REPORT_VIEW',        label: 'View Reports',          description: 'Access the reports & analytics page',          category: 'Reporting' },
  { code: 'REPORT_EXPORT',      label: 'Export Data',           description: 'Export ticket and report data',                category: 'Reporting' },
]

/** Seeded starter roles — editable unless backend enforces protection */
export const mockRoles: RoleRecord[] = [
  {
    id: 'r1',
    code: 'ADMIN',
    name: 'Admin',
    description: 'Full system access.',
    ticketScope: 'ALL',
    isActive: true,
    permissions: mockPermissionDefs.map((p) => p.code),
  },
  {
    id: 'r2',
    code: 'SUPERVISOR',
    name: 'Supervisor',
    description: 'Team oversight and administration.',
    ticketScope: 'OWN_AND_OWN_GROUPS',
    isActive: true,
    permissions: ['ADMIN_POOL_VIEW', 'TICKET_ASSIGN', 'TICKET_TRANSFER', 'TICKET_CLOSE', 'TICKET_PRIORITY', 'TICKET_STATUS', 'REPLY_PUBLIC', 'NOTE_INTERNAL', 'REPORT_VIEW', 'REPORT_EXPORT'],
  },
  {
    id: 'r3',
    code: 'AGENT',
    name: 'Agent',
    description: 'Handles tickets - reply, transfer and close.',
    ticketScope: 'OWN_GROUPS',
    isActive: true,
    permissions: ['TICKET_TRANSFER', 'TICKET_CLOSE', 'TICKET_STATUS', 'REPLY_PUBLIC', 'NOTE_INTERNAL', 'REPORT_VIEW'],
  },
  {
    id: 'r4',
    code: 'VIEWER',
    name: 'Viewer',
    description: 'Read-only access.',
    ticketScope: 'ASSIGNED_ONLY',
    isActive: true,
    permissions: ['REPORT_VIEW'],
  },
]
