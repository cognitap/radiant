import { createElement as h, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from '@cognitap/radiant'

const params = new URLSearchParams(location.search)
if (params.has('reset')) await import('@cognitap/radiant/reset.css')
if (!params.has('unstyled')) await import('@cognitap/radiant/styles.css')

function App() {
  const [count, setCount] = useState(0)
  return h(
    'main',
    null,
    h(Button, { id: 'default', onClick: () => setCount(count + 1) }, `Clicks: ${count}`),
    h(Button, { id: 'disabled', disabled: true }, 'Disabled'),
    h('div', { className: 'theme' }, h(Button, { id: 'themed' }, 'Themed')),
    h(Button, { id: 'custom', className: 'custom' }, 'Custom CSS')
  )
}

createRoot(document.getElementById('root')).render(h(App))
