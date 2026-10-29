// @ts-nocheck
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import {
  generateTypography,
  typographyRoles,
  typographyPresets,
  defineThemeDocument,
  compileThemeDocument,
  updateThemeDocument,
  exportThemeSections,
  parseThemeDocument,
  defineTheme
} from '@cognitap/radiant'

test('accepted role calculations use independent font-aware rhythms and rem/container output', () => {
  const t = generateTypography()
  assert.equal(typographyRoles.length, 16)
  assert.equal(t.prose.size, 20)
  assert.equal(t.ui.size, 16)
  assert.equal(t.styles['prose-title'].narrow, 20 * 1.25 ** 3)
  assert.equal(t.styles['prose-title'].wide, 20 * 1.25 ** 5)
  assert.equal(t.styles.display.wide, 20 * 1.25 ** 6)
  assert.equal(t.tokens.roles['prose-body'].size, '1.25rem')
  assert.equal(t.tokens.roles['ui-body'].size, '1rem')
  assert.match(t.tokens.roles['prose-title'].fluidSize, /^clamp\(.*rem.*cqi.*rem\)$/)
  assert.deepEqual(t.tokens.flow, {
    paragraph: '1.25em',
    headingBefore: '2em',
    headingAfter: '.625em'.replace(/^\./, '0.')
  })
  assert.equal(generateTypography({ preset: 'source-serif' }).prose.size, 21)
  assert.equal(generateTypography({ preset: 'plex' }).prose.lineHeight, 1.6)
  assert.equal(
    generateTypography({ fonts: { body: { family: 'Unknown Sans' } } }).recommendations.body,
    false
  )
  assert.equal(
    generateTypography({ fonts: { ui: { family: 'Serif', profile: 'source-serif-4' } } })
      .recommendations.ui,
    false
  )
})

test('replay keeps automatic profiles live and explicit context/style overrides owned', () => {
  const t = generateTypography({
    prose: { lineHeight: 1.8 },
    styles: { 'prose-body': { weight: 650 } }
  })
  assert.equal(Object.hasOwn(t.input.prose, 'size'), false)
  assert.deepEqual(generateTypography(JSON.parse(JSON.stringify(t.input))), t)
  const next = generateTypography({
    ...t.input,
    fonts: { ...t.input.fonts, body: { family: 'Source Serif 4', profile: 'source-serif-4' } }
  })
  assert.equal(next.prose.size, 21)
  assert.equal(next.prose.lineHeight, 1.8)
  assert.equal(next.styles['prose-body'].weight, 650)
  assert.equal(next.styles['ui-body'].narrow, 16)
  assert.ok(Object.isFrozen(t.tokens.roles['prose-body']))
  assert.ok(Object.isFrozen(typographyPresets.inter.fonts))
  const input = {
    styles: { 'prose-body': { weight: 850 } },
    fonts: { body: { family: 'Plex', profile: 'plex-sans' } }
  }
  const warned = generateTypography(input)
  assert.deepEqual(warned.warnings, [
    { role: 'prose-body', requestedWeight: 850, supportedWeights: [100, 700] }
  ])
  assert.equal(warned.styles['prose-body'].weight, 850)
  assert.equal(Object.isFrozen(input.styles['prose-body']), false)
})

test('closed, bounded typography input rejects malformed imports without coercion', () => {
  for (const input of [
    null,
    [],
    { preset: 'unknown' },
    { fonts: null },
    { prose: null },
    { ui: null },
    { styles: null },
    { prose: { size: NaN } },
    { prose: { size: Infinity } },
    { prose: { size: 0 } },
    { prose: { unknown: 1 } },
    { ui: { size: '16' } },
    { fonts: { body: { family: 'x; color:red' } } },
    { fonts: { body: { family: 'X', profile: 'guess' } } },
    { styles: { unknown: { weight: 400 } } },
    { styles: { 'prose-body': { narrow: 30, wide: 20 } } },
    { styles: { 'prose-body': { assignment: 'reading' } } },
    { styles: { 'prose-body': { weight: 0 } } }
  ])
    assert.throws(() => generateTypography(input), TypeError, JSON.stringify(input))
})

const document = () =>
  defineThemeDocument({
    kind: 'radiant-theme',
    version: 1,
    id: 'typography-proof',
    name: 'Typography proof',
    sections: {
      typography: {
        typesetting: { preset: 'source-serif' },
        values: { roles: { 'prose-title': { weight: 700 } } },
        modes: { dark: { roles: { 'prose-body': { letterSpacing: '0.01em' } } } },
        fonts: [
          { id: 'serif', family: 'Source Serif 4', source: 'catalog', weights: [400, 600, 700] }
        ]
      },
      color: { values: { accent: 'red' } },
      motion: { values: { pressDuration: '90ms' } },
      components: { values: { button: { fontWeight: 900 } } }
    }
  })

test('one compiler resolves generated → authored → mode leaves and preserves older themes', () => {
  const d = document(),
    t = compileThemeDocument(d)
  assert.equal(t.modes.light['--rad-typography-roles-prose-body-size'], '1.3125rem')
  assert.equal(t.modes.light['--rad-typography-roles-prose-title-weight'], 700)
  assert.equal(t.modes.dark['--rad-typography-roles-prose-body-letter-spacing'], '0.01em')
  assert.equal(t.modes.light['--rad-typography-family'], 'system-ui, sans-serif')
  assert.equal(t.modes.light['--rad-button-font-weight'], 900)
  const next = updateThemeDocument(d, { typography: { typesetting: { prose: { size: 24 } } } })
  assert.equal(
    compileThemeDocument(next).modes.light['--rad-typography-roles-prose-body-size'],
    '1.5rem'
  )
  assert.deepEqual(next.sections.typography.fonts, d.sections.typography.fonts)
  assert.deepEqual(next.sections.color, d.sections.color)
  assert.deepEqual(next.sections.motion, d.sections.motion)
  const imported = parseThemeDocument(
    JSON.parse(JSON.stringify(exportThemeSections(next, ['typography'])))
  )
  const target = updateThemeDocument(d, imported.sections, 'replace')
  assert.deepEqual(compileThemeDocument(target), compileThemeDocument(next))
  assert.equal(
    defineTheme({
      id: 'legacy',
      name: 'Legacy',
      tokens: { typography: { family: 'Brand', bodySize: '17px' } }
    }).modes.light['--rad-typography-body-size'],
    '17px'
  )
  assert.throws(
    () =>
      defineThemeDocument({
        ...d,
        sections: { typography: { typesetting: { prose: { size: 'huge' } } } }
      }),
    /typography.prose.size/
  )
})

test('the pure typography entry neither imports React nor reads browser globals', () => {
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    for(const name of ['window','document','FontFace','localStorage'])
      Object.defineProperty(globalThis,name,{get(){throw new Error(name)}});
    const {generateTypography}=await import('@cognitap/radiant/typography');
    generateTypography({preset:'source-serif'});
  `
    ],
    { stdio: 'pipe' }
  )
})
