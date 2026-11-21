import type { CatalogSpacing } from './catalog/types.js'
import type { VariantProps } from 'class-variance-authority'
import type { actionVariants } from './components/shared/actionStyles.js'
import type { ThemeStyle } from './themes/defineTheme.js'

type ActionPresentation = VariantProps<typeof actionVariants>

export type ButtonVariant = NonNullable<ActionPresentation['variant']>
export type Tone = NonNullable<ActionPresentation['tone']>
export type ControlSize = 'small' | 'medium' | 'large'
/** Steps of the theme spacing scale: `tight`, `normal` (the default) and `airy`. */
export type Spacing = CatalogSpacing
export type Orientation = 'horizontal' | 'vertical'

export type PartStyle = { className?: string; style?: ThemeStyle }
export type ControlParts = { wrapper?: PartStyle; label?: PartStyle; indicator?: PartStyle }
