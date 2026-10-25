import assert from 'node:assert/strict'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/'
})

for (const key of [
  'window',
  'document',
  'HTMLElement',
  'Node',
  'Element',
  'MutationObserver',
  'getComputedStyle',
  'DocumentFragment'
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: dom.window[key]
  })
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const { act, createElement, createRef } = await import('react')
const { hydrateRoot } = await import('react-dom/client')
const { renderToString } = await import('react-dom/server')
const { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } =
  await import('../dist/library/index.js')

const refs = Object.fromEntries(
  ['card', 'card-header', 'card-title', 'card-description', 'card-content', 'card-footer'].map(
    part => [part, createRef()]
  )
)

function card(props = {}) {
  return createElement(
    Card,
    { ref: refs.card, ...props },
    createElement(
      CardHeader,
      { ref: refs['card-header'] },
      createElement(CardTitle, { id: 'ship', ref: refs['card-title'] }, 'Shipping'),
      createElement(
        CardDescription,
        { ref: refs['card-description'] },
        'Leaves the studio tomorrow.'
      )
    ),
    createElement(CardContent, { ref: refs['card-content'] }, 'Ships in two days.'),
    createElement(
      CardFooter,
      { ref: refs['card-footer'] },
      createElement('a', { href: '/orders/1' }, 'Details')
    )
  )
}

test('a card hydrates as a grouped surface and not a control', async () => {
  const html = renderToString(card())
  const opening = /<div\b[^>]*data-slot="card"[^>]*>/.exec(html)?.[0] ?? ''
  assert.match(opening, /^<div\b/)
  assert.match(opening, /data-slot="card"/)
  assert.doesNotMatch(opening, /\srole=/)
  assert.doesNotMatch(opening, /tabindex/i)
  assert.match(html, /<h2\b[^>]*\sid="ship"[^>]*>Shipping<\/h2>/)
  assert.match(html, /data-slot="card-description"/)
  assert.match(html, /data-slot="card-content"/)
  assert.match(html, /data-slot="card-footer"/)
  assert.match(html, /<a\b[^>]*href="\/orders\/1"/)

  const host = document.getElementById('root')
  host.innerHTML = html
  const recoverable = []
  let hydrated
  await act(async () => {
    hydrated = hydrateRoot(host, card(), {
      onRecoverableError(error) {
        recoverable.push(String(error))
      }
    })
  })
  assert.deepEqual(recoverable, [])
  const surface = host.querySelector('[data-slot="card"]')
  assert.equal(surface.tagName, 'DIV')
  assert.equal(surface.getAttribute('tabindex'), null)
  assert.equal(host.querySelector('[data-slot="card-title"]').tagName, 'H2')
  for (const [part, ref] of Object.entries(refs)) {
    assert.equal(ref.current, host.querySelector(`[data-slot~="${part}"]`))
  }
  await act(async () => hydrated.unmount())
  for (const ref of Object.values(refs)) assert.equal(ref.current, null)
})

test('the title level and a consumer region stay explicit', () => {
  const html = renderToString(
    createElement(
      Card,
      { role: 'region', 'aria-labelledby': 'pack-title' },
      createElement(CardTitle, { id: 'pack-title', level: 3 }, 'Pack')
    )
  )
  const opening = /<div\b[^>]*data-slot="card"[^>]*>/.exec(html)?.[0] ?? ''
  assert.match(opening, /role="region"/)
  assert.match(opening, /aria-labelledby="pack-title"/)
  assert.match(html, /<h3\b[^>]*\sid="pack-title"[^>]*>Pack<\/h3>/)
})
