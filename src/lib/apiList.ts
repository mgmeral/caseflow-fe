/**
 * Unwraps a list-endpoint response into a plain array, regardless of which
 * envelope shape the backend used for that endpoint (bare array,
 * `PagedResponse` `{items,...}`, Spring Data `Page` `{content,...}`, or a
 * generic `{data,...}` / `{results,...}` wrapper).
 *
 * Every `getAll`/`list*` service method should route its raw response
 * through this instead of assuming a shape — see CONTRACT-001 in
 * caseflow-central-brain for the bug class this closes.
 */
export function toArrayPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== 'object') return []
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.items)) return obj.items
  if (Array.isArray(obj.content)) return obj.content
  if (Array.isArray(obj.data)) return obj.data
  if (Array.isArray(obj.results)) return obj.results
  return []
}
