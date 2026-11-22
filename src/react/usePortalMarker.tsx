'use client'

import { useState } from 'react'
import { htmlParent } from '../internal/popover.js'

/** A rect anchor has no node, so an inert marker finds the nearest HTML host, even inside SVG. */
export function usePortalMarker(enabled: boolean) {
  const [marker, setMarker] = useState<Element | null>(null)
  return {
    host: enabled ? htmlParent(marker) : null,
    marker: enabled ? (
      <span
        hidden
        aria-hidden
        data-slot="popup-marker"
        ref={setMarker}
      />
    ) : null
  }
}
