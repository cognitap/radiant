// @ts-nocheck
import assert from 'node:assert/strict'
import test from 'node:test'
import { defineTheme, defaultTheme } from '@cognitap/radiant'
import {
  expressive,
  glass,
  jelly,
  radiant,
  sharp,
  soft,
  themeDefinitions,
  themes,
  ticket
} from '@cognitap/radiant/examples'

test('partial themes resolve baseline, common values and mode overrides independently', () => {
  const theme = defineTheme({
    id: 'workbench',
    name: 'Workbench',
    tokens: {
      typography: { family: 'Workbench Sans, sans-serif' },
      control: { radius: '1rem' },
      color: { accent: '#14532d' }
    },
    components: { button: { radius: '2rem', fontWeight: 700 } },
    modes: {
      light: { tokens: { color: { accent: '#166534' } } },
      dark: {
        tokens: { color: { accent: '#86efac' } },
        components: { button: { radius: '3rem' } }
      }
    }
  })

  for (const mode of ['light', 'dark']) {
    const values = theme.modes[mode]
    assert.equal(values['--rad-typography-family'], 'Workbench Sans, sans-serif')
    assert.equal(values['--rad-control-radius'], '1rem')
    assert.equal(values['--rad-button-font-weight'], 700)
    assert.equal(values['--rad-input-radius'], 'initial')
    assert.equal(values['--rad-card-radius'], 'initial')
    assert.equal(values['--rad-color-surface'], defaultTheme.modes[mode]['--rad-color-surface'])
    assert.equal(values['--rad-surface-canvas'], defaultTheme.modes[mode]['--rad-surface-canvas'])
  }
  assert.equal(theme.modes.light['--rad-color-accent'], '#166534')
  assert.equal(theme.modes.dark['--rad-color-accent'], '#86efac')
  assert.equal(theme.modes.light['--rad-button-radius'], '2rem')
  assert.equal(theme.modes.dark['--rad-button-radius'], '3rem')
  assert.notEqual(theme.modes.light['--rad-color-surface'], theme.modes.dark['--rad-color-surface'])
})

test('Button-only overrides never become shared defaults or another component override', () => {
  const theme = defineTheme({
    id: 'action-font',
    name: 'Action font',
    components: { button: { fontFamily: 'Action Display', focusColor: 'rebeccapurple' } }
  })
  for (const mode of ['light', 'dark']) {
    assert.equal(theme.modes[mode]['--rad-button-font-family'], 'Action Display')
    assert.equal(theme.modes[mode]['--rad-button-focus-color'], 'rebeccapurple')
    assert.equal(theme.modes[mode]['--rad-input-font-family'], 'initial')
    assert.equal(theme.modes[mode]['--rad-input-focus-color'], 'initial')
    assert.equal(
      theme.modes[mode]['--rad-typography-family'],
      defaultTheme.modes[mode]['--rad-typography-family']
    )
    assert.equal(
      theme.modes[mode]['--rad-color-focus'],
      defaultTheme.modes[mode]['--rad-color-focus']
    )
  }
})

test('a fresh named default resets every component slot to fallback semantics', () => {
  const fresh = defineTheme({ id: 'fresh', name: 'Fresh' })
  assert.deepEqual(fresh.modes, defaultTheme.modes)
  for (const mode of ['light', 'dark']) {
    const resets = Object.entries(fresh.modes[mode]).filter(([, value]) => value === 'initial')
    assert.equal(resets.length, 333)
    for (const variable of [
      '--rad-button-font-family',
      '--rad-button-text-transform',
      '--rad-button-press-shift',
      '--rad-input-border-style',
      '--rad-combobox-content-radius',
      '--rad-combobox-placeholder',
      '--rad-select-content-radius',
      '--rad-select-item-background',
      '--rad-radio-radius',
      '--rad-radio-group-gap',
      '--rad-dialog-backdrop-filter',
      '--rad-popover-backdrop-filter',
      '--rad-card-shadow'
    ]) {
      assert.equal(fresh.modes[mode][variable], 'initial')
    }
  }
})

test('the preset registry has stable identities and readonly theme values', () => {
  assert.deepEqual(
    themes.map(theme => theme.id),
    ['radiant', 'default', 'soft-squircle', 'expressive', 'glass', 'sharp-3d', 'jelly', 'ticket']
  )
  assert.deepEqual(themes, [radiant, defaultTheme, soft, expressive, glass, sharp, jelly, ticket])
  assert.ok(Object.isFrozen(themes))
  assert.throws(() => themes.push(defaultTheme), TypeError)
  for (const theme of themes) {
    for (const value of [theme, theme.modes, theme.modes.light, theme.modes.dark]) {
      assert.ok(Object.isFrozen(value), `${theme.id} must be immutable`)
    }
    assert.deepEqual(JSON.parse(JSON.stringify(theme)), theme)
    assert.throws(() => {
      theme.modes.dark['--rad-color-accent'] = 'pink'
    }, TypeError)
  }
})

test('each example definition compiles to the theme it is published beside', () => {
  assert.deepEqual(themeDefinitions.map(defineTheme), themes)
  assert.ok(Object.isFrozen(themeDefinitions[0].tokens.color))
})

test('the core entry ships only the baseline theme', async () => {
  const core = await import('@cognitap/radiant')
  for (const name of [
    'themes',
    'radiant',
    'soft',
    'expressive',
    'glass',
    'sharp',
    'jelly',
    'ticket'
  ])
    assert.equal(core[name], undefined, `${name} belongs to @cognitap/radiant/examples`)
})

test('every preset materialises complete light and dark tokens without legacy variable dependencies', () => {
  const expectedKeys = Object.keys(defaultTheme.modes.light).sort()
  for (const theme of themes) {
    assert.ok(theme.name.trim())
    assert.deepEqual(Object.keys(theme).sort(), ['id', 'modes', 'motion', 'name'])
    for (const mode of ['light', 'dark']) {
      assert.deepEqual(Object.keys(theme.modes[mode]).sort(), expectedKeys, `${theme.id}/${mode}`)
      for (const [key, value] of Object.entries(theme.modes[mode])) {
        assert.match(key, /^--rad-/)
        if (typeof value === 'number') assert.ok(Number.isFinite(value), `${theme.id}: ${key}`)
        else {
          assert.equal(typeof value, 'string')
          assert.ok(value.trim(), `${theme.id}: ${key}`)
          assert.doesNotMatch(value, /var\(--(?:ease-|button-|color-)/, `${theme.id}: ${key}`)
        }
      }
    }
    assert.notEqual(
      theme.modes.light['--rad-color-foreground'],
      theme.modes.dark['--rad-color-foreground']
    )
    assert.notEqual(
      theme.modes.light['--rad-surface-canvas'],
      theme.modes.dark['--rad-surface-canvas']
    )
  }
  assert.match(glass.modes.light['--rad-surface-canvas'], /gradient\(/)
  assert.match(glass.modes.dark['--rad-surface-canvas'], /gradient\(/)
  assert.equal(sharp.modes.light['--rad-typography-family'], 'system-ui, sans-serif')
  assert.match(sharp.modes.light['--rad-button-font-family'], /Archivo Black/)
  assert.equal(ticket.modes.light['--rad-button-text-transform'], 'uppercase')
  assert.equal(ticket.modes.light['--rad-typography-body-weight'], 400)
})

function luminance(hex) {
  const channel = index => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}
test('every exported theme keeps text contrast in light and dark', () => {
  const hex = /^#[0-9a-f]{6}$/i
  const pairs = [
    ['--rad-color-foreground', '--rad-color-surface'],
    ['--rad-color-foreground', '--rad-surface-canvas'],
    ['--rad-color-accent-foreground', '--rad-color-accent'],
    ['--rad-color-neutral-foreground', '--rad-color-neutral'],
    ['--rad-color-warning-foreground', '--rad-color-warning'],
    ['--rad-color-danger-foreground', '--rad-color-danger']
  ]
  let checked = 0
  for (const theme of themes)
    for (const mode of ['light', 'dark'])
      for (const [foreground, background] of pairs) {
        const ink = theme.modes[mode][foreground]
        const fill = theme.modes[mode][background]
        if (!hex.test(ink) || !hex.test(fill)) continue
        checked += 1
        const ratio =
          (Math.max(luminance(ink), luminance(fill)) + 0.05) /
          (Math.min(luminance(ink), luminance(fill)) + 0.05)
        assert.ok(
          ratio >= 4.5,
          `${theme.id} ${mode} ${foreground} on ${background} is ${ratio.toFixed(2)}:1`
        )
      }
  assert.ok(checked > 0)
})

test('theme authoring validates unknown keys, identities, modes and value kinds at runtime', () => {
  const valid = { id: 'custom', name: 'Custom' }
  const invalid = [
    { ...valid, id: 'Custom Theme' },
    { ...valid, id: '' },
    { ...valid, name: '   ' },
    { ...valid, token: {} },
    { ...valid, tokens: { colour: {} } },
    { ...valid, tokens: { color: { primary: 'red' } } },
    { ...valid, tokens: { control: { extraLarge: { height: '4rem' } } } },
    { ...valid, components: { toaster: {} } },
    { ...valid, components: { button: { glowHover: '70%' } } },
    { ...valid, components: { radio: { gap: '1rem' } } },
    { ...valid, modes: { system: {} } },
    { ...valid, modes: { dark: { color: { accent: 'white' } } } },
    { ...valid, tokens: { color: { accent: '' } } },
    { ...valid, tokens: { control: { radius: 8 } } },
    { ...valid, tokens: { state: { disabledOpacity: -0.1 } } },
    { ...valid, tokens: { state: { disabledOpacity: 1.1 } } },
    { ...valid, tokens: { state: { disabledOpacity: '0.5' } } },
    { ...valid, tokens: { typography: { bodyWeight: Number.NaN } } },
    { ...valid, components: { button: { pressScale: Number.POSITIVE_INFINITY } } },
    { ...valid, components: { button: { sheen: 1.1 } } },
    { ...valid, components: { input: null } },
    { ...valid, modes: { dark: null } },
    null
  ]
  for (const definition of invalid) assert.throws(() => defineTheme(definition), TypeError)
  assert.doesNotThrow(() =>
    defineTheme({
      ...valid,
      tokens: { color: { accent: 'var(--brand-accent)' }, typography: { bodyWeight: '450' } },
      components: { radioGroup: { gap: '1rem' }, button: { pressScale: 0.95, sheen: 0 } }
    })
  )
})
