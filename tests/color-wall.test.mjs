import assert from 'node:assert/strict'
import test from 'node:test'
import { generateColorWall, colorCalibrationPresets } from '../dist/library/color/index.js'
import {
  defineThemeDocument,
  updateThemeDocument,
  compileThemeDocument
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
const stops = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
// Rendered lightness, measured independently through CSS Color 4's sRGB → XYZ → LMS route.
// https://www.w3.org/TR/css-color-4/#color-conversion-code
function renderedLightness(hex) {
  const rgb = [1, 3, 5]
    .map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(n => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
  const multiply = (matrix, values) =>
    matrix.map(row => row.reduce((sum, n, i) => sum + n * values[i], 0))
  const xyz = multiply(
    [
      [0.4123907992659595, 0.35758433938387796, 0.1804807884018343],
      [0.21263900587151036, 0.7151686787677559, 0.07219231536073371],
      [0.01933081871559185, 0.11919477979462599, 0.9505321522496607]
    ],
    rgb
  )
  const lms = multiply(
    [
      [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
      [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
      [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
    ],
    xyz
  ).map(Math.cbrt)
  return multiply([[0.2104542553, 0.793617785, -0.0040720468]], lms)[0]
}
function assertWall(wall) {
  assert.equal(wall.color.palettes.length, 18)
  assert.equal(new Set(wall.color.palettes.map(p => p.id)).size, 18)
  for (const palette of wall.color.palettes) {
    assert.deepEqual(
      palette.swatches.map(s => s.stop),
      stops
    )
    let previous = Infinity
    for (const swatch of palette.swatches) {
      assert.match(swatch.value, /^#[0-9a-f]{6}$/i)
      const L = renderedLightness(swatch.value)
      assert.ok(
        L < previous,
        `${wall.input.brand}/${palette.name}/${swatch.stop}: rendered lightness must descend (${L}, previous ${previous})`
      )
      previous = L
    }
    assert.equal(new Set(palette.swatches.map(s => s.value.toUpperCase())).size, 11)
  }
  if (wall.input.fidelity === 'anchored') {
    const anchor = wall.color.anchor
    assert.equal(
      wall.color.palettes
        .find(p => p.id === anchor.paletteId)
        .swatches.find(s => s.stop === anchor.stop).value,
      wall.input.brand
    )
  } else assert.equal(wall.color.anchor, undefined)
}

test('the accepted fixtures produce complete, ordered, in-gamut walls for both fidelity and tone models', () => {
  for (const brand of fixtures)
    for (const lightness of ['hue-aware', 'shared'])
      for (const fidelity of ['anchored', 'unanchored'])
        assertWall(generateColorWall({ brand, lightness, fidelity }))
})

test('Classic anchored shades retain the accepted DEV-151 visual reference values', () => {
  // Small reference samples from b12143d, not a generated dump of complete walls.
  for (const [brand, anchor, shades] of [
    ['#7C3AED', 600, ['#F1EFFD', '#8B62EF', '#3A1478']],
    ['#FF0000', 500, ['#FEEDEA', '#FF0000', '#660704']],
    ['#0000FF', 700, ['#EAF1FE', '#3771FF', '#001A8D']],
    ['#FFFF00', 200, ['#FCFFAB', '#D9DA55', '#44440B']],
    ['#7F6A75', 600, ['#F3F1F2', '#9D8491', '#3B3036']],
    ['#17111F', 950, ['#F1EFF4', '#836E9F', '#2C223A']]
  ]) {
    const wall = generateColorWall({ brand, wallPreset: 'classic', rampPreset: 'classic' })
    assert.equal(wall.color.anchor.stop, anchor)
    assert.deepEqual(
      wall.color.palettes[0].swatches
        .filter(s => [100, 500, 900].includes(s.stop))
        .map(s => s.value),
      shades
    )
  }
})

test('materialised inputs replay identically, are detached and survive JSON round trips', () => {
  const input = { brand: '#7c3aEd' }
  const wall = generateColorWall(input)
  input.brand = '#000000'
  assert.equal(wall.color.brand.value, '#7c3aEd')
  assert.equal(wall.color.fidelity, 'anchored')
  assert.deepEqual(generateColorWall(wall.input), wall)
  assert.deepEqual(generateColorWall(JSON.parse(JSON.stringify(wall.input))), wall)
  assert.deepEqual(JSON.parse(JSON.stringify(wall)), wall)
  assert.ok(Object.isFrozen(wall.input))
  assert.ok(Object.isFrozen(wall.color.palettes[0].swatches))
  assert.throws(() => {
    wall.color.brand.value = 'changed'
  }, TypeError)
  // An unrelated call cannot change later output through cache history.
  generateColorWall({ brand: '#FFFF00', vividness: 0, neutralHue: -45 })
  assert.deepEqual(generateColorWall(wall.input), wall)
})

test('explicit dials retain predictable neutral, hue and fixed-source behavior', () => {
  const untinted = generateColorWall({ brand: '#7C3AED', neutralTint: 0, vividness: 0 })
  for (const palette of untinted.color.palettes.slice(1))
    for (const { value } of palette.swatches) {
      assert.equal(value.slice(1, 3), value.slice(3, 5))
      assert.equal(value.slice(3, 5), value.slice(5, 7))
    }
  assert.equal(
    untinted.color.palettes[0].swatches.find(s => s.stop === untinted.color.anchor.stop).value,
    '#7C3AED'
  )
  const aligned = generateColorWall({
    brand: '#7C3AED',
    wallPreset: 'classic',
    rampPreset: 'classic',
    hueAlignment: 1,
    fidelity: 'unanchored'
  })
  assert.deepEqual(
    aligned.color.palettes[0].swatches,
    aligned.color.palettes.find(p => p.id === 'violet').swatches
  )
  const neutral = generateColorWall({ brand: '#808080', neutralHue: -105 })
  assert.equal(neutral.neutralInput, true)
  assert.equal(neutral.input.neutralHue, 255)
  assert.deepEqual(neutral, generateColorWall({ brand: '#808080', neutralHue: 615 }))
  assert.equal(generateColorWall({ brand: '#808081' }).neutralInput, true)
  assert.equal(generateColorWall({ brand: '#000000' }).color.anchor.stop, 950)
  assert.equal(generateColorWall({ brand: '#FFFFFF' }).color.anchor.stop, 50)
  assert.notDeepEqual(
    generateColorWall({ brand: '#FF0000', lightness: 'shared' }).color.palettes,
    generateColorWall({ brand: '#FF0000' }).color.palettes
  )
})

test('control limits and seeded arbitrary sources preserve strict rendered order and exact anchoring', () => {
  let seed = 153
  for (let i = 0; i < 256; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const brand = '#' + (seed & 0xffffff).toString(16).padStart(6, '0')
    assertWall(
      generateColorWall({
        brand,
        wallPreset: colorCalibrationPresets[i % 3].id,
        rampPreset: colorCalibrationPresets[Math.floor(i / 3) % 3].id,
        brandVividness: i & 64 ? 0 : 1,
        vividness: i & 1 ? 0 : 1,
        distribution: i & 2 ? 0.75 : 1.35,
        neutralTint: i & 4 ? 0 : 0.035,
        hueAlignment: i & 8 ? 0 : 1,
        neutralHue: i * 45,
        lightness: i & 16 ? 'shared' : 'hue-aware',
        fidelity: i & 32 ? 'unanchored' : 'anchored'
      })
    )
  }
})

test('color metadata fits the existing theme document without implicitly choosing semantic roles', () => {
  const wall = generateColorWall({ brand: '#FFFF00' })
  const doc = defineThemeDocument({
    kind: 'radiant-theme',
    version: 1,
    id: 'wall',
    name: 'Wall',
    sections: {
      typography: { values: { family: 'serif' } },
      components: { values: { button: { radius: '3rem' } } }
    }
  })
  const edited = updateThemeDocument(doc, { color: wall.color }, 'replace')
  assert.deepEqual(edited.sections.color, wall.color)
  assert.equal(compileThemeDocument(edited).modes.light['--rad-button-radius'], '3rem')
  assert.equal(compileThemeDocument(edited).modes.light['--rad-typography-family'], 'serif')
  assert.deepEqual(compileThemeDocument(edited), compileThemeDocument(doc))
})

test('unsupported inputs, versions, gamuts and dial ranges fail explicitly', () => {
  for (const [input, path] of [
    [null, /input/],
    [{ brand: undefined }, /brand/],
    [{ brand: '#fff' }, /six-digit/],
    [{ brand: '#12345678' }, /Alpha/],
    [{ brand: 'color(display-p3 1 0 0)' }, /wide-gamut/],
    [{ version: 2 }, /version/],
    [{ gamut: 'display-p3' }, /gamut/],
    [{ wallPreset: 'automatic' }, /wallPreset/],
    [{ rampPreset: null }, /rampPreset/],
    [{ brandVividness: 1.01 }, /brandVividness/],
    [{ vividness: NaN }, /vividness/],
    [{ vividness: 1.01 }, /vividness/],
    [{ distribution: 0.74 }, /distribution/],
    [{ neutralTint: 0.036 }, /neutralTint/],
    [{ neutralHue: Infinity }, /neutralHue/],
    [{ hueAlignment: -0.1 }, /hueAlignment/],
    [{ lightness: 'automatic' }, /lightness/],
    [{ fidelity: null }, /fidelity/],
    [{ ai: true }, /Unknown.*ai/]
  ])
    assert.throws(
      () => generateColorWall(input === null ? null : { brand: '#7C3AED', ...input }),
      path
    )
})

test('named wall and ramp presets combine independently and materialise replayable controls', () => {
  assert.deepEqual(
    colorCalibrationPresets.map(p => p.id),
    ['classic', 'balanced', 'expressive']
  )
  assert.ok(Object.isFrozen(colorCalibrationPresets[0]))
  for (const brand of [...fixtures, '#000001', '#FFFFFE', '#010101', '#FEFEFE'])
    for (const { id: wallPreset } of colorCalibrationPresets)
      for (const { id: rampPreset } of colorCalibrationPresets) {
        const wall = generateColorWall({ brand, wallPreset, rampPreset })
        assertWall(wall)
        assert.deepEqual(generateColorWall(JSON.parse(JSON.stringify(wall.input))), wall)
        const otherRamp = generateColorWall({ brand, wallPreset, rampPreset: 'classic' })
        assert.deepEqual(wall.color.palettes.slice(1), otherRamp.color.palettes.slice(1))
        const otherWall = generateColorWall({ brand, wallPreset: 'classic', rampPreset })
        assert.deepEqual(wall.color.palettes[0], otherWall.color.palettes[0])
      }
  const automatic = generateColorWall({ brand: '#7F6A75' })
  assert.equal(automatic.input.wallPreset, 'balanced')
  assert.equal(automatic.input.rampPreset, 'balanced')
  assert.notEqual(automatic.input.vividness, automatic.input.brandVividness)
  const brandOnly = generateColorWall({ ...automatic.input, brandVividness: 0 })
  assert.deepEqual(brandOnly.color.palettes.slice(1), automatic.color.palettes.slice(1))
  assert.notDeepEqual(brandOnly.color.palettes[0], automatic.color.palettes[0])
})
