export type Selection = string | null | string[]

export function isItemOpen(value: Selection, item: string) {
  return Array.isArray(value) ? value.includes(item) : value === item
}

export function sameSelection(left: Selection, right: Selection) {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => item === right[index])
  }
  return left === right
}

export function nextSelection(current: Selection, item: string, open: boolean): Selection {
  if (Array.isArray(current)) {
    if (open) return current.includes(item) ? current : [...current, item]
    return current.filter(value => value !== item)
  }
  return open ? item : current === item ? null : current
}
