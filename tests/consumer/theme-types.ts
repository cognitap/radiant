import type * as Radiant from '@cognitap/radiant'
import { createElement, createRef, type ComponentProps } from 'react'
import {
  Button,
  Link,
  ThemeScope,
  defaultTheme,
  defineTheme,
  radiant,
  themes,
  type Theme,
  type ThemeDefinition,
  type ThemeComponentOverrides,
  type ThemeStyle
} from '@cognitap/radiant'

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
