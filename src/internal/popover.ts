export type PopoverSide = 'top' | 'right' | 'bottom' | 'left'
export type PopoverAlign = 'start' | 'center' | 'end'

type Rect = {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

/** Flip toward more space, constrain the surface, then shift within the visual viewport. */
export function positionPopover(input: {
  anchor: Rect
  width: number
  height: number
  viewport: { top: number; left: number; width: number; height: number }
  side: PopoverSide
  align: PopoverAlign
  offset: number
  padding: number
  rtl: boolean
}) {
  const { anchor, viewport, align, rtl } = input
  const padding = Math.max(0, input.padding)
  const offset = Math.max(0, input.offset)
  const leftEdge = viewport.left + padding
  const topEdge = viewport.top + padding
  const rightEdge = Math.max(leftEdge, viewport.left + viewport.width - padding)
  const bottomEdge = Math.max(topEdge, viewport.top + viewport.height - padding)
  const room = {
    top: Math.max(0, anchor.top - offset - topEdge),
    right: Math.max(0, rightEdge - anchor.right - offset),
    bottom: Math.max(0, bottomEdge - anchor.bottom - offset),
    left: Math.max(0, anchor.left - offset - leftEdge)
  }
  const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const
  let side = input.side
  const vertical = side === 'top' || side === 'bottom'
  const needed = vertical ? input.height : input.width
  if (room[side] < needed && room[opposite[side]] > room[side]) side = opposite[side]
  const maxWidth = Math.min(rightEdge - leftEdge, vertical ? Infinity : room[side])
  const maxHeight = Math.min(bottomEdge - topEdge, vertical ? room[side] : Infinity)
  const width = Math.min(Math.max(0, input.width), maxWidth)
  const height = Math.min(Math.max(0, input.height), maxHeight)
  const cross = (start: number, end: number, size: number, reverse: boolean) =>
    align === 'center'
      ? (start + end - size) / 2
      : (align === 'end') !== reverse
        ? end - size
        : start
  let left = vertical
    ? cross(anchor.left, anchor.right, width, rtl)
    : side === 'right'
      ? anchor.right + offset
      : anchor.left - offset - width
  let top = vertical
    ? side === 'bottom'
      ? anchor.bottom + offset
      : anchor.top - offset - height
    : cross(anchor.top, anchor.bottom, height, false)
  left = Math.max(leftEdge, Math.min(left, rightEdge - width))
  top = Math.max(topEdge, Math.min(top, bottomEdge - height))
  return { left, top, maxWidth, maxHeight, side, align }
}
