import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DatePicker, LocaleProvider } from '@cognitap/radiant'

test('DatePicker server-renders locale-ordered segments and one ISO form field from the package', () => {
  const date = '2028-02-29'
  for (const locale of ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'he-IL', 'ar-EG', 'th-TH-u-nu-thai']) {
    const html = renderToStaticMarkup(
      h(
        LocaleProvider,
        { locale },
        h(DatePicker, { 'aria-label': 'Arrival', name: 'arrival', value: date })
      )
    )
    const actual = Array.from(
      html.matchAll(/data-segment="(day|month|year)"[^>]*value="([^"]+)"/g),
      match => [match[1], match[2]]
    )
    const expected = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    })
      .formatToParts(new Date(date))
      .filter(part => ['day', 'month', 'year'].includes(part.type))
      .map(part => [part.type, part.value])
    assert.deepEqual(actual, expected, locale)
    assert.match(html, /type="hidden"[^>]*value="2028-02-29"/)
    assert.equal([...html.matchAll(/name="arrival"/g)].length, 1)
    assert.doesNotMatch(html, /role="dialog"/)
  }
})
