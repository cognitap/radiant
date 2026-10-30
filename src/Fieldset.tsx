import type { ReactNode } from 'react'
import { Field, type FieldProps } from './Field.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { PartStyle } from './presentation.js'
export type FieldsetProps = Omit<
  Extract<FieldProps, { layout: 'group' }>,
  'layout' | 'label' | 'required' | 'requiredIndicator' | 'parts' | 'role'
> & {
  /** Names the group; nested Fields keep their individual labels. */
  legend: ReactNode
  parts?: { legend?: PartStyle; description?: PartStyle; error?: PartStyle }
}
/** Native grouping built on Field's existing relationships and disabled context. */
export function Fieldset({ legend, parts, className, ...props }: FieldsetProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <Field
      {...nativeProps}
      layout="group"
      label={legend}
      data-slot={joinIds('fieldset', props['data-slot'])}
      className={cn(
        'max-w-full [gap:var(--rad-fieldset-gap,var(--rad-spacing-group-gap,0.75rem))]',
        className
      )}
      parts={{
        label: {
          ...parts?.legend,
          className: cn(
            'max-w-full mb-[var(--rad-fieldset-gap,var(--rad-spacing-group-gap,0.75rem))]',
            parts?.legend?.className
          )
        },
        description: parts?.description,
        error: parts?.error
      }}
    />
  )
}
