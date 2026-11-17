import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getLocaleAttributes, LocaleProvider, NumberField } from '@cognitap/radiant'

test('locale attributes preserve script and region and exclude formatting extensions', () => {
  assert.deepEqual(getLocaleAttributes(), {})
  assert.deepEqual(getLocaleAttributes('HE-il-u-nu-latn'), { lang: 'he-IL', dir: 'rtl' })
  assert.deepEqual(getLocaleAttributes('he-Latn'), { lang: 'he-Latn', dir: 'ltr' })
  assert.deepEqual(getLocaleAttributes('az-Arab-IR'), { lang: 'az-Arab-IR', dir: 'rtl' })
  assert.deepEqual(getLocaleAttributes('fr-FR'), { lang: 'fr-FR', dir: 'ltr' })
  assert.throws(() => getLocaleAttributes('en_US'), RangeError)
})

test('document scope is wrapper-free and numbers use the closest configured locale', () => {
  const markup = renderToStaticMarkup(
    h(
      'section',
      getLocaleAttributes('ar-EG'),
      h(
        LocaleProvider,
        { scope: 'document', locale: 'ar-EG' },
        h(NumberField, { 'aria-label': 'Outer amount', defaultValue: 1.5 }),
        h(
          LocaleProvider,
          { locale: 'fr-FR' },
          h(
            LocaleProvider,
            null,
            h(NumberField, { 'aria-label': 'Inner amount', defaultValue: 1.5 }),
            h(NumberField, { 'aria-label': 'Override', defaultValue: 1.5, locale: 'en-GB' })
          )
        )
      )
    )
  )
  assert.ok(markup.startsWith('<section lang="ar-EG" dir="rtl"><div data-slot='))
  assert.ok(markup.includes('<div lang="fr-FR" dir="ltr"><div>'))
  assert.match(markup, /aria-label="Outer amount"[^>]*value="١٫٥"/)
  assert.match(markup, /aria-label="Inner amount"[^>]*value="1,5"/)
  assert.match(markup, /aria-label="Override"[^>]*value="1\.5"/)
})
