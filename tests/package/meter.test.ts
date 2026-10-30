import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Meter, ThemeScope, defineTheme } from '@cognitap/radiant'
test('Meter renders one native labelled gauge with truthful range and human value text', () => {
  const html = renderToStaticMarkup(
    h(
      'label',
      {},
      'Storage',
      h(Meter, {
        value: 7.2,
        min: 0,
        max: 10,
        low: 6,
        high: 8.5,
        optimum: 0,
        'aria-valuetext': '7.2 GB of 10 GB used',
        style: { height: '12px' },
        ref: () => {
          throw Error('SSR ref')
        }
      })
    )
  )
  assert.equal((html.match(/<meter/g) ?? []).length, 1)
  assert.match(html, /value="7.2"/)
  assert.match(html, /min="0"/)
  assert.match(html, /max="10"/)
  assert.match(html, /low="6"/)
  assert.match(html, /high="8.5"/)
  assert.match(html, /optimum="0"/)
  assert.match(html, /aria-valuetext="7.2 GB of 10 GB used"/)
  assert.match(html, /data-tone="warning"/)
  assert.match(html, /height:12px/)
  assert.doesNotMatch(html, /<progress|<input|role=|tabindex=|aria-live=/)
  const defaults = renderToStaticMarkup(h(Meter, { value: 0.65 }))
  assert.match(defaults, /max="1"/)
  assert.match(defaults, /min="0"/)
  assert.match(defaults, /aria-valuetext="0.65 of 1"/)
  const protectedHtml = renderToStaticMarkup(
    h(
      Meter,
      JSON.parse(
        '{"value":5,"max":10,"role":"slider","aria-valuenow":99,"aria-valuemin":3,"aria-valuemax":99,"defaultValue":9,"data-slot":"custom"}'
      )
    )
  )
  assert.match(protectedHtml, /data-slot="meter custom"/)
  assert.doesNotMatch(
    protectedHtml,
    /role=|aria-valuenow=|aria-valuemin=|aria-valuemax=|defaultValue=/
  )
})
test('threshold tone follows native regions including inclusive boundaries and central optima', () => {
  const cases: [number, number, string][] = [
    [0, 0, 'accent'],
    [30, 0, 'accent'],
    [30.1, 0, 'warning'],
    [70, 0, 'warning'],
    [70.1, 0, 'danger'],
    [29.9, 100, 'danger'],
    [30, 100, 'warning'],
    [69.9, 100, 'warning'],
    [70, 100, 'accent'],
    [100, 100, 'accent'],
    [29.9, 50, 'warning'],
    [30, 50, 'accent'],
    [70, 50, 'accent'],
    [70.1, 50, 'warning'],
    [20, 30, 'warning'],
    [50, 30, 'accent'],
    [80, 70, 'warning']
  ]
  for (const [value, optimum, tone] of cases) {
    const html = renderToStaticMarkup(
      h(Meter, { value, min: 0, max: 100, low: 30, high: 70, optimum })
    )
    assert.match(html, new RegExp(`data-tone="${tone}"`), `${value}, optimum ${optimum}`)
  }
})
test('invalid or contradictory measured ranges and thresholds fail before rendering', () => {
  const cases = [
    { value: NaN },
    { value: Infinity },
    { value: -1 },
    { value: 2 },
    { value: 0.5, min: 1, max: 1 },
    { value: 0.5, min: 0, max: Infinity },
    { value: 0.5, min: NaN },
    { value: 0.5, low: 0.8, high: 0.2 },
    { value: 0.5, low: -0.1 },
    { value: 0.5, high: 2 },
    { value: 0.5, low: NaN },
    { value: 0.5, high: Infinity },
    { value: 0.5, optimum: 2 },
    { value: 0.5, optimum: NaN }
  ]
  for (const props of cases) assert.throws(() => renderToStaticMarkup(h(Meter, props)), RangeError)
  const negative = renderToStaticMarkup(
    h(Meter, { value: -5, min: -20, max: 40, low: 18, high: 24, optimum: 21 })
  )
  assert.match(negative, /value="-5"/)
  assert.match(negative, /data-tone="warning"/)
})
test('meter theme slots are typed and native props target the actual gauge', () => {
  const html = renderToStaticMarkup(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'meter',
          name: 'Meter',
          components: {
            meter: {
              height: '12px',
              radius: '2px',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'black',
              trackColor: 'white',
              indicatorColor: 'green',
              warningColor: 'orange',
              dangerColor: 'red'
            }
          }
        })
      },
      h(Meter, {
        value: 0.5,
        id: 'level',
        dir: 'rtl',
        className: 'custom',
        style: { borderRadius: 0 }
      })
    )
  )
  for (const name of [
    'height',
    'radius',
    'border-width',
    'border-style',
    'border-color',
    'track-color',
    'indicator-color',
    'warning-color',
    'danger-color'
  ])
    assert.match(html, new RegExp(`--rad-meter-${name}:`))
  assert.match(html, /id="level"/)
  assert.match(html, /dir="rtl"/)
  assert.match(html, /border-radius:0/)
  assert.match(html, /data-slot="meter"/)
})
