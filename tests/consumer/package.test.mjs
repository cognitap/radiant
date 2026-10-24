import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Button,
  buttonTheme,
  Checkbox,
  checkboxTheme,
  Field,
  fieldTheme,
  Input,
  inputTheme,
  Link,
  linkTheme,
  themes,
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
      { variant: 'destructive', size: 'small', radius: 'full', fullWidth: true },
      'Delete'
    )
  )
  const classAttribute = / class="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /\[--_btn-bg:var\(--color-destructive\)\]/)
  assert.doesNotMatch(classAttribute, /--color-primary\)/)
  assert.match(classAttribute, /\[--_btn-h:var\(--button-height-small,2rem\)\]/)
  assert.match(classAttribute, /\[--_btn-radius:calc\(var\(--_btn-h\)\/2\)\]/)
  assert.match(classAttribute, /\bw-full\b/)
  assert.match(html, /\sdata-slot="button"/)
  assert.match(html, /\sdata-variant="destructive"/)
  assert.match(html, /\sdata-size="small"/)
  assert.doesNotMatch(html, /\s(variant|size|radius|fullwidth|fullWidth|icononly|iconOnly)=/)
})

test('iconOnly squares the button at its size', () => {
  const html = renderToStaticMarkup(
    createElement(Button, { iconOnly: true, size: 'large', 'aria-label': 'Close' }, 'x')
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

test('buttonTheme maps typed settings to Button variables', () => {
  assert.deepEqual(
    buttonTheme({
      radius: '1rem',
      radiusPressed: '0.25rem',
      cornerShape: 'squircle',
      borderWidth: '2px',
      borderColor: '#111111',
      pressShiftX: '3px',
      focusColor: '#111111',
      focusOffset: '0px',
      pressScale: 0.96,
      pressEase: 'var(--ease-snap)',
      releaseEase: 'var(--ease-spring)',
      glow: undefined
    }),
    {
      '--button-radius': '1rem',
      '--button-radius-pressed': '0.25rem',
      '--button-corner-shape': 'squircle',
      '--button-border-width': '2px',
      '--button-border-color': '#111111',
      '--button-press-shift-x': '3px',
      '--color-focus': '#111111',
      '--button-focus-offset': '0px',
      '--button-press-scale': 0.96,
      '--button-press-ease': 'var(--ease-snap)',
      '--button-release-ease': 'var(--ease-spring)'
    }
  )
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
  assert.match(classAttribute, /\bunderline\b/)
  assert.doesNotMatch(html, /\s(variant|tone|size|external|render)=/)
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
      { href: '/delete', variant: 'button', tone: 'destructive', size: 'small' },
      'Delete space'
    )
  )
  assert.match(html, /^<a\b/)
  assert.match(html, /\sdata-variant="button"/)
  const classAttribute = / class="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /\[--_btn-bg:var\(--color-destructive\)\]/)
  assert.match(classAttribute, /\[--_btn-h:var\(--button-height-small,2rem\)\]/)
  assert.doesNotMatch(classAttribute, /\bunderline\b/)
  assert.doesNotMatch(html, /\s(tone|size)=/)
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

test('a field labels a host control and keeps native attributes', () => {
  const html = renderToStaticMarkup(
    createElement(
      Field,
      { label: 'Email', description: 'Work address', required: true },
      createElement('input', { name: 'email', type: 'email', autoComplete: 'email' })
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
  const input = createElement('input', { name: 'email' })
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
})

test('a host id and describedby are kept', () => {
  const html = renderToStaticMarkup(
    createElement(
      Field,
      { label: 'Email', description: 'Work address' },
      createElement('input', { id: 'email', 'aria-describedby': 'hint' })
    )
  )
  assert.match(html, /<label\b[^>]*\sfor="email"/)
  assert.match(html, /<input\b[^>]*\sid="email"/)
  const describedBy = /<input\b[^>]*\saria-describedby="([^"]+)"/.exec(html)?.[1] ?? ''
  assert.ok(describedBy.split(' ').includes('hint'))
  assert.ok(describedBy.split(' ').length >= 2)
})

test('a group uses a fieldset and does not label each control', () => {
  const html = renderToStaticMarkup(
    createElement(
      Field,
      {
        layout: 'group',
        label: 'Notifications',
        description: 'Choose any',
        error: 'Pick at least one.',
        required: true,
        disabled: true
      },
      createElement('input', { type: 'checkbox', name: 'channels' })
    )
  )
  assert.match(html, /^<fieldset\b/)
  assert.match(html, /<legend\b/)
  assert.match(html, /\sdisabled=""/)
  assert.match(html, /aria-invalid="true"/)
  assert.match(html, /aria-required="true"/)
  assert.match(html, /aria-describedby="[^"]+"/)
  assert.match(html, /\sdata-layout="group"/)
  assert.doesNotMatch(html, /<legend\b[^>]*\sfor=/)
  assert.doesNotMatch(html, /<input\b[^>]*\sid=/)
  assert.doesNotMatch(html, /<input\b[^>]*\saria-invalid/)
  assert.doesNotMatch(html, /\srequired=""/)
})

test('a render function receives the control props', () => {
  const html = renderToStaticMarkup(
    createElement(Field, { label: 'Email', error: 'Missing' }, control =>
      createElement('input', { ...control, name: 'email' })
    )
  )
  const id = /<input\b[^>]*\sid="([^"]+)"/.exec(html)?.[1]
  assert.ok(id)
  assert.match(html, new RegExp(`<label\\b[^>]*\\sfor="${id}"`))
  assert.match(html, /aria-invalid="true"/)
  assert.match(html, /name="email"/)
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
    createElement(
      Field,
      { label: 'Email', required: true, requiredIndicator: null },
      createElement('input', { name: 'email' })
    )
  )
  assert.doesNotMatch(hidden, /data-slot="field-required"/)
  assert.match(hidden, /\srequired=""/)
})

test('fieldTheme maps typed settings to Field variables', () => {
  assert.deepEqual(
    fieldTheme({
      gap: '0.5rem',
      labelWeight: 650,
      errorColor: 'oklch(0.5 0.2 25)',
      disabledOpacity: 0.4
    }),
    {
      '--field-gap': '0.5rem',
      '--field-label-weight': 650,
      '--field-error-color': 'oklch(0.5 0.2 25)',
      '--field-disabled-opacity': 0.4
    }
  )
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
  assert.match(html, /\srequired=""/)
  assert.match(html, /\sid="email"/)
  assert.match(html, /\sdata-slot="input"/)
  const classAttribute = / class="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /--input-height/)
  assert.doesNotMatch(html, /\s(inputTheme)=/)
})

test('an input takes its accessible relationships from Field', () => {
  const html = renderToStaticMarkup(
    createElement(
      Field,
      { label: 'Email', description: 'Work address', error: 'Enter an email.', required: true },
      createElement(Input, {
        name: 'email',
        type: 'email',
        id: 'custom',
        'aria-describedby': 'hint'
      })
    )
  )
  const id = /<input\b[^>]*\sid="([^"]+)"/.exec(html)?.[1]
  assert.ok(id)
  assert.notEqual(id, 'custom')
  assert.match(html, new RegExp(`<label\\b[^>]*\\sfor="${id}"`))
  assert.match(html, /aria-invalid="true"/)
  assert.match(html, /\sdata-invalid=""/)
  assert.match(html, /\sname="email"/)
  const describedBy = /<input\b[^>]*\saria-describedby="([^"]+)"/.exec(html)?.[1] ?? ''
  assert.equal(describedBy.split(' ').length, 3)
  assert.ok(describedBy.split(' ').includes('hint'))
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

test('inputTheme maps typed settings to Input variables', () => {
  assert.deepEqual(
    inputTheme({
      height: '3rem',
      radius: '999px',
      invalidBorder: 'oklch(0.5 0.2 25)',
      fontWeight: 400
    }),
    {
      '--input-height': '3rem',
      '--input-radius': '999px',
      '--input-invalid-border': 'oklch(0.5 0.2 25)',
      '--input-font-weight': 400
    }
  )
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

test('a checkbox takes a single-control Field name and keeps group identity', () => {
  const single = renderToStaticMarkup(
    createElement(
      Field,
      { label: 'Accept terms', required: true, error: 'Required' },
      createElement(Checkbox, { name: 'accept', id: 'custom' })
    )
  )
  const id = /<input\b[^>]*\sid="([^"]+)"/.exec(single)?.[1]
  assert.ok(id)
  assert.notEqual(id, 'custom')
  assert.match(single, new RegExp(`<label\\b[^>]*\\sfor="${id}"`))
  assert.match(single, /aria-invalid="true"/)
  assert.match(single, /\srequired=""/)

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

test('replacing appearance leaves the checkbox class and element', () => {
  const html = renderToStaticMarkup(
    createElement(Checkbox, { label: 'Email', className: 'appearance-auto' })
  )
  const classAttribute = /<input\b[^>]*\sclass="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /\bappearance-auto\b/)
  assert.doesNotMatch(classAttribute, /\bappearance-none\b/)
  assert.match(html, /type="checkbox"/)
})

test('checkboxTheme maps typed settings to Checkbox variables', () => {
  assert.deepEqual(
    checkboxTheme({ size: '1.25rem', checkedBackground: 'oklch(0.5 0.2 250)', mark: 'white' }),
    {
      '--checkbox-size': '1.25rem',
      '--checkbox-checked-background': 'oklch(0.5 0.2 250)',
      '--checkbox-mark': 'white'
    }
  )
})

test('linkTheme maps typed settings to Link variables', () => {
  assert.deepEqual(
    linkTheme({ color: 'oklch(0.5 0.1 250)', focusWidth: 3, underlineOffset: '0.3em' }),
    {
      '--link-color': 'oklch(0.5 0.1 250)',
      '--link-underline-offset': '0.3em',
      '--link-focus-width': 3
    }
  )
})

test('themes are shared presets with color and button tokens', () => {
  assert.deepEqual(
    themes.map(theme => theme.name),
    ['Radiant', 'Default', 'Soft squircle', 'Expressive', 'Glass', 'Sharp 3D', 'Jelly', 'Ticket']
  )
  const ticket = themes.find(theme => theme.name === 'Ticket')
  assert.equal(ticket?.style['--color-primary'], 'oklch(0.55 0.19 35)')
  assert.equal(ticket?.style['--button-corner-shape'], 'scoop')
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

test('exports reject implementation deep imports', async () => {
  for (const path of [
    'src/Button.tsx',
    'src/Field.tsx',
    'src/Input.tsx',
    'src/Checkbox.tsx',
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
  assert.match(styles, /--color-primary\s*:/)
  assert.match(styles, /\.bg-\\\(--_btn-bg\\\)(?=\s*[{,])/)
  assert.doesNotMatch(styles, /h1\s*,\s*h2\s*,\s*h3\b/)
  assert.match(readExport('reset.css'), /h1\s*,\s*h2\s*,\s*h3\b/)
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
  for (const file of ['README.md', 'CHANGELOG.md', 'RELEASE_POLICY.md']) {
    assert.ok(readFileSync(new URL(file, root), 'utf8').trim().length > 0, file)
  }
})
