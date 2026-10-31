import assert from 'node:assert/strict'
import test from 'node:test'
import { createNumberAdapter, addNumberStep } from '../dist/library/internal/numberField.js'
test('number editing parses localized decimals, digits and grouping without accepting mixed or embedded tokens', () => {
  for (const [locale, text, value] of [
    ['de-DE', '1.234,56', 1234.56],
    ['fr-FR', '1\u202f234,56', 1234.56],
    ['en-IN', '12,34,567.5', 1234567.5],
    ['ar-EG', '؜-١٬٢٣٤٫٥٦', -1234.56],
    ['fa-IR', '‎−۱٬۲۳۴٫۵۶', -1234.56],
    ['en-US', '.5', 0.5],
    ['de-DE', ',5', 0.5],
    ['en-US', '01', 1],
    ['en-US', '1.', 1]
  ])
    assert.equal(createNumberAdapter(locale).parse(text), value, locale + text)
  for (const [locale, text] of [
    ['en-US', '1,23'],
    ['en-IN', '123,456'],
    ['de-DE', '1,234.56'],
    ['en-US', '1e3'],
    ['en-US', 'NaN'],
    ['en-US', 'Infinity'],
    ['en-US', '1USD2'],
    ['en-US', '-'],
    ['en-US', '.'],
    ['en-US', '--2']
  ])
    assert.equal(createNumberAdapter(locale).parse(text), undefined, locale + text)
  assert.equal(createNumberAdapter('en-US').parse(''), null)
})
test('percent and currency adapters round display only and parse only complete localized affixes', () => {
  const percent = createNumberAdapter('de-DE', { style: 'percent', maximumFractionDigits: 1 })
  assert.equal(percent.parse('85,5 %'), 0.855)
  assert.equal(percent.parse('2,9 %'), 0.029)
  assert.equal(percent.parse(percent.format(1e308)), 1e308)
  assert.equal(percent.parse('85,5'), 0.855)
  assert.equal(percent.parse(percent.format(0.855)), 0.855)
  const currency = createNumberAdapter('en-US', {
    style: 'currency',
    currency: 'USD',
    currencySign: 'accounting',
    maximumFractionDigits: 2
  })
  assert.equal(currency.parse('($1,234.50)'), -1234.5)
  assert.equal(currency.parse('$1,234.50'), 1234.5)
  assert.equal(currency.parse('1234.50'), 1234.5)
  for (const text of ['$1$2', '1USD2', '($1,234.50', '1,234.50)'])
    assert.equal(currency.parse(text), undefined, text)
  assert.equal(currency.format(1.234), '$1.23')
  assert.equal(
    createNumberAdapter('fr-FR', { style: 'currency', currency: 'EUR' }).parse(
      '1\u202f234,50\u00a0€'
    ),
    1234.5
  )
})
test('unsupported or noninvertible display formats fail rather than misparse', () => {
  for (const options of [
    { style: 'unit', unit: 'meter' },
    { notation: 'compact' },
    { currencyDisplay: 'name' },
    { signDisplay: 'never' }
  ])
    assert.throws(() => createNumberAdapter('en-US', options), TypeError)
})
test('decimal coefficient stepping avoids binary addition tails and clamps finite extremes', () => {
  assert.equal(addNumberStep(0.1, 0.2), 0.3)
  assert.equal(addNumberStep(0.3, -0.1), 0.2)
  assert.equal(addNumberStep(0.9, 0.2, 0, 1), 1)
  assert.equal(addNumberStep(-0.9, -0.2, -1, 1), -1)
  assert.equal(addNumberStep(1e-20, 1e-20), 2e-20)
  assert.equal(addNumberStep(1e308, 1e308), 1e308)
  assert.equal(addNumberStep(1e308, 1e308, 0, Number.MAX_VALUE), Number.MAX_VALUE)
})
