'use client'

import { createContext, useContext } from 'react'

/** Host-supplied text for controls the agent cannot describe. */
export type A2uiSurfaceLabels = {
  /** Text of the close button inside each Modal; without it, Escape and backdrop clicks dismiss. */
  readonly modalClose?: string
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
