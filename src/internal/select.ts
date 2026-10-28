export type SelectEntry = { value: string; textValue: string; disabled?: boolean }

/** Native-like text matching, including repeated-letter cycling. */
export function matchSelectText(
  items: readonly SelectEntry[],
  text: string,
  current: string | null
) {
  const search = text.toLocaleLowerCase()
  const repeated = search.length > 1 && [...search].every(letter => letter === search[0])
  const query = repeated ? search[0] : search
  const index = items.findIndex(item => item.value === current)
  const ordered = [...items.slice(index + 1), ...items.slice(0, index + 1)]
  if (query.length > 1 && index >= 0) ordered.unshift(items[index])
  return ordered.find(
    item => !item.disabled && item.textValue.toLocaleLowerCase().startsWith(query)
  )?.value
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
