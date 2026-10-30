'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { controlBorderClass, controlMetrics } from './controlStyles.js'
import { useFieldControl } from './Field.js'
import { joinIds } from './internal/ids.js'
import { useNativeOwner, type ValueOwner } from './react/useNativeOwner.js'
import type { ControlSize } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type NativeSelectProps = Omit<
  ComponentProps<'select'>,
  'value' | 'defaultValue' | 'style' | 'role'
> &
  ValueOwner<Exclude<ComponentProps<'select'>['value'], undefined>> & {
    controlSize?: ControlSize
    style?: ThemeStyle
    'data-slot'?: string
  }

/** The browser owns its picker, option navigation, selection and native forms. */
export function NativeSelect({
  className,
  controlSize = 'medium',
  id,
  disabled,
  required,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  'aria-required': ariaRequired,
  ...props
}: NativeSelectProps) {
  useNativeOwner('NativeSelect', props.value, props.defaultValue)
  if (props.value === null)
    throw new TypeError('NativeSelect value cannot be null. Use an empty string or array.')
  const control = useFieldControl({
    id,
    disabled,
    required,
    'aria-describedby': describedBy,
    'aria-invalid': invalid,
    'aria-required': ariaRequired
  })
  const listbox = props.multiple || (props.size ?? 0) > 1
  const native = { ...props, role: undefined }
  return (
    <select
      {...native}
      {...control}
      data-slot={joinIds('native-select', props['data-slot'])}
      data-control-size={controlSize}
      className={cn(
        controlBorderClass,
        controlMetrics({ controlSize }),
        'box-border block w-full min-w-0 appearance-auto text-start px-[var(--rad-native-select-padding,var(--_rad-control-padding))]',
        listbox
          ? 'h-auto min-h-[var(--rad-native-select-height,var(--_rad-control-height))] py-2'
          : 'h-[var(--rad-native-select-height,var(--_rad-control-height))]',
        'font-[family-name:var(--rad-native-select-font-family,var(--rad-typography-roles-ui-body-family,system-ui,sans-serif))] text-[length:var(--rad-native-select-font-size,var(--_rad-control-font-size))] font-[number:var(--rad-native-select-font-weight,var(--rad-typography-roles-ui-body-weight,400))] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)]',
        '[color:var(--rad-native-select-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] bg-[var(--rad-native-select-background,var(--rad-color-surface,white))]',
        'border-[length:var(--rad-native-select-border-width,var(--rad-control-border-width,1px))] [border-style:var(--rad-native-select-border-style,var(--rad-control-border-style,solid))] [border-color:var(--rad-native-select-border-color,var(--_rad-control-border))]',
        'rounded-[var(--rad-native-select-radius,var(--rad-control-radius,0.5rem))] [corner-shape:var(--rad-native-select-corner-shape,var(--rad-control-corner-shape,round))]',
        '[--_rad-native-select-shadow:var(--rad-native-select-shadow,none)] shadow-(--_rad-native-select-shadow)',
        'focus-visible:outline-solid focus-visible:[outline-color:var(--rad-native-select-focus-color,var(--rad-color-focus))] focus-visible:[outline-width:var(--rad-native-select-focus-width,var(--rad-focus-width,2px))] focus-visible:[outline-offset:var(--rad-native-select-focus-offset,var(--rad-focus-offset,2px))]',
        'data-invalid:[border-color:var(--rad-native-select-invalid-border,var(--rad-color-invalid))] disabled:cursor-not-allowed disabled:bg-[var(--rad-native-select-disabled-background,var(--rad-color-disabled-background))]',
        'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:disabled:text-[GrayText]',
        className
      )}
    />
  )
}
