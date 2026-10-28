import type * as Radiant from '@cognitap/radiant'
import { createElement, createRef, type ComponentProps } from 'react'
import {
  Button,
  Link,
  ThemeScope,
  defaultTheme,
  defineTheme,
  defineThemeDocument,
  parseThemeDocument,
  compileThemeDocument,
  updateThemeDocument,
  exportThemeSections,
  themeDocumentFromDefinition,
  type ThemeDocument,
  type ThemeSectionExport,
  type ThemeSections,
  type Theme,
  type ThemeDefinition,
  type ThemeComponentOverrides,
  type ThemeStyle
} from '@cognitap/radiant'
import { radiant, themes } from '@cognitap/radiant/examples'

const definition: ThemeDefinition = {
  id: 'consumer-brand',
  name: 'Consumer brand',
  tokens: {
    color: { accent: '#14532d', accentForeground: 'white' },
    typography: { family: 'system-ui, sans-serif', bodyWeight: 400 },
    control: { medium: { height: '2.75rem' }, radius: '0.75rem' },
    surface: { canvas: 'linear-gradient(white, #f0fdf4)' },
    focus: { offset: '3px' },
    state: { disabledOpacity: 0.5 }
  },
  components: {
    button: { fontWeight: 650, pressScale: 0.97 },
    link: { color: 'oklch(0.5 0.1 250)', focusWidth: '3px' },
    field: { gap: '0.5rem', labelWeight: 650 },
    input: { shadow: 'none', height: '3rem' },
    checkbox: { size: '1.25rem', mark: 'white' },
    radio: { size: '1.25rem', radius: '999px' },
    dialog: { width: '24rem', backdrop: 'transparent' },
    collapsible: { radius: '1rem', duration: '0ms' },
    accordion: { gap: '0.5rem' },
    card: { radius: '1rem', padding: '0', titleWeight: 550 },
    radioGroup: { gap: '1rem' }
  },
  modes: {
    dark: { tokens: { color: { accent: '#86efac', accentForeground: '#052e16' } } }
  }
}
const brand: Theme = defineTheme(definition)
const scopeProps: ComponentProps<typeof ThemeScope> = {
  theme: brand,
  mode: 'system',
  id: 'settings',
  className: 'settings',
  style: { padding: '1rem', '--rad-control-radius': '1rem' },
  ref: createRef<HTMLDivElement>(),
  onClick(event) {
    event.currentTarget.focus()
  }
}
createElement(ThemeScope, scopeProps, createElement(Button, null, 'Save'))
createElement(
  ThemeScope,
  { theme: radiant, mode: 'dark' },
  createElement(ThemeScope, { theme: defaultTheme })
)
createElement(ThemeScope, { mode: 'light' })
createElement(ThemeScope, null)

const selected: Theme | undefined = themes.find(theme => theme.id === 'radiant')
createElement(ThemeScope, { theme: selected })

// @ts-expect-error Shared semantic token roles are a closed set.
defineTheme({ id: 'bad-color', name: 'Bad color', tokens: { color: { primary: 'red' } } })
defineTheme({
  id: 'bad-override',
  name: 'Bad override',
  // @ts-expect-error Component override names are checked, including nested literals.
  components: { button: { radiusOnPress: '1rem' } }
})
// @ts-expect-error Inert legacy hover glow is not part of the authoring API.
defineTheme({ id: 'bad-glow', name: 'Bad glow', components: { button: { glowHover: '70%' } } })
// @ts-expect-error RadioGroup owns group layout; Radio owns its label gap.
defineTheme({ id: 'bad-gap', name: 'Bad gap', components: { radio: { gap: '1rem' } } })
// @ts-expect-error CSS lengths remain CSS strings.
defineTheme({ id: 'bad-length', name: 'Bad length', tokens: { control: { radius: 8 } } })
defineTheme({
  id: 'bad-opacity',
  name: 'Bad opacity',
  // @ts-expect-error Opacity is numeric.
  tokens: { state: { disabledOpacity: '0.5' } }
})
// @ts-expect-error Only light and dark have authoring layers; system selects one through CSS.
defineTheme({ id: 'bad-mode', name: 'Bad mode', modes: { system: {} } })
// @ts-expect-error ThemeScope mode is light, dark or system.
createElement(ThemeScope, { mode: 'automatic' })
// @ts-expect-error Resolved preset identity is immutable.
brand.id = 'changed'
// @ts-expect-error The preset registry cannot be mutated by consumers.
themes.push(brand)
// @ts-expect-error Resolved mode values are readonly.
brand.modes.dark['--rad-color-accent'] = 'pink'

// Local overrides use native styles and the same prefixed variable vocabulary.
const local: ThemeStyle = { '--rad-button-radius': '1rem', margin: '1rem' }
createElement(Button, { style: local })
createElement(Button, { style: { '--rad-button-radius': '1rem' } })
createElement(Link, { style: { '--rad-link-color': 'rebeccapurple' } })
// @ts-expect-error The deprecated resolved style map has been removed.
void brand.style
// @ts-expect-error ThemeScope owns mode-appropriate canvas selection.
void brand.surface
// @ts-expect-error Family aliases have been replaced by ThemeComponentOverrides.
export type RemovedButtonTheme = Radiant.ButtonTheme
// @ts-expect-error Radio group layout is no longer hidden in a RadioTheme alias.
export type RemovedRadioTheme = Radiant.RadioTheme

const invalid: ThemeComponentOverrides = {
  // @ts-expect-error Link override keys remain closed.
  link: { background: 'red' },
  // @ts-expect-error Field override keys remain closed.
  field: { gapSize: '1rem' },
  // @ts-expect-error Input override keys remain closed.
  input: { heightPx: '3rem' },
  // @ts-expect-error Checkbox override keys remain closed.
  checkbox: { boxSize: '1rem' },
  // @ts-expect-error Radio override keys remain closed.
  radio: { diskSize: '1rem' },
  // @ts-expect-error Dialog override keys remain closed.
  dialog: { size: '24rem' },
  // @ts-expect-error Collapsible override keys remain closed.
  collapsible: { panel: '1rem' },
  // @ts-expect-error Accordion layout stays independent from Collapsible shape.
  accordion: { radius: '1rem' },
  // @ts-expect-error Card override keys remain closed.
  card: { panel: '1rem' }
}
void invalid

const workshop: ThemeDocument = themeDocumentFromDefinition(definition)
const authored: ThemeDocument = defineThemeDocument({
  kind: 'radiant-theme',
  version: 1,
  id: 'portable',
  name: 'Portable',
  sections: {
    color: {
      brand: { value: '#14532d', gamut: 'srgb' },
      palettes: [{ id: 'brand', name: 'Brand', swatches: [{ stop: 500, value: '#14532d' }] }],
      anchor: { paletteId: 'brand', stop: 500 },
      modes: { dark: { accent: '#86efac' } }
    },
    typography: {
      fonts: [{ id: 'local-sans', family: 'Local Sans', source: 'local', weights: [400, 650] }]
    },
    components: { values: { button: { pressScale: 0.96 } } }
  }
})
const selection: ThemeSectionExport = exportThemeSections(authored, ['color', 'typography'])
const imported: unknown = JSON.parse(JSON.stringify(selection))
const parsed = parseThemeDocument(imported)
const next =
  parsed.kind === 'radiant-theme'
    ? parsed
    : updateThemeDocument(workshop, parsed.sections, 'replace')
createElement(ThemeScope, { theme: compileThemeDocument(next), mode: 'system' })
// @ts-expect-error A selective export cannot replace a full document or compile without identity.
compileThemeDocument(selection)
// @ts-expect-error Known portable schema version only.
defineThemeDocument({ ...workshop, version: 2 })
// @ts-expect-error Selective exports only name supported sections.
exportThemeSections(workshop, ['everything'])
// @ts-expect-error Token groups retain their original types within section updates.
updateThemeDocument(workshop, { surface: { values: { radius: 4 } } })
// @ts-expect-error Existing component overrides remain checked.
updateThemeDocument(workshop, { components: { values: { button: { sparkle: 1 } } } })
// @ts-expect-error Future structured spring behavior is not an untyped data escape hatch.
updateThemeDocument(workshop, { motion: { engine: () => {} } })
// @ts-expect-error Source colors retain explicit gamut metadata.
updateThemeDocument(workshop, { color: { brand: { value: '#123456', gamut: 'unknown' } } })
updateThemeDocument(workshop, {
  // @ts-expect-error Numbered palette stops are a closed set.
  color: { palettes: [{ id: 'a', name: 'A', swatches: [{ stop: 550, value: 'red' }] }] }
})
updateThemeDocument(workshop, {
  // @ts-expect-error Portable font metadata contains no local file handles or font bytes.
  typography: { fonts: [{ id: 'a', family: 'A', source: 'local', bytes: new Uint8Array() }] }
})
// @ts-expect-error Documents and their source metadata are deeply readonly.
authored.sections.color!.brand!.value = 'changed'
const sectionPatch: ThemeSections = { spacing: { values: { fieldGap: '1rem' } } }
updateThemeDocument(workshop, sectionPatch)

import {
  updateThemeAppearance,
  recommendColorPalette,
  generateColorWall,
  type ThemeAppearanceSettings
} from '@cognitap/radiant'
const appearance: ThemeAppearanceSettings = {
  palette: recommendColorPalette(generateColorWall({ brand: '#7C3AED' })),
  geometry: {
    values: { spacing: 1.25, density: 0.9, controlRadius: 8, elevation: 2 },
    modes: { dark: { backdropOpacity: 0.7 } }
  }
}
createElement(ThemeScope, {
  theme: compileThemeDocument(updateThemeAppearance(workshop, appearance))
})
// @ts-expect-error Geometry controls are bounded numbers, not arbitrary CSS strings.
updateThemeAppearance(workshop, { geometry: { values: { controlRadius: '1rem' } } })
// @ts-expect-error Elevation has four supported levels.
updateThemeAppearance(workshop, { geometry: { values: { elevation: 4 } } })
// @ts-expect-error Structured spring settings remain a separate concern.
updateThemeAppearance(workshop, { geometry: { values: { spring: {} } } })
// @ts-expect-error Independent authoring modes are light and dark.
updateThemeAppearance(workshop, { geometry: { modes: { system: {} } } })
// @ts-expect-error A raw wall has no semantic roles or canvas layer; map it first.
updateThemeAppearance(workshop, { palette: generateColorWall({ brand: '#7C3AED' }) })

const fontAxis: import('@cognitap/radiant').ThemeFontAxis = {
  tag: 'opsz',
  min: 8,
  default: 20,
  max: 72
}
const fontRequirements: import('@cognitap/radiant').ThemeFontMetadata = {
  id: 'brand',
  family: 'Brand font',
  source: 'local',
  axes: [fontAxis],
  weights: [450],
  styles: ['normal']
}
void fontRequirements
