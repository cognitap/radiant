import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as radiant from '@cognitap/radiant'
const { OTPField, Field, ThemeScope, defineTheme } = radiant
const ref = () => {
  throw new Error('Server attached ref')
}
test('OTPField keeps one named native form field, exact autofill hints and hidden visual slots', () => {
  const html = renderToStaticMarkup(
    h(
      Field,
      { label: 'Code', controlId: 'otp', required: true },
      h(OTPField, { defaultValue: '12', name: 'code', ref, style: { color: 'red' } })
    )
  )
  assert.equal((html.match(/<input/g) ?? []).length, 1)
  assert.equal((html.match(/data-slot="otp-field-slot"/g) ?? []).length, 6)
  assert.equal((html.match(/aria-hidden="true" data-slot="otp-field-slot"/g) ?? []).length, 6)
  assert.match(html, /data-slot="input otp-field"/)
  assert.match(html, /autoComplete="one-time-code"/)
  assert.match(html, /inputMode="numeric"/)
  assert.match(html, /pattern="\[0-9\]\{6\}"/)
  assert.match(html, /name="code"/)
  assert.match(html, /for="otp"/)
  assert.match(html, /color:red/)
  assert.equal('InputRoot' in radiant, false)
  assert.equal('inputVariants' in radiant, false)
})
test('OTPField themes reset and alphanumeric mode preserve the real native text host', () => {
  const html = renderToStaticMarkup(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'codes',
          name: 'Codes',
          components: { otpField: { gap: '8px', slotSize: '3rem' } }
        })
      },
      h(OTPField, {
        mode: 'alphanumeric',
        length: 8,
        defaultValue: 'AB12',
        readOnly: true,
        'aria-label': 'Approval',
        parts: { slot: { style: { borderRadius: 0 } } }
      })
    )
  )
  assert.match(html, /--rad-otp-field-gap:8px/)
  assert.match(html, /--rad-otp-field-slot-size:3rem/)
  assert.match(html, /pattern="\[a-zA-Z0-9\]\{8\}"/)
  assert.match(html, /readOnly=""/)
  assert.equal((html.match(/data-slot="otp-field-slot"/g) ?? []).length, 8)
})
test('invalid OTP length and contradictory native owners fail before rendering an ambiguous field', () => {
  assert.throws(() => renderToStaticMarkup(h(OTPField, { length: 2, defaultValue: '123' })), /fit/)
  for (const length of [0, -1, 1.5, 33, NaN])
    assert.throws(() => renderToStaticMarkup(h(OTPField, { length })), /length/)
  assert.throws(
    () => renderToStaticMarkup(h(OTPField, JSON.parse('{"value":"1","defaultValue":"2"}'))),
    /controlled value or a default/
  )
  assert.throws(() => renderToStaticMarkup(h(OTPField, JSON.parse('{"mode":"password"}'))), /mode/)
  assert.throws(() => renderToStaticMarkup(h(OTPField, JSON.parse('{"value":123}'))), /strings/)
})
