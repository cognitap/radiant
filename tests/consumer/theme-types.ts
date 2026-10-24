import { createElement, createRef, type ComponentProps } from 'react'
import {
  Button,
  ThemeScope,
  defaultTheme,
  defineTheme,
  radiant,
  themes,
  type Theme,
  type ThemeDefinition
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
    input: { shadow: 'none' },
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
