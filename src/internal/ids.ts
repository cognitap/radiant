/** Preserve owned relationships first, then append each external ID once. */
export function joinIds(...parts: Array<string | undefined>) {
  const ids = new Set(parts.flatMap(part => part?.split(/\s+/) ?? []).filter(Boolean))
  return ids.size > 0 ? [...ids].join(' ') : undefined
}
