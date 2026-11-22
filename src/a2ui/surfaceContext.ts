'use client'

import { createContext, useContext } from 'react'

/** Host-supplied text for controls the agent cannot describe. */
export type A2uiSurfaceLabels = {
  /** Text of the close button inside each Modal; without it, Escape and backdrop clicks dismiss. */
  readonly modalClose?: string
  /** Name of the surface's notification region; without it, Toast components render nothing. */
  readonly notifications?: string
  /** Text of the close button inside each Toast; without it, Escape and the timeout dismiss. */
  readonly toastClose?: string
}

const EMPTY_LABELS: A2uiSurfaceLabels = {}

export const A2uiLabelsContext = createContext<A2uiSurfaceLabels>(EMPTY_LABELS)

export const useA2uiLabels = () => useContext(A2uiLabelsContext)

/** Identifies the Button a Modal renders in its `trigger` slot and the id it must carry. */
export type A2uiModalTrigger = {
  /** Instance id of the trigger node; Buttons deeper in the slot stay plain. */
  readonly nodeId: string
  readonly id: string
}

export const A2uiModalTriggerContext = createContext<A2uiModalTrigger | null>(null)

/** The surface's toast viewport, which `Toast` nodes portal into; null until it mounts. */
export type A2uiToastHost = {
  /** False when the host gave no `notifications` label, so the surface has no viewport. */
  readonly available: boolean
  readonly element: HTMLElement | null
}

export const A2uiToastHostContext = createContext<A2uiToastHost>({
  available: false,
  element: null
})
