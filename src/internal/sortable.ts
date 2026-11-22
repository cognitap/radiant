/**
 * Known items in the requested order: repeated values and values without an item drop, and
 * items missing from the order (such as ones that stream in later) follow in source order.
 */
export function arrangeOrder(order: readonly string[], known: readonly string[]): string[] {
  const present = new Set(known)
  const seen = new Set<string>()
  const placed: string[] = []
  for (const value of order)
    if (present.has(value) && !seen.has(value)) {
      seen.add(value)
      placed.push(value)
    }
  return [...placed, ...known.filter(value => !seen.has(value))]
}

/** The order with `value` moved to `index`, clamped to the list. */
export function moveItem(order: readonly string[], value: string, index: number): string[] {
  const rest = order.filter(item => item !== value)
  const at = Math.max(0, Math.min(rest.length, index))
  return [...rest.slice(0, at), value, ...rest.slice(at)]
}

/** The drop index among the other items: how many of their midpoints lie before the pointer. */
export function dropIndex(midpoints: readonly number[], pointer: number): number {
  return midpoints.filter(midpoint => midpoint < pointer).length
}
