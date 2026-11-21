'use client'

import { useLayoutEffect } from 'react'
import { Skeleton } from '../components/Skeleton/Skeleton.js'
import type { ThemeStyle } from '../themes/defineTheme.js'

/** Counts mounted placeholders so the surface can expose `aria-busy` while it is incomplete. */
export function createPlaceholderTracker() {
  let count = 0
  const listeners = new Set<() => void>()
  const notify = () => {
    for (const listener of listeners) listener()
  }
  return {
    add() {
      count++
      notify()
      return () => {
        count--
        notify()
      }
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => count
  }
}

export type PlaceholderTracker = ReturnType<typeof createPlaceholderTracker>

// One body line, so a streamed Text or inline label replaces it without reflow.
const BLOCK_STYLE: ThemeStyle = {
  '--rad-skeleton-height':
    'calc(var(--rad-typography-roles-ui-body-size,1rem) * var(--rad-typography-roles-ui-body-line-height,1.5))'
}
const INLINE_STYLE: ThemeStyle = {
  '--rad-skeleton-width': '6ch',
  '--rad-skeleton-height': '1lh'
}

/** Decorative stand-in for a component that has not streamed in yet. */
export function A2uiPlaceholder({
  nodeId,
  inline,
  tracker
}: {
  readonly nodeId?: string
  readonly inline: boolean
  readonly tracker: PlaceholderTracker
}) {
  useLayoutEffect(() => tracker.add(), [tracker])
  return (
    <Skeleton
      data-slot="a2ui-placeholder"
      data-node-id={nodeId}
      className={inline ? 'inline-block align-middle' : undefined}
      style={inline ? INLINE_STYLE : BLOCK_STYLE}
    />
  )
}
