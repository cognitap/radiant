import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  getLocaleAttributes,
  LocaleProvider,
  NumberField,
  Radio,
  Switch,
  TagsInput,
  TimeInput,
  Toast,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from '@cognitap/radiant'

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

test('RTL SSR emits logical direction overrides, LTR clock runs and mirrored disclosure markers', () => {
  const markup = renderToStaticMarkup(
    h(
      LocaleProvider,
      { locale: 'ar-EG' },
      h(TimeInput, { 'aria-label': 'الوقت', defaultValue: '14:05' }),
      h(
        Collapsible,
        null,
        h(CollapsibleTrigger, null, 'تفاصيل'),
        h(CollapsibleContent, null, 'المحتوى')
      ),
      h(
        ToastProvider,
        null,
        h(
          ToastViewport,
          { 'aria-label': 'إشعارات' },
          h(Toast, { defaultOpen: true }, h(ToastTitle, null, 'تم الحفظ'))
        )
      ),
      h(
        LocaleProvider,
        { locale: 'fr-FR' },
        h(Switch, { dir: 'rtl', label: 'التنبيهات' }),
        h(Checkbox, { dir: 'rtl', label: 'موافقة' }),
        h(Radio, { dir: 'rtl', value: 'a', label: 'خيار' }),
        h(TagsInput, { dir: 'rtl', 'aria-label': 'وسوم', defaultValue: ['أول'] })
      )
    )
  )
  assert.match(markup, /<span dir="ltr" data-slot="time-input-clock"/)
  assert.match(markup, /rtl:rotate-180/)
  assert.match(markup, /end-\[var\(--rad-toast-inset,1rem\)\]/)
  assert.match(markup, /<label dir="rtl"[^>]*data-slot="switch-wrapper"/)
  assert.match(markup, /<label dir="rtl"[^>]*data-slot="checkbox-wrapper"/)
  assert.match(markup, /<label dir="rtl"[^>]*data-slot="radio-wrapper"/)
  assert.match(markup, /<div dir="rtl" data-slot="tags-input-root"/)
})
