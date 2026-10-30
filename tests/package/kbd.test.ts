import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Kbd, KbdGroup, Button, ThemeScope, defineTheme } from '@cognitap/radiant'
test('keyboard combinations are real nested kbd elements with the same public key implementation', () => {
  const html = renderToStaticMarkup(
    h(KbdGroup, {
      children: [
        h(Kbd, { key: 'control', children: 'Control' }),
        '+',
        h(Kbd, { key: 'key', children: 'K' })
      ],
      ref: () => {
        throw new Error('SSR attached ref')
      },
      style: { color: 'red' }
    })
  )
  assert.equal((html.match(/<kbd/g) ?? []).length, 3)
  assert.match(html, /data-slot="kbd kbd-group"/)
  assert.match(html, /dir="ltr"/)
  assert.match(html, /color:red/)
  assert.doesNotMatch(html, /role=|tabindex=|onkeydown=/)
})
test('native button hints can be decorative without altering their action or shortcut metadata', () => {
  const html = renderToStaticMarkup(
    h(
      Button,
      { 'aria-label': 'Search projects', 'aria-keyshortcuts': 'Control+K' },
      h(Kbd, { children: 'Control + K', 'aria-hidden': true })
    )
  )
  assert.match(html, /aria-label="Search projects"/)
  assert.match(html, /aria-keyshortcuts="Control\+K"/)
  assert.match(html, /<kbd[^>]*aria-hidden="true"/)
  assert.equal((html.match(/<button/g) ?? []).length, 1)
  const passive = renderToStaticMarkup(
    h(
      Kbd,
      JSON.parse(
        '{"children":"K","role":"button","tabIndex":0,"contentEditable":true,"data-slot":"custom"}'
      )
    )
  )
  assert.match(passive, /data-slot="kbd custom"/)
  assert.doesNotMatch(passive, /role=|tabindex=|contentEditable=/)
})
test('keycap and combination tokens share one typed family and preserve caller customization', () => {
  const html = renderToStaticMarkup(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'keys',
          name: 'Keys',
          components: {
            kbd: {
              background: '#ffffff',
              color: '#222222',
              borderColor: '#777777',
              radius: '4px',
              fontSize: '12px',
              paddingInline: '6px',
              paddingBlock: '2px',
              shadow: 'none',
              gap: '3px'
            }
          }
        })
      },
      h(Kbd, { children: 'Esc', className: 'custom', style: { borderRadius: 0 }, id: 'escape' })
    )
  )
  for (const name of [
    'background',
    'color',
    'border-color',
    'radius',
    'font-size',
    'padding-inline',
    'padding-block',
    'shadow',
    'gap'
  ])
    assert.match(html, new RegExp(`--rad-kbd-${name}:`))
  assert.match(html, /border-radius:0/)
  assert.match(html, /id="escape"/)
})
