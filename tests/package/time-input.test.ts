import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TimeInput, LocaleProvider } from '@cognitap/radiant'

test('the installed package renders locale-ordered hours, minutes, seconds and one named ISO field', () => {
  for (const locale of [
    'en-US',
    'en-GB',
    'de-DE',
    'fr-FR',
    'ar-EG',
    'he-IL',
    'th-TH-u-nu-thai',
    'zh-TW'
  ]) {
    const html = renderToStaticMarkup(
      h(
        LocaleProvider,
        { locale },
        h(TimeInput, { 'aria-label': 'Time', name: 'start', value: '14:05:25' })
      )
    )
    const parts = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC'
    }).formatToParts(Date.UTC(2000, 0, 1, 14, 5, 25))
    assert.deepEqual(
      [...html.matchAll(/data-segment="(\w+)"/g)].map(match => match[1]),
      parts.filter(part => part.type !== 'literal').map(part => part.type),
      locale
    )
    for (const part of parts.filter(p => ['hour', 'minute', 'second'].includes(p.type))) {
      assert.ok(
        html.match(new RegExp('data-segment="' + part.type + '"[^>]*value="' + part.value + '"')),
        locale + ' ' + part.type
      )
    }
    assert.match(html, /type="hidden"[^>]*name="start"[^>]*value="14:05:25"/)
  }
})
test('invalid time strings and unusable steps fail at the package boundary', () => {
  for (const props of [
    { value: '24:30' },
    { min: '09:99' },
    { max: 'noon' },
    { step: 0 },
    { step: 1.5 }
  ]) {
    assert.throws(
      () => renderToStaticMarkup(h(TimeInput, { 'aria-label': 'Time', ...props })),
      RangeError
    )
  }
})
