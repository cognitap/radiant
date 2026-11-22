'use client'

import { createContext, useContext } from 'react'

/** Host-supplied text for controls the agent cannot describe. */
export type A2uiSurfaceLabels = {
  /** Text of the close button inside each Modal; without it, Escape and backdrop clicks dismiss. */
  readonly modalClose?: string
  /**
   * Name of the surface's own toast viewport. Inside a host `ToastProvider`, toasts use the
   * host's viewport instead; with neither, Toast components render nothing. Toasts outside an
   * open Modal stay inert while it is open.
   */
  readonly notifications?: string
  /** Text of the close button inside each Toast; Escape and the timeout (5 s unless set) also dismiss. */
  readonly toastClose?: string
  /** Text of each Reveal's previous-step button. */
  readonly revealPrevious?: string
  /** Text of each Reveal's next-step button. */
  readonly revealNext?: string
  /**
   * Visible, announced Reveal position for a zero-based index, such as `Step 2 of 4`. Without
   * it or either button label, a Reveal shows every step in order.
   */
  readonly revealPosition?: (index: number, count: number) => string
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

/** Whether Toast nodes have a named viewport: a host ToastProvider's or the surface's own. */
export type A2uiToastHost = { readonly available: boolean }

export const A2uiToastHostContext = createContext<A2uiToastHost>({ available: false })
