import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PasswordInput, Field, ThemeScope, defineTheme } from '@cognitap/radiant'
test('PasswordInput keeps one native autofill host and a named pressed Button in the real InputGroup', () => {
  const html = renderToStaticMarkup(
    h(
      Field,
      {
        label: 'Password',
        controlId: 'current',
        description: 'Workspace password',
        required: true
      },
      h(PasswordInput, {
        name: 'password',
        defaultValue: 'demo-password',
        ref: () => {
          throw Error('SSR ref')
        }
      })
    )
  )
  assert.equal((html.match(/<input /g) ?? []).length, 1)
  assert.match(html, /type="password"/)
  assert.match(html, /autoComplete="current-password"/)
  assert.match(html, /name="password"/)
  assert.match(html, /value="demo-password"/)
  assert.match(html, /id="current"/)
  assert.match(html, /for="current"/)
  assert.match(html, /data-slot="input input-group-input password-input"/)
  assert.match(html, /data-slot="input-group password-input-wrapper"/)
  assert.match(html, /data-slot="button password-input-toggle"/)
  assert.match(html, /type="button"/)
  assert.doesNotMatch(html, / aria-pressed=/)
  assert.match(html, /aria-controls="current"/)
  assert.match(html, /Show password/)
  assert.doesNotMatch(html, /aria-expanded|aria-live|type="hidden"/)
})
test('PasswordInput preserves native new-password, external forms and protected password type', () => {
  const html = renderToStaticMarkup(
    h(PasswordInput, {
      autoComplete: 'section-profile new-password',
      form: 'account',
      name: 'new-password',
      readOnly: true,
      defaultValue: 'demo-new-password',
      showLabel: 'Reveal credential',
      hideLabel: 'Conceal credential'
    })
  )
  assert.match(html, /autoComplete="section-profile new-password"/)
  assert.match(html, /form="account"/)
  assert.match(html, /readOnly=""/)
  assert.match(html, /Reveal credential/)
  const protectedHtml = renderToStaticMarkup(
    h(PasswordInput, JSON.parse('{"type":"text","defaultValue":"sample"}'))
  )
  assert.match(protectedHtml, /type="password"/)
  assert.doesNotMatch(protectedHtml, /type="text"/)
})
test('PasswordInput rejects contradictory owners, non-string values and unnamed reveal actions', () => {
  for (const props of [
    { value: 'one', defaultValue: 'two' },
    { value: null },
    { value: 123 },
    { defaultValue: 123 },
    { showLabel: ' ' },
    { hideLabel: '' }
  ])
    assert.throws(() => renderToStaticMarkup(h(PasswordInput, JSON.parse(JSON.stringify(props)))))
})
test('PasswordInput host styles stay on input and named parts style the actual wrapper and Button', () => {
  const html = renderToStaticMarkup(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'credential',
          name: 'Credential',
          components: { passwordInput: { gap: '6px' } }
        })
      },
      h(PasswordInput, {
        style: { color: 'red' },
        className: 'native-input',
        parts: {
          wrapper: { className: 'wrapper', style: { padding: '4px' } },
          toggle: { className: 'toggle', style: { fontSize: '12px' } }
        }
      })
    )
  )
  assert.match(html, /--rad-password-input-gap:6px/)
  assert.match(html, /<input [^>]*style="color:red"/)
  assert.match(html, /<input [^>]*class="[^"]*native-input/)
  assert.match(html, /<div [^>]*style="padding:4px"/)
  assert.match(html, /<button [^>]*style="font-size:12px"/)
})
