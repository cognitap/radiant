import type { VariantProps } from 'class-variance-authority'
import type { actionVariants } from './actionStyles.js'

type ActionPresentation = VariantProps<typeof actionVariants>

export type ButtonVariant = NonNullable<ActionPresentation['variant']>
export type Tone = NonNullable<ActionPresentation['tone']>
export type ControlSize = NonNullable<ActionPresentation['controlSize']>
