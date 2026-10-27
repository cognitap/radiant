import assert from 'node:assert/strict'
import * as Radiant from '@cognitap/radiant'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Button,
  Checkbox,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Link,
  Radio,
  RadioGroup,
  themes,
  ThemeScope,
  defineTheme,
  defineThemeDocument,
  compileThemeDocument,
  parseThemeDocument,
  updateThemeDocument,
  exportThemeSections,
  themeDocumentFromDefinition,
  defaultTheme,
  useField
} from '@cognitap/radiant'

const root = new URL('node_modules/@cognitap/radiant/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
const require = createRequire(import.meta.url)

test('public JavaScript imports and renders on the server', () => {
  const html = renderToStaticMarkup(createElement(Button, { disabled: true }, 'Save'))
  assert.match(html, /^<button\b[^>]*\stype="button"/)
  assert.match(html, /disabled=""/)
  assert.match(html, /Save/)
  assert.deepEqual(
    Object.keys(Radiant)
      .filter(name => name.endsWith('Theme'))
      .sort(),
    ['defaultTheme', 'defineTheme']
  )
})

test('action defaults and data attributes separate treatment, palette and visual size', () => {
  for (const [Component, variant] of [
    [Button, 'solid'],
    [Link, 'inline']
  ]) {
    const html = renderToStaticMarkup(createElement(Component, null, 'Continue'))
    assert.match(html, new RegExp(`data-variant="${variant}"`))
    assert.match(html, /data-tone="accent"/)
    assert.match(html, /data-control-size="medium"/)
    assert.doesNotMatch(html, /\sdata-size=/)
  }
  const html = renderToStaticMarkup(
    createElement(
      Link,
      {
        href: '/download',
        download: 'report.pdf',
        variant: 'outline',
        tone: 'danger',
        controlSize: 'large'
      },
      'Report'
    )
  )
  assert.match(html, /href="\/download"/)
  assert.match(html, /download="report.pdf"/)
  assert.match(html, /data-variant="outline"/)
  assert.match(html, /data-tone="danger"/)
  assert.match(html, /data-control-size="large"/)
  assert.doesNotMatch(html, /\s(variant|tone|controlSize)=/)
})

test('an omitted type stays button when formAction is set', () => {
  const html = renderToStaticMarkup(createElement(Button, { formAction: '/publish' }, 'Publish'))
  assert.match(html, /\stype="button"/)
  assert.match(html, /formAction="\/publish"/)
  assert.match(html, /Publish/)
})

test('an explicit type submit stays submit', () => {
  const html = renderToStaticMarkup(createElement(Button, { type: 'submit' }, 'Save'))
  assert.match(html, /\stype="submit"/)
  assert.match(html, /Save/)
})

test('pending keeps the label, blocks the disabled attribute, and marks the button busy', () => {
  const html = renderToStaticMarkup(createElement(Button, { pending: true }, 'Save'))
  assert.match(html, /aria-busy="true"/)
  assert.doesNotMatch(html, /\sdisabled(?=[\s>=])/)
  assert.match(html, /Save/)
  assert.match(html, /animate-spin/)
})

test('settings pick classes and stay off the DOM', () => {
  const html = renderToStaticMarkup(
    createElement(
      Button,
      { variant: 'solid', tone: 'danger', controlSize: 'small', fullWidth: true },
      'Delete'
    )
  )
  const classAttribute = / class="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /\[--_action-color:var\(--rad-color-danger,/)
  assert.doesNotMatch(classAttribute, /--rad-color-accent,/)
  assert.match(
    classAttribute,
    /\[--_btn-h:var\(--rad-button-height-small,var\(--rad-control-small-height,2rem\)\)\]/
  )
  assert.match(
    classAttribute,
    /\[--_btn-radius:var\(--rad-button-radius,var\(--rad-control-radius,/
  )
  assert.match(classAttribute, /\bw-full\b/)
  assert.match(html, /\sdata-slot="button"/)
  assert.match(html, /\sdata-variant="solid"/)
  assert.match(html, /\sdata-control-size="small"/)
  assert.doesNotMatch(html, /\s(variant|tone|controlSize|fullwidth|fullWidth|icononly|iconOnly)=/)
})

test('iconOnly squares the button at its size', () => {
  const html = renderToStaticMarkup(
    createElement(Button, { iconOnly: true, controlSize: 'large', 'aria-label': 'Close' }, 'x')
  )
  const classAttribute = / class="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /\bsize-\(--_btn-h\)/)
  assert.match(classAttribute, /\bpx-0\b/)
  assert.doesNotMatch(classAttribute, /\bpx-\(--_btn-px\)/)
})

test('rounded-full replaces the themed radius on the class attribute', () => {
  const html = renderToStaticMarkup(createElement(Button, { className: 'rounded-full' }, 'Save'))
  const classAttribute = / class="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /\brounded-full\b/)
  assert.doesNotMatch(classAttribute, /(^|\s)rounded-\(--_btn-radius\)/)
  assert.match(html, /Save/)
})

test('links render as native anchors with native attributes intact', () => {
  const html = renderToStaticMarkup(
    createElement(Link, { href: '/guide', download: true }, 'Read the guide')
  )
  assert.match(html, /^<a\b[^>]*\shref="\/guide"/)
  assert.match(html, /\sdownload=""/)
  assert.match(html, /\sdata-slot="link"/)
  assert.match(html, /\sdata-variant="inline"/)
  assert.match(html, /Read the guide/)
  const classAttribute = / class="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /(?:^|\s)underline(?:\s|$)/)
  assert.doesNotMatch(html, /\s(variant|tone|controlSize|external|render)=/)
})

test('external links gain safe target and rel unless the consumer set them', () => {
  const external = renderToStaticMarkup(
    createElement(Link, { href: 'https://example.com', external: true }, 'Example')
  )
  assert.match(external, /\starget="_blank"/)
  assert.match(external, /\srel="noopener noreferrer"/)
  const custom = renderToStaticMarkup(
    createElement(
      Link,
      { href: 'https://example.com', external: true, target: '_self', rel: 'author' },
      'Example'
    )
  )
  assert.match(custom, /\starget="_self"/)
  assert.match(custom, /\srel="author"/)
})

test('button-styled links reuse the Button variant classes', () => {
  const html = renderToStaticMarkup(
    createElement(
      Link,
      { href: '/delete', variant: 'solid', tone: 'danger', controlSize: 'small' },
      'Delete space'
    )
  )
  assert.match(html, /^<a\b/)
  assert.match(html, /\sdata-variant="solid"/)
  const classAttribute = / class="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /\[--_action-color:var\(--rad-color-danger,/)
  assert.match(
    classAttribute,
    /\[--_btn-h:var\(--rad-button-height-small,var\(--rad-control-small-height,2rem\)\)\]/
  )
  assert.doesNotMatch(classAttribute, /(?:^|\s)underline(?:\s|$)/)
  assert.doesNotMatch(html, /\s(tone|controlSize)=/)
})

test('the render prop hands anchor props to a router adapter', () => {
  const html = renderToStaticMarkup(
    createElement(
      Link,
      {
        href: '/docs',
        render: props => createElement('a', { ...props, 'data-router-link': 'true' })
      },
      'Routed docs'
    )
  )
  assert.match(html, /\sdata-router-link="true"/)
  assert.match(html, /\shref="\/docs"/)
  assert.match(html, /\sdata-slot="link"/)
  assert.match(html, /Routed docs/)
})

function ReadingControl() {
  const field = useField()
  return createElement('input', {
    ...field?.controlProps,
    'data-layout': field?.layout ?? 'outside',
    'data-control': field?.controlProps ? 'set' : 'none'
  })
}

test('a field labels an explicit native adapter and keeps native attributes', () => {
  const html = renderToStaticMarkup(
    createElement(Field, { label: 'Email', description: 'Work address', required: true }, control =>
      createElement('input', { ...control, name: 'email', type: 'email', autoComplete: 'email' })
    )
  )
  const inputId = /<input\b[^>]*\sid="([^"]+)"/.exec(html)?.[1]
  assert.ok(inputId)
  assert.match(html, new RegExp(`<label\\b[^>]*\\sfor="${inputId}"`))
  assert.match(html, /name="email"/)
  assert.match(html, /type="email"/)
  assert.match(html, /autoComplete="email"/)
  assert.match(html, /\srequired=""/)
  assert.match(html, /aria-required="true"/)
  assert.match(html, /aria-describedby="[^"]+"/)
  assert.match(html, /Work address/)
  assert.match(html, /\sdata-slot="field"/)
  assert.match(html, /\sdata-layout="control"/)
  assert.match(html, /\sdata-required=""/)
  assert.match(html, /\sdata-slot="field-required"/)
  assert.match(html, /aria-hidden="true"/)
  assert.doesNotMatch(html, /aria-invalid/)
  assert.doesNotMatch(html, /\sdata-invalid=/)
  assert.doesNotMatch(html, /\s(label|description|error|layout|requiredIndicator)=/)
})

test('an error marks the control invalid without changing its id', () => {
  const props = { label: 'Email', description: 'Work address' }
  const input = control => createElement('input', { ...control, name: 'email' })
  const calm = renderToStaticMarkup(createElement(Field, props, input))
  const invalid = renderToStaticMarkup(
    createElement(Field, { ...props, error: 'Enter an email.' }, input)
  )
  const id = /<input\b[^>]*\sid="([^"]+)"/.exec(calm)?.[1]
  assert.ok(id)
  assert.match(invalid, new RegExp(`id="${id}"`))
  assert.match(invalid, /aria-invalid="true"/)
  assert.match(invalid, /\sdata-invalid=""/)
  assert.match(invalid, /\srole="alert"/)
  assert.match(invalid, /Enter an email\./)
  const describedBy = /aria-describedby="([^"]+)"/.exec(invalid)?.[1] ?? ''
  assert.equal(describedBy.split(' ').length, 2)
  assert.match(calm, new RegExp(`aria-describedby="${describedBy.split(' ')[0]}"`))
})

test('an empty error clears the invalid state', () => {
  const html = renderToStaticMarkup(
    createElement(Field, { label: 'Email', error: '' }, createElement('input', { name: 'email' }))
  )
  assert.doesNotMatch(html, /aria-invalid/)
  assert.doesNotMatch(html, /\srole="alert"/)
  const external = renderToStaticMarkup(
    createElement(Field, { layout: 'group', label: 'Plan', error: '', 'aria-invalid': 'grammar' })
  )
  assert.match(external, /aria-invalid="grammar"/)
  assert.doesNotMatch(external, /\sdata-invalid=/)
})

test('native children are left untouched; controlId and adapters own their relationships', () => {
  const child = createElement('input', { id: 'native', 'aria-describedby': 'hint' })
  const untouched = renderToStaticMarkup(
    createElement(Field, { label: 'Email', required: true, error: 'Missing' }, child)
  )
  assert.match(untouched, /<input id="native" aria-describedby="hint"\/>/)
  assert.doesNotMatch(untouched, /<label\b[^>]*\sfor="native"/)

  const html = renderToStaticMarkup(
    createElement(
      Field,
      { label: 'Email', description: 'Work address', controlId: 'email' },
      control =>
        createElement('input', {
          ...control,
          'aria-describedby': `${control['aria-describedby']} hint`
        })
    )
  )
  assert.match(html, /<label\b[^>]*\sfor="email"/)
  assert.match(html, /<input\b[^>]*\sid="email"/)
  const describedBy = /<input\b[^>]*\saria-describedby="([^"]+)"/.exec(html)?.[1] ?? ''
  assert.ok(describedBy.split(' ').includes('hint'))
  assert.equal(describedBy.split(' ').length, 2)
  assert.doesNotMatch(html, /\scontrolId=/)
})

test('a group uses a fieldset and does not label each control', () => {
  const html = renderToStaticMarkup(
    createElement(
      Field,
      {
        layout: 'group',
        label: 'Notifications',
        form: 'profile',
        name: 'channels',
        'aria-invalid': false,
        'aria-describedby': 'hint hint',
        description: 'Choose any',
        error: 'Pick at least one.',
        required: true,
        disabled: true
      },
      createElement('input', { type: 'checkbox', name: 'channels' })
    )
  )
  assert.match(html, /^<fieldset\b/)
  assert.match(html, /<fieldset\b[^>]*\sform="profile"/)
  assert.match(html, /<fieldset\b[^>]*\sname="channels"/)
  const ids = /aria-describedby="([^"]+)"/.exec(html)[1].split(' ')
  assert.equal(ids.length, 3)
  assert.equal(ids.at(-1), 'hint')
  assert.match(html, /<legend\b/)
  assert.match(html, /\sdisabled=""/)
  assert.match(html, /aria-invalid="true"/)
  assert.doesNotMatch(html, /<fieldset\b[^>]*\saria-required=/)
  assert.match(html, /aria-describedby="[^"]+"/)
  assert.match(html, /\sdata-layout="group"/)
  assert.doesNotMatch(html, /<legend\b[^>]*\sfor=/)
  assert.doesNotMatch(html, /<input\b[^>]*\sid=/)
  assert.doesNotMatch(html, /<input\b[^>]*\saria-invalid/)
  assert.doesNotMatch(html, /\srequired=""/)
})

test('part styling preserves the adapter and owned accessibility relationships', () => {
  const html = renderToStaticMarkup(
    createElement(
      Field,
      {
        label: 'Email',
        description: 'Work address',
        error: 'Missing',
        required: true,
        'data-slot': 'custom field custom',
        parts: {
          label: { className: 'italic', style: { fontWeight: 700 }, id: 'wrong', htmlFor: 'wrong' },
          description: { className: 'help', style: { fontStyle: 'italic' } },
          error: { className: 'error', style: { fontWeight: 700 }, role: 'none' },
          required: {
            className: 'marker',
            style: { marginInlineStart: '0.5em' },
            'aria-hidden': false
          }
        }
      },
      control => createElement('input', { ...control, name: 'email' })
    )
  )
  const id = /<input\b[^>]*\sid="([^"]+)"/.exec(html)?.[1]
  assert.ok(id)
  assert.match(html, /data-slot="field custom"/)
  assert.match(html, new RegExp(`<label\\b[^>]*\\sfor="${id}"`))
  assert.match(html, /aria-invalid="true"/)
  assert.match(html, /name="email"/)
  assert.match(html, /class="[^"]*italic[^"]*" style="font-weight:700"/)
  assert.match(html, /class="[^"]*help[^"]*" style="font-style:italic"/)
  assert.match(html, /class="[^"]*error[^"]*" style="font-weight:700"/)
  assert.match(
    html,
    /aria-hidden="true"[^>]*class="[^"]*marker[^"]*" style="margin-inline-start:0.5em"/
  )
  assert.match(html, /role="alert"/)
  assert.doesNotMatch(html, /wrong|role="none"|aria-hidden="false"|parts=/)
})

test('useField wires a component child and is null outside a field', () => {
  const inside = renderToStaticMarkup(
    createElement(
      Field,
      { label: 'Email', description: 'Work address' },
      createElement(ReadingControl)
    )
  )
  const id = /<input\b[^>]*\sid="([^"]+)"/.exec(inside)?.[1]
  assert.ok(id)
  assert.match(inside, new RegExp(`<label\\b[^>]*\\sfor="${id}"`))
  assert.match(inside, /data-layout="control"/)
  assert.match(inside, /data-control="set"/)
  const outside = renderToStaticMarkup(createElement(ReadingControl))
  assert.match(outside, /data-layout="outside"/)
  assert.match(outside, /data-control="none"/)
})

test('the required marker is replaceable and stays out of the accessible name', () => {
  const custom = renderToStaticMarkup(
    createElement(
      Field,
      { label: 'Email', required: true, requiredIndicator: '(required)' },
      createElement('input', { name: 'email' })
    )
  )
  assert.match(custom, /\(required\)/)
  assert.match(custom, /aria-hidden="true"/)
  const hidden = renderToStaticMarkup(
    createElement(Field, { label: 'Email', required: true, requiredIndicator: null }, control =>
      createElement('input', { ...control, name: 'email' })
    )
  )
  assert.doesNotMatch(hidden, /data-slot="field-required"/)
  assert.match(hidden, /\srequired=""/)
})

test('inputs preserve native attributes and the character-width size', () => {
  const html = renderToStaticMarkup(
    createElement(Input, {
      name: 'email',
      type: 'email',
      autoComplete: 'email',
      defaultValue: 'ada@example.com',
      placeholder: 'you@example.com',
      size: 24,
      controlSize: 'large',
      required: true,
      id: 'email'
    })
  )
  assert.match(html, /^<input\b/)
  assert.match(html, /\stype="email"/)
  assert.match(html, /\sname="email"/)
  assert.match(html, /\sautoComplete="email"/)
  assert.match(html, /\svalue="ada@example.com"/)
  assert.match(html, /\splaceholder="you@example.com"/)
  assert.match(html, /\ssize="24"/)
  assert.match(html, /data-control-size="large"/)
  assert.doesNotMatch(html, /\scontrolSize=/)
  assert.match(html, /\srequired=""/)
  assert.match(html, /\sid="email"/)
  assert.match(html, /\sdata-slot="input"/)
  const classAttribute = / class="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /--rad-input-height/)
})

test('Field protects owned relationships across the native control families', () => {
  for (const Control of [Input, Checkbox, Radio]) {
    const html = renderToStaticMarkup(
      createElement(
        Field,
        {
          label: 'Required value',
          controlId: 'owned',
          description: 'Help',
          error: 'Required',
          required: true,
          disabled: true
        },
        createElement(Control, {
          name: 'answer',
          id: 'other',
          value: Control === Radio ? 'yes' : undefined,
          required: false,
          disabled: false,
          'aria-invalid': false,
          'aria-required': false,
          'aria-describedby': 'hint hint'
        })
      )
    )
    const input = /<input\b[^>]*>/.exec(html)[0]
    assert.match(html, /<label\b[^>]*\sfor="owned"/)
    assert.match(input, /\sid="owned"/)
    assert.match(input, /\srequired=""/)
    assert.match(input, /\sdisabled=""/)
    assert.match(input, /aria-invalid="true"/)
    if (Control === Radio) assert.doesNotMatch(input, /aria-required=/)
    else assert.match(input, /aria-required="true"/)
    assert.match(input, /data-invalid=""/)
    const ids = /aria-describedby="([^"]+)"/.exec(input)[1].split(' ')
    assert.equal(ids.length, 3)
    assert.equal(ids.at(-1), 'hint')
    const external = renderToStaticMarkup(
      createElement(Control, {
        value: Control === Radio ? 'yes' : undefined,
        'aria-invalid': 'grammar'
      })
    )
    assert.match(external, /aria-invalid="grammar"/)
    assert.match(external, /data-invalid=""/)
  }
})

test('an input inside a group keeps its own description', () => {
  const html = renderToStaticMarkup(
    createElement(
      Field,
      { layout: 'group', label: 'Plan', description: 'Pick one' },
      createElement(Input, { name: 'plan' })
    )
  )
  assert.match(html, /^<fieldset\b/)
  assert.doesNotMatch(html, /<input\b[^>]*\saria-describedby=/)
  assert.doesNotMatch(html, /<input\b[^>]*\saria-invalid=/)
})

test('checkboxes preserve name, value, and checked state', () => {
  const html = renderToStaticMarkup(
    createElement(Checkbox, {
      label: 'Email',
      name: 'channels',
      value: 'email',
      defaultChecked: true
    })
  )
  assert.match(html, /<label\b/)
  assert.match(html, /type="checkbox"/)
  assert.match(html, /name="channels"/)
  assert.match(html, /value="email"/)
  assert.match(html, /\schecked=""/)
  assert.match(html, /Email/)
  assert.match(html, /\sdata-slot="checkbox"/)
  assert.doesNotMatch(html, /\sindeterminate=/)
  assert.doesNotMatch(html, /\stype="(?!checkbox")/)
})

test('checkboxes keep their own identity in a Field group', () => {
  const group = renderToStaticMarkup(
    createElement(
      Field,
      { layout: 'group', label: 'Notifications', description: 'Choose any' },
      createElement(Checkbox, { label: 'Email', name: 'channels', value: 'email' })
    )
  )
  assert.match(group, /^<fieldset\b/)
  assert.match(group, /data-slot="checkbox-label"/)
  assert.doesNotMatch(group, /<input\b[^>]*\saria-describedby=/)
})

for (const [Control, slot] of [
  [Checkbox, 'checkbox'],
  [Radio, 'radio']
]) {
  test(`${slot} styling keeps native props on the input and part hooks on their own hosts`, () => {
    for (const label of ['Option', undefined]) {
      const html = renderToStaticMarkup(
        createElement(Control, {
          label,
          name: 'choice',
          value: 'yes',
          className: 'appearance-auto',
          style: { margin: 0 },
          parts: {
            wrapper: { className: 'custom-wrapper', style: { gap: '1rem' }, id: 'wrong' },
            label: { className: 'custom-label', style: { fontStyle: 'italic' }, htmlFor: 'wrong' },
            indicator: {
              className: 'custom-indicator',
              style: { opacity: 0.5 },
              'aria-hidden': false,
              'data-slot': 'wrong'
            }
          }
        })
      )
      const input = /<input\b[^>]*>/.exec(html)?.[0] ?? ''
      assert.match(input, /class="[^"]*appearance-auto[^"]*"/)
      assert.match(input, /style="margin:0"/)
      assert.match(input, /name="choice"/)
      assert.match(input, new RegExp(`data-slot="${slot}"`))
      assert.match(input, new RegExp(`type="${slot}"`))
      assert.doesNotMatch(input, /appearance-none|custom-wrapper|custom-label|custom-indicator/)
      assert.match(
        html,
        new RegExp(
          `^<${label ? 'label' : 'span'}[^>]*custom-wrapper[^>]*style="gap:1rem"[^>]*data-slot="${slot}-wrapper"`
        )
      )
      assert.equal(html.includes(`data-slot="${slot}-label"`), !!label)
      if (label) assert.match(html, /custom-label[^>]*style="font-style:italic"/)
      assert.match(
        html,
        new RegExp(
          `aria-hidden="true"[^>]*custom-indicator[^>]*style="opacity:0.5"[^>]*data-slot="${slot}-indicator"`
        )
      )
      assert.doesNotMatch(html, /wrong|aria-hidden="false"|parts=/)
    }
  })
}

test('a radio group shares one name and checks the default value', () => {
  const html = renderToStaticMarkup(
    createElement(
      RadioGroup,
      { label: 'Plan', name: 'plan', defaultValue: 'pro', description: 'Billed monthly' },
      createElement(Radio, { label: 'Free', value: 'free' }),
      createElement(Radio, { label: 'Pro', value: 'pro' })
    )
  )
  assert.match(html, /^<fieldset\b/)
  assert.doesNotMatch(html, /role="radiogroup"/)
  assert.match(html, /<legend\b[^>]*>Plan/)
  assert.equal(html.match(/type="radio"/g)?.length, 2)
  assert.equal(html.match(/name="plan"/g)?.length, 2)
  assert.equal(html.match(/\schecked=""/g)?.length, 1)
  assert.match(html, /value="pro"[^>]*\schecked=""|checked=""[^>]*value="pro"/)
  assert.match(html, /^<fieldset\b[^>]*data-slot="field radio-group"/)
  assert.match(html, /<div\b[^>]*data-slot="radio-group-options"/)
  assert.match(html, /data-slot="radio"/)
  const fieldset = /^<fieldset\b[^>]*>/.exec(html)?.[0] ?? ''
  assert.doesNotMatch(fieldset, /\sname=/)
})

test('a required RadioGroup keeps native option labels and validity', () => {
  const group = renderToStaticMarkup(
    createElement(
      RadioGroup,
      { label: 'Plan', name: 'plan', description: 'Choose one', required: true },
      createElement(Radio, { label: 'Pro', value: 'pro', required: false, 'aria-required': false })
    )
  )
  assert.doesNotMatch(group, /<fieldset\b[^>]*\saria-required=/)
  assert.match(group, /data-slot="radio-label"/)
  assert.match(group, /<input\b[^>]*\srequired=""/)
  assert.doesNotMatch(group, /<input\b[^>]*\saria-describedby=/)
})

test('a dialog stays closed in server markup and names itself from its title', () => {
  const html = renderToStaticMarkup(
    createElement(
      Dialog,
      { defaultOpen: true, closeOnBackdrop: false, closeOnEscape: false, onOpenChange() {} },
      createElement(DialogTrigger, null, 'Edit'),
      createElement(
        DialogContent,
        {
          className: 'bg-transparent open:p-0',
          style: { '--rad-dialog-width': '24rem' },
          open: true,
          id: 'wrong-panel',
          'data-slot': 'wrong-panel',
          'data-state': 'wrong-state',
          'aria-describedby': 'external external'
        },
        createElement(DialogClose, null, 'Close'),
        createElement(
          DialogDescription,
          { id: 'wrong-description', className: 'italic', style: { fontStyle: 'italic' } },
          'Visible to your team.'
        ),
        createElement(
          DialogTitle,
          {
            id: 'wrong-title',
            className: 'font-normal',
            style: { '--rad-dialog-title-size': '1.25rem' }
          },
          'Edit profile'
        )
      )
    )
  )
  const dialogTag = /<dialog\b[^>]*>/.exec(html)?.[0] ?? ''
  assert.doesNotMatch(dialogTag, /\sopen(?:=|\s|>)/)
  assert.doesNotMatch(html, /closeOnBackdrop|closeOnEscape|onOpenChange/)
  assert.match(dialogTag, /data-slot="dialog"/)
  assert.match(dialogTag, /data-state="open"/)
  assert.match(dialogTag, /style="--rad-dialog-width:24rem"/)
  assert.doesNotMatch(html, /wrong-panel|wrong-state|wrong-title|wrong-description/)
  assert.match(html, /aria-haspopup="dialog"/)
  assert.match(html, /aria-expanded="true"/)
  const controls = /aria-controls="([^"]+)"/.exec(html)?.[1]
  const labelledBy = /aria-labelledby="([^"]+)"/.exec(dialogTag)?.[1]
  const descriptions = /aria-describedby="([^"]+)"/.exec(dialogTag)?.[1].split(' ')
  const describedBy = descriptions?.[0]
  assert.deepEqual(descriptions?.slice(1), ['external'])
  assert.ok(controls)
  assert.match(dialogTag, new RegExp(`\\sid="${controls}"`))
  assert.match(html, new RegExp(`<h2\\b[^>]*\\sid="${labelledBy}"`))
  assert.match(html, new RegExp(`<p\\b[^>]*\\sid="${describedBy}"`))
  assert.ok(html.indexOf('Visible to your team.') < html.indexOf('Edit profile'))
  const classAttribute = /<dialog\b[^>]*\sclass="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /\bbg-transparent\b/)
  assert.doesNotMatch(classAttribute, /dialog-background/)
  assert.match(classAttribute, /open:p-0/)
  assert.doesNotMatch(classAttribute, /open:p-\[/)
  const titleTag = /<h2\b[^>]*>/.exec(html)?.[0] ?? ''
  const descriptionTag = /<p\b[^>]*>/.exec(html)?.[0] ?? ''
  assert.match(titleTag, /font-normal/)
  assert.match(titleTag, /style="--rad-dialog-title-size:1.25rem"/)
  assert.match(descriptionTag, /italic/)
  assert.match(descriptionTag, /style="font-style:italic"/)
})

test('a disclosure renders a summary and keeps closed content in the document', () => {
  const html = renderToStaticMarkup(
    createElement(
      Collapsible,
      { name: 'faq', onOpenChange() {}, className: 'bg-transparent' },
      createElement(CollapsibleContent, null, 'Ships in two days.'),
      createElement(CollapsibleTrigger, null, 'Shipping')
    )
  )
  const details = /<details\b[^>]*>/.exec(html)?.[0] ?? ''
  assert.match(details, /^<details\b/)
  assert.doesNotMatch(details, /\sopen(?:=|\s|>)/)
  assert.match(details, /data-slot="collapsible"/)
  assert.match(details, /data-state="closed"/)
  assert.match(details, /\sname="faq"/)
  assert.doesNotMatch(html, /onOpenChange/)
  assert.match(html, /<summary\b[^>]*data-slot="collapsible-trigger"/)
  assert.match(html, /data-slot="collapsible-content"/)
  assert.ok(html.indexOf('Ships in two days.') < html.indexOf('Shipping'))
  const classAttribute = /<details\b[^>]*\sclass="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /\bbg-transparent\b/)
  assert.doesNotMatch(classAttribute, /collapsible-background/)
})

test('an accordion opens its default section and keeps the rest closed', () => {
  const html = renderToStaticMarkup(
    createElement(
      Accordion,
      { className: 'bg-transparent', defaultValue: 'shipping', onValueChange() {} },
      createElement(
        AccordionItem,
        {
          value: 'shipping',
          name: 'ignored',
          'data-slot': 'custom custom',
          style: { '--rad-collapsible-padding': '18px' }
        },
        createElement(
          AccordionTrigger,
          { 'data-slot': 'custom', 'data-state': 'wrong' },
          'Shipping'
        ),
        createElement(AccordionContent, null, 'Ships in two days.')
      ),
      createElement(
        AccordionItem,
        { disabled: true, value: 'returns' },
        createElement(AccordionTrigger, null, 'Returns'),
        createElement(AccordionContent, null, 'Returns are free for 30 days.')
      )
    )
  )
  const root = /<div\b[^>]*data-slot="accordion"[^>]*>/.exec(html)?.[0] ?? ''
  const details = [...html.matchAll(/<details\b[^>]*>/g)].map(match => match[0])
  assert.match(root, /data-type="single"/)
  assert.match(root, /\bbg-transparent\b/)
  assert.doesNotMatch(html, /onValueChange|defaultValue/)
  assert.match(details[0], /\sopen=""/)
  assert.match(details[0], /data-value="shipping"/)
  assert.doesNotMatch(details[1], /\sopen(?:=|\s|>)/)
  assert.match(details[1], /data-disabled/)
  assert.match(html, /<summary\b[^>]*aria-disabled="true"[^>]*tabindex="-1"/)
  assert.match(html, /<h3\b[^>]*>Shipping<\/h3>/)
  assert.match(details[0], /data-slot="collapsible accordion-item custom"/)
  assert.doesNotMatch(details[0], /\sname=/)
  assert.match(details[0], /style="--rad-collapsible-padding:18px"/)
  assert.match(
    html,
    /<summary\b[^>]*data-slot="collapsible-trigger accordion-trigger custom"[^>]*data-state="open"/
  )
  assert.match(html, /data-slot="collapsible-content accordion-content"/)
  assert.doesNotMatch(html, /data-state="wrong"/)
})

test('a card groups content without becoming a control', () => {
  const html = renderToStaticMarkup(
    createElement(
      Card,
      {
        className: 'bg-transparent p-0',
        'data-slot': 'product product',
        style: { '--rad-card-padding': '18px' },
        id: 'shipping-card'
      },
      createElement(
        CardHeader,
        { 'data-slot': 'product' },
        createElement(
          CardTitle,
          { level: 3, 'data-slot': 'product', style: { '--rad-card-title-size': '20px' } },
          'Shipping'
        ),
        createElement(CardDescription, { 'data-slot': 'product' }, 'Leaves the studio tomorrow.')
      ),
      createElement(CardContent, { 'data-slot': 'product' }, 'Ships in two days.'),
      createElement(
        CardFooter,
        { 'data-slot': 'product' },
        createElement(Link, { href: '/orders/1' }, 'Details'),
        createElement(Button, null, 'Track')
      )
    )
  )
  const opening = /<div\b[^>]*data-slot="card product"[^>]*>/.exec(html)?.[0] ?? ''
  assert.match(opening, /data-slot="card product"/)
  assert.doesNotMatch(opening, /\srole=/)
  assert.doesNotMatch(opening, /tabindex/i)
  assert.match(html, /<h3\b[^>]*>Shipping<\/h3>/)
  assert.match(html, /data-slot="card-description product"/)
  assert.match(html, /data-slot="card-footer product"/)
  assert.match(html, /<a\b[^>]*href="\/orders\/1"/)
  const classAttribute =
    /<div\b[^>]*data-slot="card product"[^>]*\sclass="([^"]*)"/.exec(html)?.[1] ??
    /<div\b[^>]*\sclass="([^"]*)"[^>]*data-slot="card product"/.exec(html)?.[1] ??
    ''
  assert.match(classAttribute, /\bbg-transparent\b/)
  assert.doesNotMatch(classAttribute, /card-background|(?:^|\s)p-\[/)
  assert.match(classAttribute, /\bp-0\b/)
  assert.match(opening, /id="shipping-card"/)
  assert.match(opening, /style="--rad-card-padding:18px"/)
  for (const part of ['header', 'title', 'description', 'content', 'footer']) {
    assert.match(html, new RegExp(`data-slot="card-${part} product"`))
  }
  assert.match(html, /data-slot="button"/)
  assert.match(html, /data-slot="link"/)
})

test('themes are shared presets selected by stable identity with resolved modes', () => {
  assert.deepEqual(
    themes.map(theme => theme.name),
    ['Radiant', 'Default', 'Soft squircle', 'Expressive', 'Glass', 'Sharp 3D', 'Jelly', 'Ticket']
  )
  const ticket = themes.find(theme => theme.id === 'ticket')
  assert.equal(ticket?.modes.light['--rad-color-accent'], '#a43e19')
  assert.equal(ticket?.modes.light['--rad-control-corner-shape'], 'scoop')
  assert.notEqual(
    ticket?.modes.light['--rad-color-accent'],
    ticket?.modes.dark['--rad-color-accent']
  )
})

test('the installed public theme API supports serializable themes and nested baseline resets on the server', () => {
  const theme = defineTheme({
    id: 'consumer',
    name: 'Consumer',
    tokens: { control: { radius: '2rem' } },
    components: {
      button: { fontFamily: 'serif' },
      link: { underlineOffset: '0.3em' },
      field: { labelWeight: 650 },
      input: { height: '3rem' },
      checkbox: { size: '1.25rem' },
      radio: { labelGap: '0.5rem' },
      radioGroup: { gap: '1rem' },
      dialog: { width: '24rem' },
      collapsible: { duration: '0ms' },
      accordion: { gap: '0.5rem' },
      card: { titleWeight: 550 }
    }
  })
  const html = renderToStaticMarkup(
    createElement(
      ThemeScope,
      { theme: JSON.parse(JSON.stringify(theme)), mode: 'dark' },
      createElement(ThemeScope, { theme: defaultTheme }, 'Neutral')
    )
  )
  for (const [variable, value] of Object.entries({
    '--rad-button-font-family': 'serif',
    '--rad-link-underline-offset': '0.3em',
    '--rad-field-label-weight': 650,
    '--rad-input-height': '3rem',
    '--rad-checkbox-size': '1.25rem',
    '--rad-radio-label-gap': '0.5rem',
    '--rad-radio-group-gap': '1rem',
    '--rad-dialog-width': '24rem',
    '--rad-collapsible-duration': '0ms',
    '--rad-accordion-gap': '0.5rem',
    '--rad-card-title-weight': 550
  })) {
    for (const mode of ['light', 'dark']) assert.equal(theme.modes[mode][variable], value)
  }
  assert.deepEqual(Object.keys(theme).sort(), ['id', 'modes', 'motion', 'name'])
  assert.match(html, /data-rad-theme="consumer" data-rad-mode="dark"/)
  assert.match(html, /data-rad-theme="default"/)
  assert.match(html, /--rad-button-font-family:initial/)
  assert.match(html, /--rad-control-radius:0.5rem/)
  assert.throws(
    () => defineTheme({ id: 'bad', name: 'Bad', tokens: { color: { primary: 'red' } } }),
    TypeError
  )
})

test('public JavaScript and declaration maps point to shipped sources', () => {
  for (const artifact of Object.values(manifest.exports['.'])) {
    assert.ok(existsSync(new URL(artifact, root)), `Missing public artifact: ${artifact}`)
    const mapURL = new URL(`${artifact}.map`, root)
    const map = JSON.parse(readFileSync(mapURL, 'utf8'))
    for (const source of map.sources) {
      assert.ok(
        existsSync(new URL(`${map.sourceRoot ?? ''}${source}`, mapURL)),
        `Missing mapped source: ${source}`
      )
    }
  }
})

test('installed modules retain their declared client boundaries and CSS side effects', () => {
  for (const file of [
    'Button',
    'Field',
    'Input',
    'Checkbox',
    'RadioGroup',
    'Dialog',
    'Collapsible',
    'Accordion',
    'ThemeScope'
  ]) {
    assert.match(
      readFileSync(new URL(`dist/library/${file}.js`, root), 'utf8'),
      /^['"]use client['"]/
    )
  }
  for (const file of ['index', 'Card', 'Link']) {
    assert.doesNotMatch(
      readFileSync(new URL(`dist/library/${file}.js`, root), 'utf8'),
      /^['"]use client['"]/
    )
  }
  assert.deepEqual(manifest.sideEffects, ['**/*.css'])
})

test('exports reject implementation deep imports', async () => {
  for (const path of [
    'src/Button.tsx',
    'src/Field.tsx',
    'src/Input.tsx',
    'src/Checkbox.tsx',
    'src/RadioGroup.tsx',
    'src/Dialog.tsx',
    'src/Collapsible.tsx',
    'src/Accordion.tsx',
    'src/Card.tsx',
    'dist/library/Button.js',
    'cn',
    'package.json'
  ]) {
    await assert.rejects(import(`@cognitap/radiant/${path}`), {
      code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
    })
  }
})

test('default styles and the optional reset are compiled and self-contained', () => {
  const readExport = name =>
    readFileSync(new URL(import.meta.resolve(`@cognitap/radiant/${name}`)), 'utf8')
  for (const name of ['styles.css', 'reset.css']) {
    assert.doesNotMatch(readExport(name), /@(import|theme|source|tailwind)\b/)
  }
  const styles = readExport('styles.css')
  assert.match(styles, /--rad-color-accent\s*:/)
  assert.doesNotMatch(styles, /--(?:color-primary|color-background|radius-control|ease-spring)\s*:/)
  assert.match(styles, /\.bg-\\\(--_btn-bg\\\)(?=\s*[{,])/)
  assert.doesNotMatch(styles, /(?:^|[{}])\s*h1\s*,\s*h2\s*,\s*h3\b/)
  assert.match(readExport('reset.css'), /h1\s*,\s*h2\s*,\s*h3\b/)
})

test('installed pure typography exports replay through the public document compiler', async () => {
  const typography = await import('@cognitap/radiant/typography')
  const root = await import('@cognitap/radiant')
  assert.equal(typography.generateTypography, root.generateTypography)
  const result = typography.generateTypography({ preset: 'source-serif' })
  assert.equal(typography.typographyRoles.length, 16)
  assert.ok(Object.isFrozen(typography.typographyPresets.inter.fonts))
  const document = root.defineThemeDocument({
    kind: 'radiant-theme',
    version: 1,
    id: 'installed-type',
    name: 'Installed type',
    sections: { typography: { typesetting: JSON.parse(JSON.stringify(result.input)) } }
  })
  assert.equal(
    root.compileThemeDocument(document).modes.light['--rad-typography-roles-prose-body-size'],
    '1.3125rem'
  )
})

test('the installed package declares shared React and needs no Tailwind', () => {
  const libraryRequire = createRequire(import.meta.resolve('@cognitap/radiant'))
  assert.equal(typeof manifest.peerDependencies?.react, 'string')
  assert.equal(libraryRequire.resolve('react'), require.resolve('react'))
  assert.equal(manifest.peerDependenciesMeta?.tailwindcss?.optional, true)
  assert.throws(() => require.resolve('tailwindcss'), { code: 'MODULE_NOT_FOUND' })
})

test('the archive includes MIT licensing and public documentation', () => {
  assert.equal(manifest.name, '@cognitap/radiant')
  assert.equal(manifest.license, 'MIT')
  assert.match(readFileSync(new URL('LICENSE', root), 'utf8'), /MIT License[\s\S]*Cserei Zoltán/)
  for (const file of [
    'README.md',
    'CHANGELOG.md',
    'RELEASE_POLICY.md',
    'docs/system.md',
    'docs/accessibility.md',
    'docs/theming.md'
  ]) {
    assert.ok(readFileSync(new URL(file, root), 'utf8').trim().length > 0, file)
  }
})

test('installed workshop data round trips and selectively updates the existing ThemeScope runtime', () => {
  const original = themeDocumentFromDefinition({
    id: 'installed-workshop',
    name: 'Installed workshop',
    tokens: { typography: { family: 'serif' }, surface: { radius: '2rem' } },
    components: { button: { pressScale: 0.96 } },
    modes: { dark: { components: { card: { shadow: 'none' } } } }
  })
  const colors = defineThemeDocument({
    kind: 'radiant-theme',
    version: 1,
    id: 'color-source',
    name: 'Color source',
    sections: {
      color: {
        brand: { value: '#166534', gamut: 'srgb' },
        palettes: [{ id: 'brand', name: 'Brand', swatches: [{ stop: 500, value: '#166534' }] }],
        anchor: { paletteId: 'brand', stop: 500 },
        values: { accent: '#166534' },
        modes: { dark: { accent: '#86efac' } }
      }
    }
  })
  const exported = exportThemeSections(colors, ['color'])
  const imported = parseThemeDocument(JSON.parse(JSON.stringify(exported)))
  assert.equal(imported.kind, 'radiant-theme-sections')
  const edited = updateThemeDocument(original, imported.sections, 'replace')
  assert.deepEqual(edited.sections.components, original.sections.components)
  assert.equal(edited.id, original.id)
  const restored = parseThemeDocument(JSON.parse(JSON.stringify(edited)))
  const theme = compileThemeDocument(restored)
  assert.equal(theme.modes.dark['--rad-color-accent'], '#86efac')
  assert.equal(theme.modes.light['--rad-button-press-scale'], 0.96)
  assert.equal(theme.modes.dark['--rad-card-shadow'], 'none')
  assert.equal(theme.modes.light['--rad-typography-family'], 'serif')
  const html = renderToStaticMarkup(
    createElement(
      ThemeScope,
      { theme, mode: 'dark' },
      createElement(ThemeScope, { theme: defaultTheme }, 'Reset')
    )
  )
  assert.match(html, /data-rad-theme="installed-workshop"/)
  assert.match(html, /data-rad-theme="default"/)
  assert.match(html, /--rad-button-press-scale:initial/)
  assert.throws(() => parseThemeDocument({ ...edited, version: 2 }), /Unsupported document.version/)
})

test('the installed color entry generates portable walls without React or browser access', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { registerHooks } from 'node:module';
    registerHooks({ resolve(specifier, context, next) {
      assert.ok(!/^react(?:-dom)?(?:\\/|$)/.test(specifier), 'Color entry imported React');
      return next(specifier, context);
    } });
    for (const key of ['window', 'document', 'localStorage']) Object.defineProperty(globalThis, key, { get() { throw new Error('Color entry read ' + key); } });
    const { generateColorWall, recommendColorPalette } = await import('@cognitap/radiant/color');
    const wall = generateColorWall({ brand: '#FFFF00' });
    assert.equal(wall.color.palettes.length, 18);
    assert.equal(wall.color.anchor.stop, 200);
    assert.deepEqual(generateColorWall(JSON.parse(JSON.stringify(wall.input))), wall);
    const palette = recommendColorPalette(wall);
    assert.equal(palette.pass, true);
    assert.equal(palette.color.brand.value, '#FFFF00');
    assert.equal(palette.color.palettes.length, 18);
    assert.ok(palette.checks.some(check => check.mode === 'dark' && check.foregroundRole === 'accentForeground'));
  `
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: new URL('.', import.meta.url),
    stdio: 'pipe'
  })
})

test('opt-in motion exports work on the server and root imports exclude the engine', async () => {
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {registerHooks} from 'node:module';
    registerHooks({resolve(specifier, context, next) {
      assert.ok(!/^(?:motion|framer-motion|motion-dom|motion-utils)(?:\\/|$)/.test(specifier), 'Root imported animation engine');
      return next(specifier,context);
    }});
    const {defineTheme} = await import('@cognitap/radiant');
    assert.equal(defineTheme({id:'root',name:'Root'}).motion.mode,'system');
  `
    ],
    { stdio: 'pipe' }
  )
  const { createSpring, createLayoutSpring } = await import('@cognitap/radiant/motion')
  const bindings = await import('@cognitap/radiant/motion/react')
  assert.equal(typeof bindings.useSpringStyle, 'function')
  assert.equal(typeof bindings.MotionProvider, 'function')
  assert.equal(typeof bindings.MotionLink, 'function')
  assert.equal(typeof bindings.useSpringDrag, 'function')
  const value = createSpring(0, { enabled: false })
  value.to(42)
  assert.equal(value.get(), 42)
  value.destroy()
  const layout = createLayoutSpring({ x: 0, y: 0, width: 100, height: 20 }, { enabled: false })
  layout.destroy()
})
