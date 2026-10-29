// @ts-nocheck
import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  ThemeScope,
  compileThemeDocument,
  defaultTheme,
  defineTheme,
  defineThemeDocument,
  exportThemeSections,
  parseThemeDocument,
  themeDocumentFromDefinition,
  updateThemeDocument
} from '@cognitap/radiant'

const definition = {
  id: 'garden',
  name: 'Garden',
  tokens: {
    color: { accent: '#166534', accentForeground: '#ffffff' },
    typography: { family: 'Garden Sans, sans-serif', bodyWeight: 450 },
    spacing: { fieldGap: '0.5rem' },
    surface: { radius: '1rem', canvas: 'white' },
    control: { medium: { height: '3rem', paddingInline: '1rem' } },
    focus: { width: '3px' },
    motion: { pressDuration: '90ms' },
    state: { disabledOpacity: 0.4 }
  },
  components: { button: { radius: '2rem', pressScale: 0.96 } },
  modes: {
    dark: {
      tokens: {
        color: { accent: '#86efac', accentForeground: '#052e16' },
        surface: { canvas: '#101010' },
        typography: { bodyWeight: 500 }
      },
      components: { card: { shadow: 'none' } }
    },
    light: { components: { button: { fontWeight: 700 } } }
  }
}
const brand = { value: '#166534', gamut: 'srgb' }
const palettes = [
  {
    id: 'brand',
    name: 'Brand',
    swatches: [
      { stop: 500, value: '#166534' },
      { stop: 600, value: '#14532d' }
    ]
  }
]
function garden() {
  return updateThemeDocument(themeDocumentFromDefinition(definition), {
    color: { brand, palettes, anchor: { paletteId: 'brand', stop: 500 } },
    typography: {
      fonts: [
        {
          id: 'garden-sans',
          family: 'Garden Sans',
          source: 'local',
          weights: [450, 500],
          styles: ['normal']
        }
      ]
    }
  })
}

function scope(theme) {
  return renderToStaticMarkup(
    createElement(
      ThemeScope,
      { theme, mode: 'dark' },
      createElement(ThemeScope, { mode: 'light' }, 'Light'),
      createElement(ThemeScope, { theme: defaultTheme }, 'Reset')
    )
  )
}

test('authored themes round trip without turning library defaults into deliberate overrides', () => {
  const document = garden()
  const restored = parseThemeDocument(JSON.parse(JSON.stringify(document)))
  assert.deepEqual(restored, document)
  assert.equal(JSON.stringify(restored), JSON.stringify(document))
  assert.deepEqual(compileThemeDocument(restored), defineTheme(definition))
  assert.equal(scope(compileThemeDocument(restored)), scope(defineTheme(definition)))
  assert.equal(document.sections.color.fidelity, 'anchored')
  assert.equal(document.sections.color.brand.value, brand.value)
  assert.equal(document.sections.color.palettes[0].swatches[0].value, brand.value)
  assert.equal(document.sections.surface.values.shadow, undefined)
  assert.equal(compileThemeDocument(restored).modes.dark['--rad-button-radius'], '2rem')
  assert.equal(compileThemeDocument(restored).modes.light['--rad-card-shadow'], 'initial')
  assert.deepEqual(
    compileThemeDocument(themeDocumentFromDefinition({ id: 'empty', name: 'Empty' })).modes,
    defaultTheme.modes
  )
})

test('section merge preserves unrelated sections, mode leaves and deliberate component exceptions', () => {
  const original = garden()
  const changed = updateThemeDocument(original, {
    color: { modes: { dark: { accent: '#a3e635' } } },
    control: { values: { medium: { height: '3.5rem' } } }
  })
  assert.equal(changed.sections.color.modes.dark.accent, '#a3e635')
  assert.equal(changed.sections.color.modes.dark.accentForeground, '#052e16')
  assert.equal(changed.sections.control.values.medium.paddingInline, '1rem')
  for (const key of [
    'typography',
    'spacing',
    'surface',
    'motion',
    'focus',
    'state',
    'components'
  ]) {
    assert.deepEqual(changed.sections[key], original.sections[key], key)
  }
  assert.equal(original.sections.color.modes.dark.accent, '#86efac')
  const theme = compileThemeDocument(changed)
  assert.equal(theme.modes.light['--rad-color-accent'], '#166534')
  assert.equal(theme.modes.dark['--rad-color-accent'], '#a3e635')
  assert.equal(theme.modes.dark['--rad-control-medium-height'], '3.5rem')
  assert.equal(theme.modes.light['--rad-button-font-weight'], 700)
  assert.equal(theme.modes.dark['--rad-card-shadow'], 'none')
})

test('replace touches only supplied sections; empty replacement resets common, mode and metadata values', () => {
  const original = garden()
  const changed = updateThemeDocument(
    original,
    { color: { values: { accent: 'purple' } } },
    'replace'
  )
  assert.deepEqual(changed.sections.color, { values: { accent: 'purple' } })
  assert.deepEqual(changed.sections.components, original.sections.components)
  assert.deepEqual(changed.sections.typography, original.sections.typography)
  const reset = updateThemeDocument(changed, { color: {} }, 'replace')
  for (const mode of ['light', 'dark']) {
    assert.equal(
      compileThemeDocument(reset).modes[mode]['--rad-color-accent'],
      defaultTheme.modes[mode]['--rad-color-accent']
    )
    assert.equal(compileThemeDocument(reset).modes[mode]['--rad-button-radius'], '2rem')
  }
  assert.deepEqual(updateThemeDocument(original, { color: {} }), original)
  const componentsReset = updateThemeDocument(original, { components: {} }, 'replace')
  assert.equal(compileThemeDocument(componentsReset).modes.dark['--rad-card-shadow'], 'initial')
  assert.deepEqual(componentsReset.sections.color, original.sections.color)
})

test('selective exports import through explicit merge/replace without replacing identity or other editors', () => {
  const source = garden()
  const selection = exportThemeSections(source, ['color', 'typography'])
  assert.deepEqual(Object.keys(selection.sections).sort(), ['color', 'typography'])
  assert.equal(selection.id, undefined)
  assert.equal(selection.sections.components, undefined)
  const imported = parseThemeDocument(JSON.parse(JSON.stringify(selection)))
  assert.equal(imported.kind, 'radiant-theme-sections')
  const target = themeDocumentFromDefinition({
    id: 'other',
    name: 'Other',
    tokens: { motion: { pressDuration: '120ms' } },
    components: { button: { radius: '4rem' } }
  })
  const merged = updateThemeDocument(target, imported.sections, 'replace')
  assert.equal(merged.id, 'other')
  assert.deepEqual(merged.sections.color, source.sections.color)
  assert.deepEqual(merged.sections.typography, source.sections.typography)
  assert.equal(compileThemeDocument(merged).modes.light['--rad-motion-press-duration'], '120ms')
  assert.equal(compileThemeDocument(merged).modes.dark['--rad-button-radius'], '4rem')
  const exceptions = exportThemeSections(source, ['components'])
  assert.deepEqual(exceptions.sections.components, source.sections.components)
  assert.equal(exceptions.sections.color, undefined)
  assert.deepEqual(exportThemeSections(source, []).sections, {})
  // A full import replaces the editor's document; it is never implicitly merged.
  assert.equal(parseThemeDocument(JSON.parse(JSON.stringify(source))).id, 'garden')
})

test('arrays replace atomically, while palette/source/semantic colors remain independent', () => {
  const source = garden()
  const changed = updateThemeDocument(source, {
    typography: { fonts: [] },
    color: {
      palettes: [{ id: 'brand', name: 'New brand', swatches: [{ stop: 500, value: brand.value }] }]
    }
  })
  assert.deepEqual(changed.sections.typography.fonts, [])
  assert.equal(changed.sections.color.palettes[0].swatches.length, 1)
  assert.equal(changed.sections.typography.values.family, 'Garden Sans, sans-serif')
  assert.deepEqual(compileThemeDocument(changed), compileThemeDocument(source))
  assert.throws(
    () => updateThemeDocument(source, { color: { brand: { value: '#123456' } } }),
    /anchor.*exact brand.value/
  )
  const p3 = updateThemeDocument(
    source,
    {
      color: {
        brand: {
          value: 'color(display-p3 0.2 0.8 0.4)',
          gamut: 'display-p3',
          srgbFallback: '#33cc66'
        },
        palettes: [
          {
            id: 'brand',
            name: 'Brand',
            swatches: [
              { stop: 400, value: 'color(display-p3 0.2 0.8 0.4)', srgbFallback: '#33cc66' }
            ]
          }
        ],
        anchor: { paletteId: 'brand', stop: 400 }
      }
    },
    'replace'
  )
  assert.equal(p3.sections.color.anchor.stop, 400)
  assert.notEqual(p3.sections.color.brand.value, p3.sections.color.brand.srgbFallback)
  const alternative = updateThemeDocument(
    source,
    { color: { brand, fidelity: 'unanchored' } },
    'replace'
  )
  assert.equal(alternative.sections.color.fidelity, 'unanchored')
})

test('snapshots are detached, deeply readonly and deterministic across key insertion order', () => {
  const input = {
    kind: 'radiant-theme',
    version: 1,
    id: 'test',
    name: 'Test',
    sections: { color: { brand: { ...brand }, palettes: structuredClone(palettes) } }
  }
  const document = defineThemeDocument(input)
  input.sections.color.brand.value = 'changed'
  input.sections.color.palettes[0].swatches[0].value = 'changed'
  assert.equal(document.sections.color.brand.value, brand.value)
  assert.equal(document.sections.color.palettes[0].swatches[0].value, brand.value)
  for (const item of [
    document,
    document.sections,
    document.sections.color,
    document.sections.color.brand,
    document.sections.color.palettes,
    document.sections.color.palettes[0].swatches
  ])
    assert.ok(Object.isFrozen(item))
  assert.throws(() => document.sections.color.palettes.push({}), TypeError)
  const reordered = {
    sections: { color: { palettes, brand } },
    name: 'Test',
    id: 'test',
    version: 1,
    kind: 'radiant-theme'
  }
  assert.equal(JSON.stringify(document), JSON.stringify(defineThemeDocument(reordered)))
  assert.equal(
    JSON.stringify(compileThemeDocument(document)),
    JSON.stringify(compileThemeDocument(defineThemeDocument(reordered)))
  )
})

function withSections(sections) {
  return { kind: 'radiant-theme', version: 1, id: 'test', name: 'Test', sections }
}

test('invalid versions, section keys and canonical token values fail with actionable errors', () => {
  const invalid = [
    [null, /document/],
    [{ ...withSections({}), version: 2 }, /Unsupported document.version: 2.*migrate/],
    [{ ...withSections({}), kind: 'something' }, /document.kind/],
    [{ ...withSections({}), extra: true }, /document.extra/],
    [{ ...withSections({}), id: 'Bad slug' }, /id.*slug/],
    [withSections({ colors: {} }), /document.sections.colors/],
    [withSections({ color: { tokens: {} } }), /document.sections.color.tokens/],
    [withSections({ color: { modes: { system: {} } } }), /color.modes.system/],
    [withSections({ color: { values: { invented: 'red' } } }), /theme.tokens.color.invented/],
    [withSections({ state: { values: { disabledOpacity: 2 } } }), /disabledOpacity/],
    [withSections({ components: { values: { button: { radius: 4 } } } }), /button.radius/],
    [withSections({ surface: { modes: { dark: null } } }), /surface/],
    [withSections({ color: { brand: { value: ' ', gamut: 'srgb' } } }), /brand.value/],
    [withSections({ color: { brand, fidelity: null } }), /color.fidelity/],
    [withSections({ color: { brand: { value: '#123456', gamut: 'unknown' } } }), /brand.gamut/],
    [withSections({ color: { palettes: [...palettes, ...palettes] } }), /Duplicate.*palettes.1.id/],
    [
      withSections({
        color: { palettes: [{ ...palettes[0], swatches: [{ stop: 550, value: 'red' }] }] }
      }),
      /swatches.0.stop/
    ],
    [
      withSections({
        color: {
          palettes: [
            { ...palettes[0], swatches: [palettes[0].swatches[0], palettes[0].swatches[0]] }
          ]
        }
      }),
      /Duplicate.*swatches.1.stop/
    ],
    [
      withSections({ color: { brand, palettes, anchor: { paletteId: 'missing', stop: 500 } } }),
      /anchor/
    ],
    [
      withSections({ color: { brand, palettes, anchor: { paletteId: 'brand', stop: 600 } } }),
      /exact brand.value/
    ],
    [
      withSections({
        typography: { fonts: [{ id: 'a', family: 'A', source: 'local', file: 'font.woff2' }] }
      }),
      /fonts.0.file/
    ],
    [
      withSections({
        typography: { fonts: [{ id: 'a', family: 'A', source: 'local', weights: [1001] }] }
      }),
      /weights.0/
    ],
    [
      withSections({
        typography: { fonts: [{ id: 'a', family: 'A', source: 'local', styles: ['slanted'] }] }
      }),
      /styles.0/
    ]
  ]
  for (const [input, error] of invalid) assert.throws(() => parseThemeDocument(input), error)
  assert.throws(() => updateThemeDocument(garden(), {}, 'patch'), /update mode/)
  assert.throws(() => updateThemeDocument(garden(), { color: null }), /color/)
  assert.throws(() => exportThemeSections(garden(), ['unknown']), /section name/)
  assert.throws(
    () => defineThemeDocument(exportThemeSections(garden(), ['color'])),
    /Expected a radiant-theme/
  )
})

test('imports reject data loss, executable values, binary objects, accessors and prototype keys', () => {
  let getterCalls = 0
  const accessor = {
    get values() {
      getterCalls++
      return {}
    }
  }
  const cycle = {}
  cycle.self = cycle
  const bad = [
    { color: { values: { accent: () => 'red' } } },
    { typography: { fonts: new Uint8Array([1, 2]) } },
    { typography: { fonts: [undefined] } },
    { typography: { fonts: Array(1) } },
    { color: { values: { accent: Infinity } } },
    { color: { values: { accent: 1n } } },
    { color: accessor },
    { color: new Date() },
    { color: cycle },
    { color: { [Symbol('hidden')]: 'secret' } },
    JSON.parse('{"color":{"values":{"__proto__":{"polluted":true}}}}')
  ]
  for (const sections of bad) {
    assert.throws(() => parseThemeDocument(withSections(sections)), TypeError)
    assert.throws(() => updateThemeDocument(garden(), sections), TypeError)
  }
  assert.equal(getterCalls, 0)
  assert.equal({}.polluted, undefined)
  assert.throws(
    () => themeDocumentFromDefinition({ ...definition, callback: () => {} }),
    /JSON data only/
  )
  assert.deepEqual(parseThemeDocument(withSections({ color: { values: undefined } })).sections, {
    color: {}
  })
})

test('portable font axis requirements survive full/selective imports without changing compiled paint', () => {
  const font = {
    id: 'brand',
    family: 'Brand font',
    source: 'local',
    weights: [450],
    styles: ['normal'],
    axes: [
      { tag: 'wght', min: 100, default: 400, max: 900 },
      { tag: 'opsz', min: 8, default: 20, max: 72 }
    ]
  }
  const document = defineThemeDocument({
    kind: 'radiant-theme',
    version: 1,
    id: 'font-axes',
    name: 'Font axes',
    sections: { typography: { fonts: [font] } }
  })
  const parsed = parseThemeDocument(JSON.parse(JSON.stringify(document)))
  assert.deepEqual(parsed.sections.typography.fonts, [font])
  const selected = exportThemeSections(parsed, ['typography'])
  assert.deepEqual(selected.sections.typography.fonts[0].axes, font.axes)
  const target = defineThemeDocument({
    kind: 'radiant-theme',
    version: 1,
    id: 'target',
    name: 'Target',
    sections: {
      color: { values: { accent: '#123456' } },
      components: { values: { button: { radius: '23px' } } }
    }
  })
  const applied = updateThemeDocument(target, selected.sections, 'replace')
  assert.deepEqual(applied.sections.color, target.sections.color)
  assert.deepEqual(applied.sections.components, target.sections.components)
  assert.deepEqual(
    compileThemeDocument(applied),
    compileThemeDocument(updateThemeDocument(applied, { typography: { fonts: [] } }, 'replace'))
  )
  for (const axes of [
    [{ tag: 'bad', min: 0, default: 0, max: 1 }],
    [{ tag: 'wght', min: 100, default: 50, max: 900 }],
    [{ tag: 'wght', min: 100, default: 400, max: Infinity }],
    [font.axes[0], font.axes[0]],
    [{ ...font.axes[0], bytes: 'private' }],
    Array.from({ length: 33 }, (_, i) => ({
      tag: 'A' + String(i).padStart(3, '0'),
      min: 0,
      default: 0,
      max: 1
    }))
  ])
    assert.throws(
      () =>
        defineThemeDocument({
          ...document,
          sections: { typography: { fonts: [{ ...font, axes }] } }
        }),
      /axes/
    )
})
