import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import {
  Resizable,
  ResizablePanel,
  ResizableHandle,
  Separator,
  ThemeScope,
  defineTheme
} from '@cognitap/radiant'
const items = [
  { value: 'files', min: 20, max: 50, collapsible: true },
  { value: 'preview', min: 40, max: 100 }
]
function sample(props: Record<string, unknown> = {}) {
  return h(
    Resizable,
    { items, defaultValue: [30, 70], ...props },
    h(ResizablePanel, { value: 'files' }, 'File list'),
    h(ResizableHandle, { 'aria-label': 'Files', value: 'files' }),
    h(ResizablePanel, { value: 'preview' }, 'Preview')
  )
}
test('Resizable SSR owns one percentage layout and composes a named native Separator with actual div panels', () => {
  const html = render(sample())
  assert.match(html, /data-slot="resizable"/)
  assert.match(html, /data-slot="resizable-panel"/)
  assert.match(html, /<hr[^>]+role="separator"[^>]+tabindex="0"/)
  assert.match(html, /data-slot="separator resizable-handle"/)
  assert.match(html, /aria-valuenow="30"/)
  assert.match(html, /aria-valuemin="0"/)
  assert.match(html, /aria-valuemax="50"/)
  assert.match(html, /aria-orientation="vertical"/)
  const id = html.match(/aria-controls="([^"]+)"/)?.[1]
  assert.ok(id)
  assert.ok(html.includes('id="' + id + '"'))
  assert.match(html, /--_rad-resizable-size:30/)
  assert.doesNotMatch(html, /aria-live=/)
})
test('collapsed SSR panels keep children mounted but hidden and inert, and vertical groups use horizontal separators', () => {
  const html = render(sample({ defaultValue: [0, 100], orientation: 'vertical', dir: 'rtl' }))
  assert.match(html, /<div[^>]+hidden=""[^>]+inert=""[^>]+data-slot="resizable-panel"/)
  assert.match(html, /File list/)
  assert.match(html, /aria-orientation="horizontal"/)
  assert.match(html, /dir="rtl"/)
  const passive = render(
    h(Separator, JSON.parse('{"interactive":true,"tabIndex":0,"role":"button"}'))
  )
  assert.doesNotMatch(passive, /tabindex=|role=/)
})
test('Resizable rejects missing or contradictory owners, bad totals, duplicate keys and orphan or unnamed parts', () => {
  for (const props of [
    { value: [30, 70], defaultValue: [30, 70] },
    { defaultValue: [30, 60] },
    { defaultValue: [10, 90] },
    { items: [{ value: 'a' }, { value: 'a' }] }
  ])
    assert.throws(() => render(sample(props)), TypeError)
  assert.throws(() => render(h(Resizable, JSON.parse(JSON.stringify({ items })))), TypeError)
  assert.throws(() => render(h(ResizablePanel, { value: 'files' })), /inside Resizable/)
  assert.throws(
    () => render(h(ResizableHandle, { 'aria-label': 'Files', value: 'files' })),
    /inside Resizable/
  )
  assert.throws(
    () =>
      render(
        h(
          Resizable,
          { items, defaultValue: [30, 70] },
          h(ResizableHandle, { value: 'files', 'aria-label': ' ' })
        )
      ),
    /aria-label|aria-labelledby/
  )
})
test('Resizable exposes isolated typed theme slots and caller classes override native handle metrics', () => {
  const html = render(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'split',
          name: 'Split',
          components: { resizable: { handleSize: '12px', handleColor: 'red', focusWidth: '3px' } }
        })
      },
      h(
        Resizable,
        { items, defaultValue: [30, 70], className: 'layout', style: { height: '300px' } },
        h(ResizablePanel, { value: 'files', style: { background: 'red' } }),
        h(ResizableHandle, {
          value: 'files',
          'aria-label': 'Files',
          className: 'w-4 focus-visible:outline-0',
          style: { background: 'blue' }
        }),
        h(ResizablePanel, { value: 'preview' })
      )
    )
  )
  assert.match(html, /--rad-resizable-handle-size:12px/)
  assert.match(html, /<hr[^>]*class="[^"]*w-4/)
  assert.match(html, /<hr[^>]*style="background:blue"/)
  const handle = html.match(/<hr[^>]+>/)?.[0] ?? ''
  assert.doesNotMatch(handle, /w-\[length:var\(--rad-resizable-handle-size/)
  assert.doesNotMatch(handle, /focus-visible:outline-\[length:var\(--rad-resizable-focus-width/)
})
