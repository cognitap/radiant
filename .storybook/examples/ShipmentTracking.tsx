import { useState } from 'react'
import { Button } from '../../src/index.js'

export function ShipmentTracking() {
  const [tracking, setTracking] = useState(false)
  return (
    <div style={{ display: 'grid', justifyItems: 'start', gap: 'var(--rad-spacing-group-gap)' }}>
      <p style={{ margin: 0 }}>Ships in two days.</p>
      <Button onClick={() => setTracking(true)}>Track</Button>
      <output>
        {tracking ? 'Tracking update: the package is being prepared for dispatch.' : null}
      </output>
    </div>
  )
}
