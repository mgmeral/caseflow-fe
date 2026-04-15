export function parseNumericContractId(value: string | number | null | undefined): number | null {
  if (value == null) return null

  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? value : null
  }

  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^\d+$/.test(trimmed)) return null

  const parsed = Number(trimmed)
  return Number.isSafeInteger(parsed) ? parsed : null
}

export function requireNumericContractId(
  value: string | number | null | undefined,
  missingMessage: string,
  invalidMessage: string,
): number {
  const isMissing = value == null || (typeof value === 'string' && value.trim().length === 0)
  if (isMissing) {
    throw new Error(missingMessage)
  }

  const parsed = parseNumericContractId(value)
  if (parsed == null) {
    throw new Error(invalidMessage)
  }

  return parsed
}

export function optionalNumericContractId(
  value: string | number | null | undefined,
  invalidMessage: string,
): number | null {
  const isMissing = value == null || (typeof value === 'string' && value.trim().length === 0)
  if (isMissing) {
    return null
  }

  const parsed = parseNumericContractId(value)
  if (parsed == null) {
    throw new Error(invalidMessage)
  }

  return parsed
}

export function trimOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}