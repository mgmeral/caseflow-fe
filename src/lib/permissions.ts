const PERMISSION_ALIASES: Record<string, string[]> = {
  INTEGRATION_CONFIG_MANAGE: ['INTEGRATION_CONFIG_MANAGE', 'PERM_INTEGRATION_CONFIG_MANAGE'],
  PERM_INTEGRATION_CONFIG_MANAGE: ['INTEGRATION_CONFIG_MANAGE', 'PERM_INTEGRATION_CONFIG_MANAGE'],
  SCHEDULED_EMAIL_MANAGE: ['SCHEDULED_EMAIL_MANAGE', 'PERM_SCHEDULED_EMAIL_MANAGE'],
  PERM_SCHEDULED_EMAIL_MANAGE: ['SCHEDULED_EMAIL_MANAGE', 'PERM_SCHEDULED_EMAIL_MANAGE'],
}

function expandPermissionCode(code: string): string[] {
  return PERMISSION_ALIASES[code] ?? [code]
}

export function createPermissionSet(permissionCodes: Iterable<string> | null | undefined): Set<string> {
  const resolved = new Set<string>()

  if (!permissionCodes) {
    return resolved
  }

  for (const code of permissionCodes) {
    for (const value of expandPermissionCode(code)) {
      resolved.add(value)
    }
  }

  return resolved
}

export function hasPermission(permissionCodes: Iterable<string> | null | undefined, requiredCode: string): boolean {
  const resolved = createPermissionSet(permissionCodes)
  return expandPermissionCode(requiredCode).some((code) => resolved.has(code))
}