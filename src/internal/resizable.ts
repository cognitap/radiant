import { addDecimal } from './decimal.js'
export type ResizableItem = { value: string; min?: number; max?: number; collapsible?: boolean }
export type ResizableRange = readonly [number, number]
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
export const sameResizableValue = (a: number[], b: number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index])
export function checkResizableItems(items: readonly ResizableItem[]) {
  if (!Array.isArray(items) || items.length < 2)
    throw new TypeError('Resizable requires at least two items.')
  const seen = new Set<string>()
  for (const item of items) {
    if (!item || typeof item.value !== 'string' || !item.value.trim() || seen.has(item.value))
      throw new TypeError('Resizable panel keys must be unique nonempty strings.')
    seen.add(item.value)
    const min = item.min ?? 0,
      max = item.max ?? 100
    if (!finite(min) || !finite(max) || min < 0 || max > 100 || min > max)
      throw new TypeError('Resizable bounds must be percentages with 0 <= min <= max <= 100.')
  }
}
export function checkResizableValue(
  items: readonly ResizableItem[],
  value: unknown
): asserts value is number[] {
  if (
    !Array.isArray(value) ||
    value.length !== items.length ||
    !value.every(
      (size, index) =>
        finite(size) &&
        ((size === 0 && items[index]!.collapsible) ||
          (size >= (items[index]!.min ?? 0) && size <= (items[index]!.max ?? 100)))
    )
  )
    throw new TypeError('Resizable needs one finite size per panel within its bounds.')
  if (Math.abs(value.reduce(addDecimal, 0) - 100) > 1e-7)
    throw new TypeError('Resizable sizes must total 100.')
}
export function resizableIndex(items: readonly ResizableItem[], value: string) {
  const index = items.findIndex(item => item.value === value)
  if (index < 0) throw new TypeError('Unknown Resizable panel: ' + value)
  return index
}
export const resizableNeighbor = (items: readonly ResizableItem[], index: number) =>
  index === items.length - 1 ? index - 1 : index + 1
const ranges = (item: ResizableItem): ResizableRange[] =>
  item.collapsible
    ? [
        [0, 0],
        [item.min ?? 0, item.max ?? 100]
      ]
    : [[item.min ?? 0, item.max ?? 100]]
/** Recover exact constraint endpoints after a few floating-point operations. */
function snapBoundary(value: number, endpoints: readonly number[], scale: number) {
  const closest = endpoints.reduce(
    (best, point) => (Math.abs(value - point) < Math.abs(value - best) ? point : best),
    endpoints[0]!
  )
  return Math.abs(value - closest) <= Number.EPSILON * 8 * Math.max(1, Math.abs(scale))
    ? closest
    : value
}
export function resizableRanges(
  items: readonly ResizableItem[],
  value: number[],
  index: number
): ResizableRange[] {
  const neighbor = resizableNeighbor(items, index),
    sum = addDecimal(value[index]!, value[neighbor]!)
  return ranges(items[index]!)
    .flatMap(a =>
      ranges(items[neighbor]!).flatMap(b => {
        const min = snapBoundary(Math.max(a[0], addDecimal(sum, -b[1])), a, sum),
          max = snapBoundary(Math.min(a[1], addDecimal(sum, -b[0])), a, sum)
        return min <= max ? [[min, max] as const] : []
      })
    )
    .sort((a, b) => a[0] - b[0])
}
export function resizePanel(
  items: readonly ResizableItem[],
  value: number[],
  index: number,
  size: number,
  directional = true
) {
  if (!finite(size)) throw new TypeError('Resizable sizes must be finite.')
  const intervals = resizableRanges(items, value, index)
  if (!intervals.length) return value
  const current = value[index]!
  let next = intervals[0]![0],
    distance = Infinity
  for (const [min, max] of intervals) {
    const candidate = Math.max(min, Math.min(max, size)),
      difference = Math.abs(candidate - size)
    if (difference < distance) {
      next = candidate
      distance = difference
    }
  }
  if (directional && next === current && size !== current) {
    if (size > current) next = intervals.find(range => range[0] > current)?.[0] ?? next
    else next = [...intervals].reverse().find(range => range[1] < current)?.[1] ?? next
  }
  if (next === current) return value
  const neighbor = resizableNeighbor(items, index),
    result = [...value]
  result[index] = next
  const sum = addDecimal(value[index]!, value[neighbor]!),
    peer = items[neighbor]!
  result[neighbor] = snapBoundary(addDecimal(sum, -next), ranges(peer).flat(), sum)
  checkResizableValue(items, result)
  return result
}
