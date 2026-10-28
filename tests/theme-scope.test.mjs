import assert from 'node:assert/strict'
import test from 'node:test'
import { act, createElement as h, createRef } from 'react'
import { renderToString } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { ThemeScope, Button, defineTheme, defaultTheme } from '../dist/library/index.js'
import { ticket } from '../dist/library/examples/index.js'

const brand = defineTheme({
  id: 'scope-brand',
  name: 'Scope brand',
  tokens: { color: { accent: 'red' }, control: { radius: '1rem' } },
  modes: { dark: { tokens: { color: { accent: 'pink' } } } }
})

function parse(node) {
  return new JSDOM(renderToString(node)).window.document
}

test('omitted theme and mode inherit ordinary CSS without materialising a new baseline', () => {
  const doc = parse(
    h('div', { style: { '--rad-color-accent': 'red' } }, h(ThemeScope, { id: 'inherited' }, 'Text'))
  )
  const scope = doc.getElementById('inherited')
  assert.equal(scope.style.getPropertyValue('--rad-color-accent'), '')
  assert.equal(scope.getAttribute('data-rad-mode'), null)
  assert.equal(scope.getAttribute('data-rad-theme'), null)
})

test('named scopes reset component exceptions while mode-only scopes retain the selected theme', () => {
  const doc = parse(
    h(
      ThemeScope,
      { theme: brand, mode: 'light', style: { '--rad-control-radius': '2rem' } },
      h(ThemeScope, { mode: 'dark', id: 'dark' }, h(Button, null, 'Dark')),
      h(ThemeScope, { theme: defaultTheme, id: 'reset' }, h(Button, null, 'Default'))
    )
  )
  const dark = doc.getElementById('dark')
  assert.equal(dark.style.getPropertyValue('--rad-control-radius'), '2rem')
  assert.match(dark.style.getPropertyValue('--rad-color-accent'), /red.*pink/)
  assert.equal(dark.getAttribute('data-rad-mode'), 'dark')
  const reset = doc.getElementById('reset')
  assert.equal(reset.style.getPropertyValue('--rad-control-radius'), '0.5rem')
  assert.equal(reset.style.getPropertyValue('--rad-button-radius'), 'initial')
  assert.equal(reset.getAttribute('data-rad-mode'), null)
})

test('local host styles win, named themes clear inherited inline exceptions and plain scopes retain them', () => {
  const style = { '--rad-button-radius': '4rem', fontStyle: 'italic' }
  const doc = parse(
    h(
      ThemeScope,
      { theme: ticket, style },
      h(ThemeScope, { id: 'plain' }, 'Plain'),
      h(ThemeScope, { id: 'reset', theme: defaultTheme, style: { '--rad-button-radius': '3rem' } })
    )
  )
  assert.equal(doc.querySelector('[data-rad-theme="ticket"]').style.fontStyle, 'italic')
  assert.equal(doc.getElementById('plain').style.getPropertyValue('--rad-button-radius'), '')
  assert.equal(doc.getElementById('reset').style.getPropertyValue('--rad-button-radius'), '3rem')
  assert.deepEqual(style, { '--rad-button-radius': '4rem', fontStyle: 'italic' })
})

test('server scope output is independent of browser preference and storage APIs', () => {
  const descriptors = new Map()
  for (const key of ['window', 'document', 'matchMedia', 'localStorage']) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, {
      configurable: true,
      get() {
        throw new Error(`Server theme rendering must not read ${key}`)
      }
    })
  }
  try {
    for (const mode of ['light', 'dark', 'system']) {
      const node = h(ThemeScope, { theme: JSON.parse(JSON.stringify(brand)), mode }, 'Text')
      assert.equal(renderToString(node), renderToString(node))
      assert.match(renderToString(node), new RegExp(`data-rad-mode="${mode}"`))
    }
  } finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})

test('scope host refs, handlers and server hydration preserve the documented div interface', async () => {
  const nodeRef = createRef()
  let clicks = 0
  const node = h(
    ThemeScope,
    { theme: brand, mode: 'system', ref: nodeRef, id: 'scope', onClick: () => clicks++ },
    h(Button, null, 'Save')
  )
  const dom = new JSDOM(`<div id="root">${renderToString(node)}</div>`, {
    pretendToBeVisual: true,
    url: 'http://localhost/'
  })
  const previous = new Map()
  for (const key of ['window', 'document', 'HTMLElement', 'Node']) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  previous.set(
    'IS_REACT_ACT_ENVIRONMENT',
    Object.getOwnPropertyDescriptor(globalThis, 'IS_REACT_ACT_ENVIRONMENT')
  )
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const errors = []
  let root
  try {
    const { hydrateRoot } = await import('react-dom/client')
    await act(async () => {
      root = hydrateRoot(document.getElementById('root'), node, {
        onRecoverableError: error => errors.push(error.message)
      })
    })
    assert.deepEqual(errors, [])
    assert.equal(nodeRef.current.tagName, 'DIV')
    assert.equal(nodeRef.current.id, 'scope')
    await act(async () => nodeRef.current.click())
    assert.equal(clicks, 1)
    await act(async () => root.unmount())
    assert.equal(nodeRef.current, null)
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
    dom.window.close()
  }
})

test('scope rejects unknown mode values instead of silently using the OS preference', () => {
  assert.throws(() => renderToString(h(ThemeScope, { mode: 'automatic' })), TypeError)
})
