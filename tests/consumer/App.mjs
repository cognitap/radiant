import { createElement as h, useEffect, useState } from 'react'
import { Button } from '@cognitap/radiant'

export function App() {
  const [clicks, setClicks] = useState(0)
  const [submits, setSubmits] = useState(0)
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true'
  }, [])
  return h(
    'form',
    {
      onSubmit: event => {
        event.preventDefault()
        setSubmits(value => value + 1)
      }
    },
    h('h1', null, 'Installed Button'),
    h(Button, { onClick: () => setClicks(value => value + 1) }, 'Continue'),
    h(Button, { disabled: true, onClick: () => setClicks(value => value + 1) }, 'Unavailable'),
    h(Button, { type: 'submit', 'aria-label': 'Save' }, '✓'),
    h('output', { role: 'status' }, `Clicks: ${clicks}; Submits: ${submits}`)
  )
}
