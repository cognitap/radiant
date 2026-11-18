import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DateRangePicker } from '@cognitap/radiant'
test('installed range fields render localized dates with independently named ISO values', () => {
  const props = {
    startLabel: 'Start',
    endLabel: 'End',
    startName: 'arrival',
    endName: 'departure',
    locale: 'th-TH-u-nu-thai'
  }
  const html = renderToStaticMarkup(
    h(DateRangePicker, { ...props, defaultValue: { start: '2028-02-29', end: '2028-03-03' } })
  )
  assert.equal([...html.matchAll(/data-segment="year"[^>]*value="๒๕๗๑"/g)].length, 2)
  assert.match(html, /type="hidden"[^>]*name="arrival"[^>]*value="2028-02-29"/)
  assert.match(html, /type="hidden"[^>]*name="departure"[^>]*value="2028-03-03"/)
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(DateRangePicker, { ...props, value: { start: '2028-03-01', end: '2028-02-29' } })
      ),
    /end must be on or after start/
  )
})
