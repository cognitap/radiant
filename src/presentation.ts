import type { VariantProps } from 'class-variance-authority'
import type { actionVariants } from './actionStyles.js'
import type { ThemeStyle } from './themes/defineTheme.js'

type ActionPresentation = VariantProps<typeof actionVariants>

export type ButtonVariant = NonNullable<ActionPresentation['variant']>
export type Tone = NonNullable<ActionPresentation['tone']>
export type ControlSize = 'small' | 'medium' | 'large'

export type PartStyle = { className?: string; style?: ThemeStyle }
export type ControlParts = { wrapper?: PartStyle; label?: PartStyle; indicator?: PartStyle }
