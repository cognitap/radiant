import './spinner-types.js'
import type * as Radiant from '@cognitap/radiant'
import './alert-dialog-types.js'
import './popover-types.js'
import './tooltip-types.js'
import './menu-types.js'
import './alert-types.js'
import './toast-types.js'
import './progress-types.js'
import { createElement, createRef, type ComponentProps, type Ref, useRef } from 'react'
import {
  updateThemeDocument,
  themeDocumentFromDefinition,
  Button,
  Link,
  ThemeScope,
  defaultTheme,
  defineTheme,
  defineThemeDocument,
  parseThemeDocument,
  compileThemeDocument,
  exportThemeSections,
  type ThemeDocument,
  type ThemeSectionExport,
  type ThemeSections,
  type Theme,
  type ThemeDefinition,
  type ThemeComponentOverrides,
  type ThemeStyle,
  updateThemeAppearance,
  type ThemeAppearanceSettings,
  generateTypography,
  type TypographyInput,
  type TypographyRole,
  Field,
  Select,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  type SelectProps,
  type SelectOption,
  Checkbox,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Radio,
  RadioGroup,
  Input,
  useField,
  type ButtonProps,
  type ButtonRenderProps,
  type ButtonVariant,
  type LinkVariant,
  type Tone,
  type ControlSize,
  type CheckboxProps,
  type FieldProps,
  type InputProps,
  type AccordionProps,
  type CardProps,
  type CardTitleProps,
  type CollapsibleProps,
  type DialogContentProps,
  type DialogTriggerProps,
  type DialogCloseProps,
  type DialogProps,
  type RadioGroupProps,
  type RadioProps,
  type LinkProps,
  type LinkRenderProps,
  type MotionProfile
} from '@cognitap/radiant'
import {
  generateColorWall,
  type ColorWall,
  type ColorWallInput,
  recommendColorPalette,
  type ColorPalette,
  type ColorPaletteOptions
} from '@cognitap/radiant/color'
import { radiant, themes } from '@cognitap/radiant/examples'
import { generateTypography as pure, typographyPresets } from '@cognitap/radiant/typography'
import {
  createSpring,
  createLayoutSpring,
  bindSpringStyle,
  createSpringDrag,
  bindSpringDrag,
  bindSpringSource,
  type SpringSource,
  bindSpringLayout,
  type SpringLayoutController
} from '@cognitap/radiant/motion'
import {
  useSpring,
  useSpringStyle,
  useReducedMotion,
  MotionProvider,
  MotionLink,
  type MotionLinkProps,
  useSpringDrag,
  useSpringFollow,
  useSpringLayout
} from '@cognitap/radiant/motion/react'

const input: ColorWallInput = {
  brand: '#7C3AED',
  wallPreset: 'expressive',
  rampPreset: 'balanced',
  brandVividness: 0.4,
  vividness: 0.7,
  neutralHue: -105
}
const wall: ColorWall = generateColorWall(input)
generateColorWall(wall.input)
updateThemeDocument(
  themeDocumentFromDefinition({ id: 'color', name: 'Color' }),
  { color: wall.color },
  'replace'
)
// @ts-expect-error Only sRGB is supported by algorithm version 1.
generateColorWall({ brand: '#7C3AED', gamut: 'display-p3' })
// @ts-expect-error Fidelity never silently adjusts the source.
generateColorWall({ brand: '#7C3AED', fidelity: 'adjusted' })
// @ts-expect-error Inputs contain data, not runtime generators.
generateColorWall({ brand: '#7C3AED', vividness: () => 0.5 })
// @ts-expect-error Known generator version only.
generateColorWall({ brand: '#7C3AED', version: 2 })
// @ts-expect-error Generated color data is deeply readonly.
wall.color.palettes[0].swatches.push({ stop: 500, value: '#ffffff' })

const options: ColorPaletteOptions = {
  working: { support: 'teal' },
  modes: { dark: { focus: '#ABCDEF' } }
}
const palette: ColorPalette = recommendColorPalette(wall, options)
updateThemeDocument(themeDocumentFromDefinition({ id: 'palette', name: 'Palette' }), {
  color: palette.color,
  surface: palette.surface
})
// @ts-expect-error Working roles are explicit; family IDs are validated against the wall at runtime.
recommendColorPalette(wall, { working: { extra: 'blue' } })
// @ts-expect-error Only light and dark are authored modes.
recommendColorPalette(wall, { modes: { system: {} } })
// @ts-expect-error Unknown semantic roles fail type checking.
recommendColorPalette(wall, { modes: { light: { activePink: '#ffffff' } } })
// @ts-expect-error Recommendations are deeply readonly.
palette.color.modes.light.accent = '#ffffff'

// @ts-expect-error Presets have stable public IDs.
generateColorWall({ brand: '#7C3AED', wallPreset: 'studio' })

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

const typographyInput: TypographyInput = {
  preset: 'source-serif',
  fonts: { headings: { family: 'Brand Heading' } },
  styles: { 'prose-title': { weight: 650, wide: 64 } }
}
const role: TypographyRole = 'prose-title'
const generated = pure(typographyInput)
const d = defineThemeDocument({
  kind: 'radiant-theme',
  version: 1,
  id: 'typed',
  name: 'Typed',
  sections: {
    typography: { typesetting: typographyInput, values: { roles: { [role]: { weight: 700 } } } }
  }
})
compileThemeDocument(updateThemeDocument(d, { typography: { typesetting: { ui: { size: 18 } } } }))
generateTypography(generated.input)
// @ts-expect-error Preset assignments are immutable, as is their runtime registry.
typographyPresets.inter.fonts.body = { ...typographyPresets.inter.fonts.body }
// @ts-expect-error Roles are closed.
generateTypography({ styles: { headline: { weight: 700 } } })
// @ts-expect-error Size inputs are numeric reference pixels, not arbitrary CSS.
generateTypography({ prose: { size: '20px' } })
// @ts-expect-error Only confirmed profiles can claim a studied starting point.
generateTypography({ fonts: { body: { family: 'Other', profile: 'ai' } } })
// @ts-expect-error Output is deeply readonly.
generated.tokens.roles['prose-body'].size = '2rem'
// @ts-expect-error Token lengths stay CSS strings.
updateThemeDocument(d, { typography: { values: { roles: { 'prose-title': { size: 64 } } } } })

const items: readonly SelectOption[] = [
  { value: '', label: 'None' },
  { value: 'team', label: <span>Our team</span>, textValue: 'Our team' }
]
const selectSelection: SelectProps = {
  items,
  value: null,
  onValueChange(value) {
    const next: string | null = value
    void next
  },
  open: false
}
export const example = (
  <Field label="Workspace">
    <Select
      {...selectSelection}
      name="workspace"
      form="profile"
    >
      <SelectTrigger
        ref={createRef<HTMLButtonElement>()}
        render={resolved => <button {...resolved} />}
      >
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          position="popper"
          motion="off"
          ref={createRef<HTMLDivElement>()}
        >
          <SelectViewport>
            <SelectItem value="team">
              <SelectItemText />
              <SelectItemIndicator />
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </Select>
  </Field>
)
// @ts-expect-error One value owner per mount.
const mixed: SelectProps = { items, value: 'team', defaultValue: '' }
// @ts-expect-error One open-state owner per mount.
const mixedOpen: SelectProps = { items, open: true, defaultOpen: false }
// @ts-expect-error Single selection uses strings or null, never arrays.
const multiple: SelectProps = { items, value: ['team'] }
// @ts-expect-error Rich labels need explicit keyboard/native text.
const unnamed: SelectOption = { value: 'team', label: <span>Team</span> }
void [mixed, mixedOpen, multiple, unnamed]
// @ts-expect-error Disabled belongs to Select/Field so its form bridge and trigger agree.
export const disabledPart = <SelectTrigger disabled />

const props: ButtonProps = {
  type: 'submit',
  disabled: true,
  pending: true,
  variant: 'solid',
  tone: 'danger',
  controlSize: 'large',
  iconOnly: true,
  fullWidth: true,
  'aria-label': 'Save',
  ref: createRef<HTMLButtonElement>()
}
createElement(Button, props)

const renderButton = (resolved: ButtonRenderProps) => {
  const ref: Ref<HTMLButtonElement> | undefined = resolved.ref
  const variant: ButtonVariant = resolved['data-variant']
  const tone: Tone = resolved['data-tone']
  const size: ControlSize = resolved['data-control-size']
  void [ref, variant, tone, size]
  // @ts-expect-error Button consumes presentation props before host replacement.
  void resolved.pending
  // @ts-expect-error Button owns the render callback; it never reaches the host.
  void resolved.render
  return createElement('button', resolved)
}
createElement(Button, { render: renderButton })
createElement(DialogTrigger, { render: renderButton })
createElement(DialogClose, { render: renderButton })
// @ts-expect-error Button replacement returns one compatible element.
createElement(Button, { render: () => 'text' })
// @ts-expect-error A replacement must retain a host.
createElement(Button, { render: () => null })
// @ts-expect-error A replacement cannot return an array of hosts.
createElement(Button, { render: () => [createElement('button')] })

// @ts-expect-error Variants are a closed set.
const invalidVariant: ButtonProps = { variant: 'link' }
createElement(Button, invalidVariant)

// @ts-expect-error Native button types must survive the public declaration export.
const invalidProps: ButtonProps = { type: 'invalid' }
createElement(Button, invalidProps)

const linkProps: LinkProps = {
  href: '/next',
  target: '_blank',
  download: true,
  variant: 'solid',
  tone: 'danger',
  controlSize: 'small',
  external: true,
  ref: createRef<HTMLAnchorElement>()
}
createElement(Link, linkProps)

createElement(Link, {
  ref: createRef<HTMLAnchorElement>(),
  render: resolved => {
    const native: LinkRenderProps = resolved
    const ref: LinkProps['ref'] = native.ref
    void ref
    // @ts-expect-error Presentation props have been resolved into native props.
    void native.tone
    return createElement('a', native)
  }
})
// @ts-expect-error A replacement must return one element.
createElement(Link, { render: () => 'text' })
// @ts-expect-error A replacement cannot disappear.
createElement(Link, { render: () => null })
// @ts-expect-error A replacement is not a list of elements.
createElement(Link, { render: () => [createElement('a')] })
// @ts-expect-error Link has native anchor semantics, without disabled state.
const disabledLink: LinkProps = { disabled: true }
// @ts-expect-error Pending actions belong to Button.
const pendingLink: LinkProps = { pending: true }
void [disabledLink, pendingLink]

// @ts-expect-error Link variants are a closed set.
const invalidLinkVariant: LinkProps = { variant: 'button' }
createElement(Link, invalidLinkVariant)

useField()

const fieldProps: FieldProps = {
  label: 'Email',
  description: 'Work address',
  error: 'Missing',
  required: true,
  disabled: false,
  requiredIndicator: '(required)',
  controlId: 'email',
  ref: createRef<HTMLDivElement>(),
  parts: {
    label: { className: 'italic' },
    description: { style: { '--rad-field-description-color': 'rebeccapurple' } },
    error: { className: 'font-bold' },
    required: { style: { marginInlineStart: '0.5em' } }
  },
  children: control => createElement('input', control)
}
createElement(Field, fieldProps)
createElement(Field, {
  layout: 'group',
  label: 'Plan',
  form: 'profile',
  name: 'plan',
  ref: createRef<HTMLFieldSetElement>()
})

// @ts-expect-error A control Field renders a div, with no native form association.
const controlForm: FieldProps = { label: 'Email', form: 'profile' }
// @ts-expect-error A group ref targets its fieldset.
const groupRef: FieldProps = { layout: 'group', label: 'Plan', ref: createRef<HTMLDivElement>() }
// @ts-expect-error A control ref targets its div.
const controlRef: FieldProps = { label: 'Email', ref: createRef<HTMLFieldSetElement>() }
// @ts-expect-error Groups have multiple controls, with no single controlId.
const groupControlId: FieldProps = { layout: 'group', label: 'Plan', controlId: 'one' }
// @ts-expect-error Groups take normal children, not a single-control adapter.
const groupAdapter: FieldProps = { layout: 'group', label: 'Plan', children: () => null }
// @ts-expect-error Part hooks style the owned label; they cannot replace its relationship.
const fieldPartId: FieldProps = { label: 'Email', parts: { label: { htmlFor: 'other' } } }
void [controlForm, groupRef, controlRef, groupControlId, groupAdapter, fieldPartId]

// @ts-expect-error Field layouts are a closed set.
const invalidFieldLayout: FieldProps = { layout: 'inline', label: 'Email' }
createElement(Field, invalidFieldLayout)

const inputProps: InputProps = {
  name: 'email',
  type: 'email',
  autoComplete: 'email',
  defaultValue: 'ada@example.com',
  size: 24,
  controlSize: 'large',
  style: { '--rad-input-radius': '1rem' },
  required: true,
  ref: createRef<HTMLInputElement>()
}
createElement(Input, inputProps)

const checkboxProps: CheckboxProps = {
  name: 'channels',
  value: 'email',
  defaultChecked: true,
  indeterminate: true,
  controlSize: 'small',
  label: 'Email',
  parts: {
    wrapper: { className: 'gap-4' },
    label: { style: { fontStyle: 'italic' } },
    indicator: { className: 'scale-75' }
  },
  disabled: false,
  ref: createRef<HTMLInputElement>()
}
createElement(Checkbox, checkboxProps)

// @ts-expect-error Checkbox type is fixed.
const invalidCheckbox: CheckboxProps = { type: 'radio' }
createElement(Checkbox, invalidCheckbox)

const radioGroupProps: RadioGroupProps = {
  label: 'Plan',
  name: 'plan',
  value: null,
  controlSize: 'large',
  required: true,
  form: 'profile',
  className: 'p-4',
  style: { margin: 0 },
  'data-slot': 'plan',
  ref: createRef<HTMLFieldSetElement>(),
  parts: {
    label: { className: 'italic' },
    options: { className: 'flex', style: { gap: '1rem' } }
  },
  onValueChange(value: string) {
    void value
  }
}
createElement(RadioGroup, radioGroupProps, createElement(Radio, { label: 'Pro', value: 'pro' }))

const radioProps: RadioProps = {
  name: 'plan',
  value: 'pro',
  defaultChecked: true,
  controlSize: 'medium',
  label: 'Pro',
  parts: {
    wrapper: { className: 'gap-4' },
    label: { className: 'italic' },
    indicator: { style: { inset: '25%' } }
  },
  ref: createRef<HTMLInputElement>()
}
createElement(Radio, radioProps)

// @ts-expect-error Styling hooks cannot redirect label relationships.
const checkboxPartId: CheckboxProps = { parts: { label: { id: 'other' } } }
// @ts-expect-error Styling hooks cannot attach event handlers.
const radioPartEvent: RadioProps = { value: 'pro', parts: { wrapper: { onClick() {} } } }
const groupPartRef: RadioGroupProps = {
  name: 'plan',
  label: 'Plan',
  // @ts-expect-error Group parts cannot redirect refs away from the fieldset.
  parts: { options: { ref: createRef<HTMLDivElement>() } }
}
void [checkboxPartId, radioPartEvent, groupPartRef]

// @ts-expect-error Native Input size remains numeric character width.
const visualNativeSize: InputProps = { size: 'large' }
// @ts-expect-error Visual control sizes use the shared closed vocabulary.
const unknownControlSize: CheckboxProps = { controlSize: 'default' }
// @ts-expect-error Native values have one owner.
const mixedInput: InputProps = { value: '', defaultValue: '' }
// @ts-expect-error Checked state has one owner, including false.
const mixedCheckbox: CheckboxProps = { checked: false, defaultChecked: true }
// @ts-expect-error Standalone Radio checked state has one owner.
const mixedRadio: RadioProps = { value: 'yes', checked: false, defaultChecked: true }
// @ts-expect-error RadioGroup has one owner; null is a supplied controlled value.
const mixedGroup: RadioGroupProps = {
  label: 'Plan',
  name: 'plan',
  value: null,
  defaultValue: 'pro'
}
// @ts-expect-error Controlled text values use an empty string rather than null.
const nullInput: InputProps = { value: null }
void [
  visualNativeSize,
  unknownControlSize,
  mixedInput,
  mixedCheckbox,
  mixedRadio,
  mixedGroup,
  nullInput
]

// @ts-expect-error Radio type is fixed.
const invalidRadio: RadioProps = { type: 'checkbox', value: 'pro' }
createElement(Radio, invalidRadio)

const dialogProps: DialogProps = {
  open: true,
  modal: true,
  closeOnBackdrop: true,
  closeOnEscape: false,
  onOpenChange(open: boolean) {
    void open
  }
}
createElement(
  Dialog,
  dialogProps,
  createElement(DialogTrigger, null, 'Edit'),
  createElement(
    DialogContent,
    {
      ref: createRef<HTMLDialogElement>(),
      className: 'open:p-0',
      style: { '--rad-dialog-width': '24rem', '--rad-motion-color-duration': '0ms' }
    },
    createElement(
      DialogTitle,
      { ref: createRef<HTMLHeadingElement>(), style: { '--rad-dialog-title-size': '1.25rem' } },
      'Profile'
    ),
    createElement(
      DialogDescription,
      { ref: createRef<HTMLParagraphElement>(), style: { fontStyle: 'italic' } },
      'Your details'
    )
  )
)

// @ts-expect-error Dialog has one open-state owner, including false.
const mixedDialog: DialogProps = { open: false, defaultOpen: true }
// @ts-expect-error Dialog is a non-DOM owner; styles and refs belong to its parts.
const styledDialog: DialogProps = { className: 'p-4' }
// @ts-expect-error DialogContent refs target the native dialog, not a div wrapper.
const wrongDialogRef: DialogContentProps = { ref: createRef<HTMLDivElement>() }
void [mixedDialog, styledDialog, wrongDialogRef]

const dialogTriggerProps: DialogTriggerProps = {
  variant: 'outline',
  controlSize: 'small',
  pending: true,
  iconOnly: true,
  fullWidth: true,
  ref: createRef<HTMLButtonElement>()
}
createElement(DialogTrigger, dialogTriggerProps)
const dialogCloseProps: DialogCloseProps = {
  variant: 'ghost',
  pending: true,
  ref: node => {
    node?.focus()
    return () => {}
  },
  render: renderButton
}
createElement(DialogClose, dialogCloseProps)
// @ts-expect-error Dialog actions use the same closed variant vocabulary as Button.
const invalidDialogAction: DialogTriggerProps = { variant: 'link' }
createElement(DialogTrigger, invalidDialogAction)

const collapsibleProps: CollapsibleProps = {
  open: true,
  style: { '--rad-motion-color-duration': '0ms' },
  ref: createRef<HTMLDetailsElement>(),
  name: 'faq',
  onOpenChange(open: boolean) {
    void open
  }
}
createElement(
  Collapsible,
  collapsibleProps,
  createElement(
    CollapsibleTrigger,
    { ref: createRef<HTMLElement>(), style: { '--rad-focus-width': '3px' } },
    'Shipping'
  ),
  createElement(
    CollapsibleContent,
    { ref: createRef<HTMLDivElement>(), style: { '--rad-collapsible-content-size': '1rem' } },
    'Ships in two days.'
  )
)

const accordionProps: AccordionProps = {
  type: 'single',
  value: 'shipping',
  style: { '--rad-accordion-gap': '1rem' },
  ref: createRef<HTMLDivElement>(),
  disabled: false,
  onValueChange(value: string | null) {
    void value
  }
}
createElement(
  Accordion,
  accordionProps,
  createElement(
    AccordionItem,
    { value: 'shipping', disabled: true, motion: 'off', ref: createRef<HTMLDetailsElement>() },
    createElement(AccordionTrigger, { level: 3 }, 'Shipping'),
    createElement(AccordionContent, null, 'Ships in two days.')
  )
)
createElement(
  Accordion,
  {
    type: 'multiple',
    value: ['shipping'],
    onValueChange(value: string[]) {
      void value
    }
  },
  createElement(
    AccordionItem,
    { value: 'shipping' },
    createElement(AccordionTrigger, { level: null }, 'Shipping')
  )
)

// @ts-expect-error A single accordion value is one section, not a list.
const invalidAccordion: AccordionProps = { type: 'single', value: ['shipping'] }
createElement(Accordion, invalidAccordion)

const cardProps: CardProps = {
  role: 'region',
  'aria-labelledby': 'ship',
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-card-padding': '1rem' },
  'data-slot': 'product'
}
const cardTitleProps: CardTitleProps = {
  id: 'ship',
  level: 3,
  ref: createRef<HTMLHeadingElement>(),
  style: { '--rad-card-title-size': '1.25rem' }
}
createElement(
  Card,
  cardProps,
  createElement(
    CardHeader,
    { ref: createRef<HTMLDivElement>(), style: { '--rad-surface-gap': '1rem' } },
    createElement(CardTitle, cardTitleProps, 'Shipping')
  ),
  createElement(
    CardDescription,
    { ref: createRef<HTMLParagraphElement>(), style: { '--rad-surface-gap': '1rem' } },
    'Leaves the studio tomorrow.'
  ),
  createElement(
    CardContent,
    { ref: createRef<HTMLDivElement>(), style: { '--rad-surface-gap': '1rem' } },
    'Ships in two days.'
  ),
  createElement(
    CardFooter,
    { ref: createRef<HTMLDivElement>(), style: { '--rad-surface-gap': '1rem' } },
    'Track'
  )
)

// @ts-expect-error The dialog open attribute is owned by showModal.
const invalidDialog: DialogContentProps = { open: true }
createElement(DialogContent, invalidDialog)

// All action axes compose across both native hosts and Dialog actions.
const actionVariants: ButtonVariant[] = ['solid', 'soft', 'outline', 'ghost']
const actionTones: Tone[] = ['accent', 'neutral', 'warning', 'danger']
const controlSizes: ControlSize[] = ['small', 'medium', 'large']
for (const variant of actionVariants) {
  for (const tone of actionTones) {
    for (const controlSize of controlSizes) {
      createElement(Button, { variant, tone, controlSize, type: 'reset', form: 'profile' })
      createElement(Link, { variant, tone, controlSize, href: '/guide', download: 'guide.pdf' })
      createElement(DialogTrigger, { variant, tone, controlSize })
      createElement(DialogClose, { variant, tone, controlSize })
    }
  }
}
const linkVariants: LinkVariant[] = [...actionVariants, 'inline', 'subtle']
for (const variant of linkVariants) createElement(Link, { variant, tone: 'warning' })

// @ts-expect-error Colour names no longer stand for treatment.
const oldButtonVariant: ButtonProps = { variant: 'primary' }
// @ts-expect-error Tone is a palette role, not an appearance.
const appearanceAsTone: LinkProps = { tone: 'outline' }
// @ts-expect-error Visual sizing has one canonical vocabulary.
const oldControlSize: ButtonProps = { controlSize: 'default' }
// @ts-expect-error The old size prop is removed from actions.
const oldButtonSize: ButtonProps = { size: 'small' }
// @ts-expect-error The old size prop is removed from anchors too.
const oldLinkSize: LinkProps = { size: 'small' }
// @ts-expect-error Radius belongs to theme or local CSS.
const oldButtonRadius: ButtonProps = { radius: 'full' }
// @ts-expect-error Radius belongs to theme or local CSS on Link too.
const oldLinkRadius: LinkProps = { radius: 'full' }
// @ts-expect-error Replaced with ControlSize.
import type { ButtonSize } from '@cognitap/radiant'
// @ts-expect-error Removed in favour of theme or CSS.
import type { ButtonRadius } from '@cognitap/radiant'
export type RetiredActionExports = [ButtonSize, ButtonRadius]
void [
  oldButtonVariant,
  appearanceAsTone,
  oldControlSize,
  oldButtonSize,
  oldLinkSize,
  oldButtonRadius,
  oldLinkRadius
]

// @ts-expect-error Disclosure open state has one owner.
const mixedDisclosure: CollapsibleProps = { open: false, defaultOpen: true }
// @ts-expect-error Accordion selection has one owner, including null.
const mixedSelection: AccordionProps = { value: null, defaultValue: 'shipping' }
void [mixedDisclosure, mixedSelection]

// @ts-expect-error A passive Card has no disabled control state.
const disabledCard: CardProps = { disabled: true }
// @ts-expect-error CardTitle uses a native heading level.
const invalidCardHeading: CardTitleProps = { level: 7 }
void [disabledCard, invalidCardHeading]

const theme = defineTheme({
  id: 'motion-consumer',
  name: 'Motion consumer',
  motion: { interactions: { press: { stiffness: 400 } } }
})
const profile: MotionProfile = theme.motion
const spring = createSpring(0, { parameters: profile.interactions.follow })
spring.to(120)
spring.configure({ enabled: false })
const layout = createLayoutSpring({ x: 0, y: 0, width: 120, height: 60 })
layout.to({ x: 0, y: 20, width: 180, height: 80 })
function Bound() {
  const ref = useRef<HTMLButtonElement>(null)
  const scale = useSpringStyle(ref, 'scale', 1, 'press', 1)
  const value = useSpring(0, 'follow')
  const reduced = useReducedMotion()
  return (
    <ThemeScope theme={theme}>
      <Button
        ref={ref}
        onClick={() => {
          scale.to(0.96)
          value.to(reduced ? 0 : 100)
        }}
      >
        Save
      </Button>
    </ThemeScope>
  )
}
void Bound
void bindSpringStyle
// @ts-expect-error arbitrary transform ownership is unsupported
bindSpringStyle(document.createElement('button'), spring, 'transform')
// @ts-expect-error arbitrary CSS-unit strings are unsupported
spring.to('10rem')

const motionAnchor: MotionLinkProps = {
  href: '/guide',
  variant: 'outline',
  tone: 'neutral',
  controlSize: 'large',
  motion: 'off',
  ref: (node: HTMLAnchorElement | null) => () => void node,
  render: (resolved: LinkRenderProps) => <a {...resolved}>{resolved.children}</a>,
  download: 'guide.html',
  target: '_self',
  rel: 'author'
}
// @ts-expect-error Only the opt-in client adapter accepts motion.
const plainMotion: LinkProps = { motion: 'off' }
// @ts-expect-error Links retain native navigation instead of pending actions.
const pendingMotion: MotionLinkProps = { pending: true }
// @ts-expect-error Links retain native navigation instead of disabled actions.
const disabledMotion: MotionLinkProps = { disabled: true }
void [motionAnchor, plainMotion, pendingMotion, disabledMotion]
const actions = (
  <MotionProvider>
    <Button motion="off">Off</Button>
    <MotionLink
      variant="solid"
      href="/next"
    >
      Next
    </MotionLink>
  </MotionProvider>
)
void actions

const drag = createSpringDrag(0, { min: 0, max: 160, snapPoints: [0, 80, 160] })
drag.begin()
drag.move(40, 10)
drag.release(20)
drag.destroy()
void bindSpringDrag
void useSpringDrag
function DragBinding() {
  const ref = useRef<HTMLButtonElement>(null)
  const control = useSpringDrag(ref, 0, { min: 0, max: 160, snapPoints: [0, 80, 160], axis: 'x' })
  return (
    <Button
      ref={ref}
      onClick={() => control.step('last')}
    >
      Drag
    </Button>
  )
}
void DragBinding

const source: SpringSource = spring
const detachSource = bindSpringSource(createSpring(0), source)
detachSource()
function Following({ target }: { target: number | SpringSource }) {
  const follower = useSpringFollow(target)
  return <Button onClick={() => follower.stop()}>Pause</Button>
}
void Following
// @ts-expect-error targets use consistent numeric units
useSpringFollow('20%')

function LayoutBinding() {
  const ref = useRef<HTMLDivElement>(null)
  const layout = useSpringLayout(ref)
  layout.get(document.createElement('div'))?.width.toFixed(1)
  // @ts-expect-error React owns theme policy and lifecycle
  layout.configure({ enabled: true })
  return (
    <div ref={ref}>
      <div data-rad-layout-slot="">
        <div data-rad-layout-part="">Card</div>
      </div>
    </div>
  )
}
const bindLayout: (root: HTMLElement) => SpringLayoutController = bindSpringLayout
void bindLayout
void LayoutBinding

import './textarea-types.js'

import './switch-types.js'

import './slider-types.js'

import './tabs-types.js'

import './combobox-types.js'
