// @ts-nocheck
import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { ThemeScope, Button, defineTheme, defaultTheme } from '@cognitap/radiant'
import { ticket } from '@cognitap/radiant/examples'

const brand = defineTheme({
  id: 'scope-brand',
  name: 'Scope brand',
  tokens: { color: { accent: 'red' }, control: { radius: '1rem' } },
  modes: { dark: { tokens: { color: { accent: 'pink' } } } }
})

function opening(html, marker) {
  const at = html.indexOf(marker)
  assert.notEqual(at, -1, marker)
  const start = html.lastIndexOf('<', at)
  return html.slice(start, html.indexOf('>', at) + 1)
}
function attr(tag, name) {
  return new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(tag)?.[1] ?? null
}
function styleProp(tag, name) {
  const style = attr(tag, 'style') ?? ''
  const part = style
    .split(';')
    .map(item => item.trim())
    .find(item => item.startsWith(`${name}:`))
  return part ? part.slice(name.length + 1).trim() : ''
}

test('omitted theme and mode inherit ordinary CSS without materialising a new baseline', () => {
  const html = renderToString(
    h('div', { style: { '--rad-color-accent': 'red' } }, h(ThemeScope, { id: 'inherited' }, 'Text'))
  )
  const scope = opening(html, 'id="inherited"')
  assert.equal(styleProp(scope, '--rad-color-accent'), '')
  assert.equal(attr(scope, 'data-rad-mode'), null)
  assert.equal(attr(scope, 'data-rad-theme'), null)
})

test('named scopes reset component exceptions while mode-only scopes retain the selected theme', () => {
  const html = renderToString(
    h(
      ThemeScope,
      { theme: brand, mode: 'light', style: { '--rad-control-radius': '2rem' } },
      h(ThemeScope, { mode: 'dark', id: 'dark' }, h(Button, null, 'Dark')),
      h(ThemeScope, { theme: defaultTheme, id: 'reset' }, h(Button, null, 'Default'))
    )
  )
  const dark = opening(html, 'id="dark"')
  assert.equal(styleProp(dark, '--rad-control-radius'), '2rem')
  assert.match(styleProp(dark, '--rad-color-accent'), /red.*pink/)
  assert.equal(attr(dark, 'data-rad-mode'), 'dark')
  const reset = opening(html, 'id="reset"')
  assert.equal(styleProp(reset, '--rad-control-radius'), '0.5rem')
  assert.equal(styleProp(reset, '--rad-button-radius'), 'initial')
  assert.equal(attr(reset, 'data-rad-mode'), null)
})

test('local host styles win, named themes clear inherited inline exceptions and plain scopes retain them', () => {
  const style = { '--rad-button-radius': '4rem', fontStyle: 'italic' }
  const html = renderToString(
    h(
      ThemeScope,
      { theme: ticket, style },
      h(ThemeScope, { id: 'plain' }, 'Plain'),
      h(ThemeScope, { id: 'reset', theme: defaultTheme, style: { '--rad-button-radius': '3rem' } })
    )
  )
  assert.equal(styleProp(opening(html, 'data-rad-theme="ticket"'), 'font-style'), 'italic')
  assert.equal(styleProp(opening(html, 'id="plain"'), '--rad-button-radius'), '')
  assert.equal(styleProp(opening(html, 'id="reset"'), '--rad-button-radius'), '3rem')
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

test('scope rejects unknown mode values instead of silently using the OS preference', () => {
  assert.throws(() => renderToString(h(ThemeScope, { mode: 'automatic' })), TypeError)
})
