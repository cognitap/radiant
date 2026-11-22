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
   * Reveal position text, such as `Step {index} of {count}` with `{index}` counting from 1, or a
   * function of the zero-based index and count; keep a function's identity stable. Without it or
   * either button label, a Reveal shows every step in order and reports a `defaulted` diagnostic.
   */
  readonly revealPosition?: string | ((index: number, count: number) => string)
  /**
   * Name and placeholder of a filterable ChoicePicker's filter input, such as `Filter {label}`
   * with the picker's label, or a function of that label; keep a function's identity stable.
   * Without it, filterable pickers show every option and report a `defaulted` diagnostic.
   */
  readonly filter?: string | ((label: string) => string)
  /** Describes each SortableList handle: how to pick up, move, drop and cancel by keyboard. */
  readonly sortableInstructions?: string
  /**
   * SortableList announcements, such as `{item}, position {position} of {count}` with
   * `{position}` counting from 1, or functions of the item text, zero-based index and count.
   * Without all five sortable labels, a SortableList shows its items in order without
   * reordering and reports a `defaulted` diagnostic.
   */
  readonly sortablePickUp?: A2uiSortableText
  readonly sortableMove?: A2uiSortableText
  readonly sortableDrop?: A2uiSortableText
  readonly sortableCancel?: A2uiSortableText
  /** Optional name for each SortableList handle, such as `Move {item}`; the item text by default. */
  readonly sortableHandle?: string | ((item: string) => string)
}

/** A SortableList announcement template or function; keep a function's identity stable. */
export type A2uiSortableText = string | ((item: string, index: number, count: number) => string)

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
