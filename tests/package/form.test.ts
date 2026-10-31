import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Form, FormField, FormError, Input, defineTheme, useForm } from '@cognitap/radiant'
test('Form composes native hosts, Field errors and an actual Alert without storing values', () => {
  const html = renderToStaticMarkup(
    h(
      Form,
      {
        'aria-label': 'Registration',
        defaultErrors: { fields: { email: 'Already registered.' }, form: 'Check your address.' }
      },
      h(
        FormField,
        { name: 'email', label: 'Email' },
        h(Input, { name: 'email', defaultValue: 'owner@example.com' })
      ),
      h(FormError)
    )
  )
  assert.match(html, /<form/)
  assert.match(html, /data-slot="form"/)
  assert.match(html, /value="owner@example.com"/)
  assert.match(html, /Already registered\./)
  assert.match(html, /data-slot="alert form-error"/)
  assert.match(html, /aria-invalid="true"/)
  assert.equal((html.match(/name="email"/g) ?? []).length, 1)
})
test('Form exports a typed theme and rejects contradictory state owners and orphan parts', () => {
  assert.ok(
    defineTheme({ id: 'form-test', name: 'Form test', components: { form: { gap: '20px' } } })
  )
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(Form, { 'aria-label': 'Invalid', errors: {}, defaultErrors: {} } as never)
      ),
    /controlled value or a default/
  )
  assert.throws(
    () => renderToStaticMarkup(h(FormField, { name: 'email', label: 'Email' })),
    /inside Form/
  )
  assert.throws(() => renderToStaticMarkup(h(FormError)), /inside Form/)
  assert.throws(() => renderToStaticMarkup(h(Form, {} as never)), /requires aria-label/)
  function Outside() {
    assert.equal(useForm(), null)
    return null
  }
  renderToStaticMarkup(h(Outside))
})
