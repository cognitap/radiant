// Every focus ring reads one chain: the family's slot, then the shared focus tokens, then the
// baseline. A family with its own focus tokens fills the private `--_rad-focus-*` slots under
// the same state that draws its ring, so the slots never leak into nested hosts.
// An unset family token leaves its slot empty and the shared token takes over.

/** The ring for a host that takes keyboard focus itself. */
export const focusRingClass =
  'focus-visible:outline-[length:var(--_rad-focus-width,var(--rad-focus-width,2px))] focus-visible:outline-offset-[var(--_rad-focus-offset,var(--rad-focus-offset,0px))] focus-visible:[outline-style:var(--_rad-focus-style,var(--rad-focus-style,solid))] forced-colors:focus-visible:outline-[Highlight] focus-visible:rad-focus-edge'

/** A scroll box draws its ring inside its edge, where overflow cannot clip it. */
export const focusRingInsetClass =
  'focus-visible:[--_rad-focus-offset:calc(0px_-_var(--_rad-focus-width,var(--rad-focus-width,2px)))]'

/** The ring for a visible stand-in that follows a focused `peer` input. */
export const peerFocusRingClass =
  'peer-focus-visible:outline-[length:var(--_rad-focus-width,var(--rad-focus-width,2px))] peer-focus-visible:outline-offset-[var(--_rad-focus-offset,var(--rad-focus-offset,0px))] peer-focus-visible:[outline-style:var(--_rad-focus-style,var(--rad-focus-style,solid))] forced-colors:peer-focus-visible:outline-[Highlight] peer-focus-visible:rad-focus-edge'

/** The ring for a field shell around a focused child control. */
export const focusWithinRingClass =
  'focus-within:outline-[length:var(--_rad-focus-width,var(--rad-focus-width,2px))] focus-within:outline-offset-[var(--_rad-focus-offset,var(--rad-focus-offset,0px))] focus-within:[outline-style:var(--_rad-focus-style,var(--rad-focus-style,solid))] forced-colors:focus-within:outline-[Highlight] focus-within:rad-focus-edge'

/** The ring for a field shell whose direct input child has keyboard focus. */
export const childFocusRingClass =
  'has-[>input:focus-visible]:outline-[length:var(--_rad-focus-width,var(--rad-focus-width,2px))] has-[>input:focus-visible]:outline-offset-[var(--_rad-focus-offset,var(--rad-focus-offset,0px))] has-[>input:focus-visible]:[outline-style:var(--_rad-focus-style,var(--rad-focus-style,solid))] forced-colors:has-[>input:focus-visible]:outline-[Highlight] has-[>input:focus-visible]:rad-focus-edge'

/** The ring for a slot that shows where a hidden input's caret is. */
export const activeRingClass =
  'data-active:outline-[length:var(--_rad-focus-width,var(--rad-focus-width,2px))] data-active:outline-offset-[var(--_rad-focus-offset,var(--rad-focus-offset,0px))] data-active:[outline-style:var(--_rad-focus-style,var(--rad-focus-style,solid))] forced-colors:data-active:outline-[Highlight] data-active:rad-focus-edge'
