import assert from 'node:assert/strict'
import test from 'node:test'
import { generateColorWall, recommendColorPalette } from '../dist/library/color/index.js'
import {
  compileThemeDocument,
  themeDocumentFromDefinition,
  updateThemeDocument,
  parseThemeDocument
} from '../dist/library/index.js'

const fixtures = [
  '#7C3AED',
  '#FF0000',
  '#0000FF',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#7F6A75',
  '#F5E6FF',
  '#17111F',
  '#808080',
  '#000000',
  '#FFFFFF'
]
// Independent WCAG relative luminance of final sRGB bytes; never OKLCH L or rounded thresholds.
function ratio(a, b) {
  const Y = hex =>
    [1, 3, 5]
      .map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
  return (Math.max(Y(a), Y(b)) + 0.05) / (Math.min(Y(a), Y(b)) + 0.05)
}
function verify(palette) {
  assert.equal(palette.pass, true)
  assert.equal(palette.color.palettes.length, 18)
  assert.deepEqual(Object.keys(palette.working), [
    'primary',
    'support',
    'neutral',
    'success',
    'warning',
    'danger'
  ])
  assert.deepEqual(Object.keys(palette.color.modes), ['light', 'dark'])
  for (const check of palette.checks) {
    assert.equal(check.ratio, ratio(check.foreground, check.background))
    if (check.minimum !== null) {
      assert.equal(check.pass, true, JSON.stringify(check))
      assert.ok(check.ratio >= check.minimum)
    } else {
      assert.equal(check.pass, null)
      assert.match(check.message, /Inactive controls/)
    }
  }
}

test('reference and extreme seeds produce independently checked semantic pairs in both modes', () => {
  for (const brand of fixtures)
    for (const fidelity of ['anchored', 'unanchored'])
      for (const lightness of ['shared', 'hue-aware']) {
        const wall = generateColorWall({ brand, fidelity, lightness }),
          palette = recommendColorPalette(wall)
        verify(palette)
        assert.deepEqual(palette.color.palettes, wall.color.palettes)
        assert.deepEqual(palette.color.brand, wall.color.brand)
        assert.deepEqual(palette.color.anchor, wall.color.anchor)
        assert.notEqual(palette.color.modes.light.surface, palette.color.modes.dark.surface)
        assert.notEqual(palette.color.modes.light.foreground, palette.color.modes.dark.foreground)
      }
})

test('seeded control limits retain contrast without changing the generated source or wall', () => {
  let seed = 154
  for (let i = 0; i < 128; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const brand = '#' + (seed & 0xffffff).toString(16).padStart(6, '0')
    const wall = generateColorWall({
      brand,
      vividness: i & 1 ? 0 : 1,
      neutralTint: i & 2 ? 0 : 0.035,
      distribution: i & 4 ? 0.75 : 1.35
    })
    const before = JSON.stringify(wall)
    verify(recommendColorPalette(wall))
    assert.equal(JSON.stringify(wall), before)
  }
})

test('working families and independent role overrides are deliberate and preserve exact brand identity', () => {
  const wall = generateColorWall({ brand: '#FFFF00' }),
    base = recommendColorPalette(wall)
  const adjusted = recommendColorPalette(wall, {
    working: { primary: 'blue', support: 'pink', success: 'teal' },
    modes: { dark: { foreground: '#FFFFFF', focus: '#ABCDEF' } }
  })
  assert.equal(adjusted.working.primary.paletteId, 'blue')
  assert.equal(adjusted.working.support.paletteId, 'pink')
  assert.equal(adjusted.working.success.paletteId, 'teal')
  assert.equal(adjusted.color.brand.value, '#FFFF00')
  assert.deepEqual(adjusted.color.palettes, wall.color.palettes)
  assert.equal(adjusted.color.modes.dark.foreground, '#FFFFFF')
  assert.equal(adjusted.color.modes.dark.focus, '#ABCDEF')
  const darkOnly = recommendColorPalette(wall, { modes: { dark: { foreground: '#FFFFFF' } } })
  assert.deepEqual(darkOnly.color.modes.light, base.color.modes.light)
  assert.deepEqual(recommendColorPalette(wall, { working: { primary: undefined } }), base)
  const desaturated = recommendColorPalette(generateColorWall({ brand: '#808080', vividness: 0 }))
  assert.equal(desaturated.working.support.paletteId, 'rose')
})

test('failed deliberate choices are retained with actual pair measurements and actionable messages', () => {
  const wall = generateColorWall({ brand: '#FFFF00' })
  const palette = recommendColorPalette(wall, {
    modes: {
      light: {
        accent: '#FFFF00',
        foreground: '#777777',
        surface: '#FFFFFF',
        canvas: '#FFFFFF',
        focus: '#959595'
      }
    }
  })
  assert.equal(palette.pass, false)
  assert.equal(palette.color.modes.light.accent, '#FFFF00')
  assert.equal(palette.color.modes.light.foreground, '#777777')
  const fail = palette.checks.filter(c => c.pass === false)
  assert.ok(fail.some(c => c.foregroundRole === 'accent' && c.backgroundRole === 'surface'))
  assert.ok(fail.some(c => c.foregroundRole === 'foreground' && c.backgroundRole === 'surface'))
  const focus = fail.find(c => c.foregroundRole === 'focus' && c.backgroundRole === 'surface')
  assert.equal(focus.ratio.toFixed(2), '3.00')
  assert.equal(focus.minimum, 3)
  assert.equal(focus.pass, false)
  for (const check of fail) assert.match(check.message, /Select another.*or adjust.*recheck/)
  assert.deepEqual(palette.color.brand, wall.color.brand)
  assert.equal(palette.color.modes.light.accentForeground, '#000000')
})

test('overridden surfaces drive automatic choices, while explicitly pinned foregrounds are never repaired silently', () => {
  const wall = generateColorWall({ brand: '#7C3AED' })
  const darkLightMode = recommendColorPalette(wall, {
    modes: { light: { surface: '#101010', canvas: '#000000' } }
  })
  verify(darkLightMode)
  assert.ok(ratio(darkLightMode.color.modes.light.foreground, '#101010') >= 4.5)
  const pinned = recommendColorPalette(wall, {
    modes: {
      light: {
        surface: '#FFFFFF',
        canvas: '#FFFFFF',
        accent: '#000000',
        accentForeground: '#000000'
      }
    }
  })
  assert.equal(pinned.color.modes.light.accentForeground, '#000000')
  assert.equal(
    pinned.checks.find(c => c.mode === 'light' && c.foregroundRole === 'accentForeground').ratio,
    1
  )
  assert.equal(pinned.pass, false)
})

test('recommendations are detached immutable data that round trip and compile through the existing theme contract', () => {
  const wall = JSON.parse(JSON.stringify(generateColorWall({ brand: '#7C3AED' })))
  const palette = recommendColorPalette(wall)
  assert.deepEqual(JSON.parse(JSON.stringify(palette)), palette)
  assert.deepEqual(recommendColorPalette(wall), palette)
  assert.equal(Object.isFrozen(wall.color.brand), false)
  wall.color.brand.value = '#123456'
  assert.equal(palette.color.brand.value, '#7C3AED')
  assert.ok(Object.isFrozen(palette.color.palettes))
  assert.ok(Object.isFrozen(palette.working.primary.dark))
  const base = themeDocumentFromDefinition({
    id: 'semantic',
    name: 'Semantic',
    tokens: { typography: { family: 'serif' }, surface: { radius: '2rem', padding: '3rem' } },
    components: { button: { radius: '4rem' } },
    modes: { dark: { components: { card: { shadow: 'none' } } } }
  })
  const color = updateThemeDocument(base, { color: palette.color }, 'replace')
  const document = updateThemeDocument(color, { surface: palette.surface })
  const restored = parseThemeDocument(JSON.parse(JSON.stringify(document)))
  const theme = compileThemeDocument(restored)
  for (const mode of ['light', 'dark']) {
    assert.equal(theme.modes[mode]['--rad-color-accent'], palette.color.modes[mode].accent)
    assert.equal(theme.modes[mode]['--rad-surface-canvas'], palette.surface.modes[mode].canvas)
    assert.equal(theme.modes[mode]['--rad-button-radius'], '4rem')
    assert.equal(theme.modes[mode]['--rad-surface-padding'], '3rem')
    assert.equal(theme.modes[mode]['--rad-typography-family'], 'serif')
  }
  assert.equal(theme.modes.dark['--rad-card-shadow'], 'none')
})

test('unsupported mappings and malformed wall inputs fail clearly instead of producing invalid ratios', () => {
  const wall = generateColorWall({ brand: '#7C3AED' })
  for (const [options, path] of [
    [null, /colorPalette/],
    [{ version: 2 }, /version/],
    [{ working: { primary: 'missing' } }, /palette ID/],
    [{ working: { success: null } }, /palette ID/],
    [{ working: { extra: 'red' } }, /working.extra/],
    [{ modes: { system: {} } }, /modes.system/],
    [{ modes: { light: { foreground: 'var(--text)' } } }, /foreground.*sRGB/],
    [{ modes: { light: { canvas: '#1234' } } }, /canvas/],
    [{ modes: { dark: null } }, /dark/],
    [{ modes: { light: { mystery: '#000000' } } }, /mystery/]
  ])
    assert.throws(() => recommendColorPalette(wall, options), path)
  assert.throws(
    () => recommendColorPalette({ ...wall, input: { ...wall.input, version: 2 } }),
    /version/
  )
  assert.throws(
    () =>
      recommendColorPalette({
        ...wall,
        color: {
          ...wall.color,
          palettes: wall.color.palettes.map((p, i) =>
            i ? p : { ...p, swatches: p.swatches.slice(1) }
          )
        }
      }),
    /eleven ordered/
  )
  assert.throws(
    () =>
      recommendColorPalette({
        ...wall,
        color: { ...wall.color, brand: { value: 'color(display-p3 1 0 0)', gamut: 'display-p3' } }
      }),
    /gamut/
  )
})
