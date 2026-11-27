'use client'

import { StandardIcon } from '../IconProvider/IconProvider.js'

/** The app's grip icon, or a six-dot grip in the current color, hidden from assistive technology. */
export function GripIcon() {
  return (
    <StandardIcon
      name="grip"
      fallback={<GripDots />}
    />
  )
}

function GripDots() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <circle
        cx="5.5"
        cy="3.5"
        r="1.25"
      />
      <circle
        cx="10.5"
        cy="3.5"
        r="1.25"
      />
      <circle
        cx="5.5"
        cy="8"
        r="1.25"
      />
      <circle
        cx="10.5"
        cy="8"
        r="1.25"
      />
      <circle
        cx="5.5"
        cy="12.5"
        r="1.25"
      />
      <circle
        cx="10.5"
        cy="12.5"
        r="1.25"
      />
    </svg>
  )
}
