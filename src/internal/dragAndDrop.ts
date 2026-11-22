/** Item values by container value, every container present, in container order. */
export type ContainerLayout = Record<string, string[]>

/**
 * Places known items in known containers. An item listed twice keeps its first place, in
 * container order; unknown items and containers drop; items listed nowhere (such as ones that
 * stream in later) join the end of the first container in source order.
 */
export function arrangeContainers(
  value: Readonly<Record<string, readonly string[] | undefined>> | undefined,
  containers: readonly string[],
  items: readonly string[]
): ContainerLayout {
  const present = new Set(items)
  const seen = new Set<string>()
  const layout: ContainerLayout = {}
  for (const container of containers) {
    const listed = value && Object.hasOwn(value, container) ? value[container] : undefined
    layout[container] = []
    if (!Array.isArray(listed)) continue
    for (const item of listed)
      if (present.has(item) && !seen.has(item)) {
        seen.add(item)
        layout[container]!.push(item)
      }
  }
  const first = containers[0]
  if (first !== undefined) layout[first]!.push(...items.filter(item => !seen.has(item)))
  return layout
}

/** The container holding `item`, if any. */
export function containerOf(layout: ContainerLayout, item: string) {
  for (const [container, items] of Object.entries(layout))
    if (items.includes(item)) return container
  return undefined
}

/** The layout with `item` moved to `index` in `to`, clamped to that container. */
export function moveToContainer(
  layout: ContainerLayout,
  item: string,
  to: string,
  index: number
): ContainerLayout {
  const next: ContainerLayout = {}
  for (const [container, items] of Object.entries(layout))
    next[container] = items.filter(value => value !== item)
  const target = next[to]
  if (!target) return layout
  const at = Math.max(0, Math.min(target.length, index))
  target.splice(at, 0, item)
  return next
}

/** Whether two layouts hold the same items in the same containers and order. */
export function sameLayout(left: ContainerLayout, right: ContainerLayout) {
  const keys = Object.keys(left)
  if (keys.length !== Object.keys(right).length) return false
  return keys.every(key => {
    const a = left[key]!,
      b = right[key]
    return !!b && a.length === b.length && a.every((item, index) => item === b[index])
  })
}

/** Whether `container` can take `item`: it has room or already holds it. */
export function hasRoom(
  layout: ContainerLayout,
  container: string,
  item: string,
  capacity: number | undefined
) {
  const items = layout[container] ?? []
  return capacity === undefined || items.includes(item) || items.length < capacity
}

/**
 * The value to report after moving `item` to `index` in `to` (a position among the rendered
 * items): only that item moves. Unknown containers, and items not rendered yet, keep their place
 * in `raw`; every rendered container is present.
 */
export function relocate(
  raw: Readonly<Record<string, readonly string[] | undefined>> | undefined,
  containers: readonly string[],
  items: readonly string[],
  item: string,
  to: string,
  index: number
): ContainerLayout {
  const layout = moveToContainer(arrangeContainers(raw, containers, items), item, to, index)
  const known = new Set(items)
  const listed = (key: string) => {
    const list = raw && Object.hasOwn(raw, key) ? raw[key] : undefined
    return Array.isArray(list) ? list.filter(value => value !== item) : []
  }
  const next: ContainerLayout = {}
  for (const container of containers) next[container] = listed(container)
  for (const key of Object.keys(raw ?? {}))
    if (!Object.hasOwn(next, key) && Array.isArray(raw![key])) next[key] = listed(key)
  next[to] = [...layout[to]!, ...next[to]!.filter(value => !known.has(value))]
  return next
}
