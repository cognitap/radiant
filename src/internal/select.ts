import type { createLocaleMatcher } from './localeMatcher.js'

export type SelectEntry = { value: string; textValue: string; disabled?: boolean }

/** Native-like text matching, including repeated-letter cycling. */
export function matchSelectText(
  items: readonly SelectEntry[],
  text: string,
  current: string | null,
  matcher: ReturnType<typeof createLocaleMatcher>
) {
  const query = matcher.typeaheadQuery(text)
  const matches = matcher.match(query, 'prefix')
  const index = items.findIndex(item => item.value === current)
  const ordered = [...items.slice(index + 1), ...items.slice(0, index + 1)]
  if (query && !matcher.isSingleKey(query) && index >= 0) ordered.unshift(items[index])
  return ordered.find(item => !item.disabled && matches(item.textValue))?.value
}

export function moveSelectFocus(
  items: readonly SelectEntry[],
  current: string | null,
  key: string
) {
  const enabled = items.filter(item => !item.disabled)
  if (key === 'Home') return enabled[0]?.value
  if (key === 'End') return enabled.at(-1)?.value
  const index = enabled.findIndex(item => item.value === current)
  return enabled[Math.max(0, Math.min(enabled.length - 1, index + (key === 'ArrowUp' ? -1 : 1)))]
    ?.value
}

export function positionSelect(input: {
  trigger: {
    top: number
    bottom: number
    left: number
    right: number
    height: number
    width: number
  }
  width: number
  height: number
  selectedOffset: number
  viewport: { top: number; left: number; width: number; height: number }
  padding: number
  offset: number
  aligned: boolean
  rtl: boolean
}) {
  const { trigger, viewport, padding } = input
  const width = Math.min(
    Math.max(input.width, trigger.width),
    Math.max(0, viewport.width - 2 * padding)
  )
  const height = Math.min(input.height, Math.max(0, viewport.height - 2 * padding))
  let top = input.aligned
    ? trigger.top + trigger.height / 2 - input.selectedOffset
    : trigger.bottom + input.offset
  if (
    !input.aligned &&
    top + height > viewport.top + viewport.height - padding &&
    trigger.top - input.offset - height >= viewport.top + padding
  )
    top = trigger.top - input.offset - height
  top = Math.max(
    viewport.top + padding,
    Math.min(top, viewport.top + viewport.height - height - padding)
  )
  const preferredLeft = input.rtl ? trigger.right - width : trigger.left
  return {
    top,
    left: Math.max(
      viewport.left + padding,
      Math.min(preferredLeft, viewport.left + viewport.width - width - padding)
    ),
    width,
    maxHeight: height
  }
}
