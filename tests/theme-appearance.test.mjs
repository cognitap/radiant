import assert from 'node:assert/strict'
import test from 'node:test'
import {
  compileThemeDocument,
  generateColorWall,
  recommendColorPalette,
  themeDocumentFromDefinition,
  updateThemeAppearance,
  parseThemeDocument
} from '../dist/library/index.js'

const document = () =>
  themeDocumentFromDefinition({
    id: 'appearance',
    name: 'Appearance',
    tokens: {
      typography: { family: 'serif' },
      motion: { pressDuration: '90ms' },
      color: { accent: '#123456' },
      surface: { radius: '3rem', padding: '4rem' },
      control: { medium: { fontSize: '1rem' } }
    },
    components: { button: { radius: '25px' }, dialog: { backdropFilter: 'blur(8px)' } },
    modes: {
      dark: {
        tokens: { control: { medium: { height: '5rem' } } },
        components: { card: { shadow: 'none' } }
      }
    }
  })
const palette = recommendColorPalette(generateColorWall({ brand: '#FFFF00' }))

test('appearance applies color and canvas together while preserving unrelated sections and exceptions', () => {
  const original = document(),
    before = JSON.stringify(original)
  const next = updateThemeAppearance(original, {
    palette,
    geometry: { values: { surfaceRadius: 12 } }
  })
  assert.deepEqual(next.sections.color, palette.color)
  assert.equal(next.sections.color.values, undefined, 'obsolete common colors are replaced')
  assert.deepEqual(next.sections.typography, original.sections.typography)
  assert.deepEqual(next.sections.motion, original.sections.motion)
  assert.deepEqual(next.sections.components, original.sections.components)
  const theme = compileThemeDocument(next)
  for (const mode of ['light', 'dark']) {
    const values = theme.modes[mode]
    assert.equal(values['--rad-color-accent'], palette.color.modes[mode].accent)
    assert.equal(values['--rad-surface-canvas'], palette.surface.modes[mode].canvas)
    assert.equal(values['--rad-surface-radius'], '12px')
    assert.equal(values['--rad-surface-padding'], '4rem')
    assert.equal(values['--rad-button-radius'], '25px')
    assert.equal(values['--rad-dialog-backdrop-filter'], 'blur(8px)')
  }
  assert.equal(theme.modes.dark['--rad-card-shadow'], 'none')
  assert.equal(JSON.stringify(original), before)
  const deliberate = recommendColorPalette(generateColorWall({ brand: '#FFFF00' }), {
    modes: { light: { accent: '#FFFF00' } }
  })
  assert.equal(deliberate.pass, false)
  assert.equal(
    compileThemeDocument(updateThemeAppearance(original, { palette: deliberate })).modes.light[
      '--rad-color-accent'
    ],
    '#FFFF00'
  )
})

test('bounded controls map the entire existing spacing and control scales without scaling fonts', () => {
  const next = updateThemeAppearance(document(), {
    geometry: {
      values: {
        spacing: 1.5,
        density: 1.25,
        controlRadius: 8,
        surfaceRadius: 24,
        controlBorderWidth: 2,
        surfaceBorderWidth: 3,
        borderStyle: 'dashed',
        elevation: 2,
        backdropOpacity: 0.7
      }
    }
  })
  const theme = compileThemeDocument(next)
  for (const mode of ['light', 'dark']) {
    const v = theme.modes[mode]
    for (const [size, height, padding, indicator] of [
      ['small', '2.5rem', '0.9375rem', '1.25rem'],
      ['medium', '3.125rem', '1.25rem', '1.40625rem'],
      ['large', '3.75rem', '1.71875rem', '1.5625rem']
    ]) {
      assert.equal(v[`--rad-control-${size}-height`], height)
      assert.equal(v[`--rad-control-${size}-padding-inline`], padding)
      assert.equal(v[`--rad-control-${size}-indicator-size`], indicator)
    }
    assert.equal(v['--rad-control-medium-font-size'], '1rem')
    assert.equal(v['--rad-spacing-label-gap'], '0.75rem')
    assert.equal(v['--rad-spacing-field-gap'], '0.5625rem')
    assert.equal(v['--rad-spacing-group-gap'], '1.125rem')
    assert.equal(v['--rad-spacing-header-gap'], '0.5625rem')
    assert.equal(v['--rad-spacing-footer-gap'], '0.75rem')
    assert.equal(v['--rad-surface-padding'], '2.25rem')
    assert.equal(v['--rad-surface-gap'], '1.5rem')
    assert.equal(v['--rad-control-border-width'], '2px')
    assert.equal(v['--rad-surface-border-width'], '3px')
    assert.equal(v['--rad-control-border-style'], 'dashed')
    assert.equal(v['--rad-surface-border-style'], 'dashed')
    assert.equal(v['--rad-surface-backdrop'], 'rgb(0 0 0 / 0.7)')
    assert.match(v['--rad-surface-shadow'], /0 4px 12px -2px/)
    assert.match(v['--rad-surface-overlay-shadow'], /0 24px 64px -16px/)
  }
  assert.notEqual(
    theme.modes.light['--rad-surface-shadow'],
    theme.modes.dark['--rad-surface-shadow']
  )
  assert.deepEqual(
    updateThemeAppearance(next, { geometry: { values: { spacing: 1.5, density: 1.25 } } }),
    next
  )
})

test('mode geometry overrides common controls, and partial edits retain the other mode and settings', () => {
  const next = updateThemeAppearance(document(), {
    geometry: {
      values: { density: 1, spacing: 1, elevation: 3, backdropOpacity: 0.5 },
      modes: { dark: { density: 0.75, spacing: 2, elevation: 0, backdropOpacity: 0 } }
    }
  })
  const theme = compileThemeDocument(next)
  assert.equal(theme.modes.light['--rad-control-medium-height'], '2.5rem')
  assert.equal(theme.modes.dark['--rad-control-medium-height'], '1.875rem')
  assert.equal(theme.modes.dark['--rad-surface-padding'], '3rem')
  assert.equal(theme.modes.dark['--rad-surface-shadow'], 'none')
  assert.equal(theme.modes.dark['--rad-surface-overlay-shadow'], 'none')
  assert.equal(theme.modes.dark['--rad-surface-backdrop'], 'rgb(0 0 0 / 0)')
  const edited = updateThemeAppearance(next, {
    geometry: { modes: { dark: { surfaceRadius: 0 } } }
  })
  assert.deepEqual(compileThemeDocument(edited).modes.light, theme.modes.light)
  assert.equal(compileThemeDocument(edited).modes.dark['--rad-surface-radius'], '0px')
  assert.equal(compileThemeDocument(edited).modes.dark['--rad-surface-padding'], '3rem')
  assert.deepEqual(
    updateThemeAppearance(document(), { geometry: { values: {}, modes: {} } }),
    document()
  )
})

test('all accepted bounds compile and round trip as immutable document data without new token roles', () => {
  for (const settings of [
    {
      spacing: 0.5,
      density: 0.75,
      controlRadius: 0,
      surfaceRadius: 0,
      controlBorderWidth: 0,
      surfaceBorderWidth: 0,
      elevation: 0,
      backdropOpacity: 0
    },
    {
      spacing: 2,
      density: 1.5,
      controlRadius: 32,
      surfaceRadius: 48,
      controlBorderWidth: 4,
      surfaceBorderWidth: 4,
      elevation: 3,
      backdropOpacity: 0.9
    }
  ]) {
    const options = { palette, geometry: { values: settings } }
    const next = updateThemeAppearance(document(), options)
    assert.deepEqual(parseThemeDocument(JSON.parse(JSON.stringify(next))), next)
    assert.ok(Object.isFrozen(next.sections.control.modes.light))
    assert.equal(Object.isFrozen(settings), false)
    assert.equal(
      compileThemeDocument(next).modes.light['--rad-surface-radius'],
      `${settings.surfaceRadius}px`
    )
    assert.equal(next.version, 1)
  }
  assert.deepEqual(updateThemeAppearance(document(), {}), document())
  const neutral = compileThemeDocument(
    themeDocumentFromDefinition({ id: 'neutral', name: 'Neutral' })
  )
  const restored = compileThemeDocument(
    updateThemeAppearance(document(), { geometry: { values: { elevation: 1 } } })
  )
  for (const mode of ['light', 'dark'])
    for (const key of ['--rad-surface-shadow', '--rad-surface-overlay-shadow'])
      assert.equal(restored.modes[mode][key], neutral.modes[mode][key])
})

test('unsupported and out-of-range controls fail with paths instead of silently clamping', () => {
  for (const [settings, match] of [
    [null, /appearance/],
    [{ version: 2 }, /version/],
    [{ unknown: true }, /unknown/],
    [{ palette: { ...palette, version: 2 } }, /palette.version/],
    [{ palette: {} }, /palette.version/],
    [{ geometry: null }, /geometry/],
    [{ geometry: { modes: { system: {} } } }, /modes.system/],
    [{ geometry: { values: { radius: 3 } } }, /values.radius/],
    ...Object.entries({
      spacing: 0.49,
      density: 1.51,
      controlRadius: -1,
      surfaceRadius: 49,
      controlBorderWidth: 5,
      surfaceBorderWidth: NaN,
      elevation: 1.5,
      backdropOpacity: Infinity,
      borderStyle: 'none'
    }).map(([key, value]) => [
      { geometry: { values: { [key]: value } } },
      new RegExp(`values.${key}`)
    ]),
    [{ geometry: { modes: { dark: { density: '1.2' } } } }, /modes.dark.density/]
  ])
    assert.throws(() => updateThemeAppearance(document(), settings), match)
})
