'use client'

import { useCallback, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { useSwitchDrag } from './react/useSwitchDrag.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useNativeOwner, type CheckedOwner } from './react/useNativeOwner.js'
import { controlBorderClass, controlMetrics } from './controlStyles.js'
import { useFieldControl } from './Field.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import type { ControlSize, ControlParts } from './presentation.js'

const switchVariants = cva([
  controlBorderClass,
  'peer col-start-1 row-start-1 m-0 box-border appearance-none touch-pan-y select-none cursor-default',
  '[--_rad-switch-height:var(--rad-switch-height,calc(var(--_rad-control-indicator-size)*1.25))]',
  'h-[var(--_rad-switch-height)]',
  'w-[var(--rad-switch-width,calc(var(--_rad-control-indicator-size)*2.25))]',
  'rounded-[min(var(--rad-switch-radius,var(--rad-control-radius,0.5rem)),calc(var(--_rad-switch-height)/2))]',
  '[corner-shape:var(--rad-switch-corner-shape,var(--rad-control-corner-shape,round))]',
  '[border-width:var(--rad-switch-border-width,var(--rad-control-border-width,1px))]',
  '[border-style:var(--rad-switch-border-style,var(--rad-control-border-style,solid))]',
  '[border-color:var(--rad-switch-border-color,var(--_rad-control-border))]',
  'bg-[var(--rad-switch-background,var(--rad-color-surface,oklch(1_0_0)))]',
  'checked:bg-[var(--rad-switch-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286)))]',
  'checked:[border-color:var(--rad-switch-checked-border,var(--rad-switch-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286))))]',
  '[box-shadow:var(--rad-control-indicator-shadow,none)]',
  'checked:[box-shadow:var(--rad-control-indicator-checked-shadow,none)]',
  'data-invalid:[border-color:var(--rad-switch-invalid-border,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--rad-switch-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'focus-visible:[outline-width:var(--rad-switch-focus-width,var(--rad-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--rad-switch-focus-offset,var(--rad-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--rad-switch-focus-style,var(--rad-focus-style,solid))]',
  'disabled:cursor-not-allowed',
  'disabled:[border-color:var(--rad-switch-disabled-border,var(--rad-color-disabled-border,oklch(0.88_0.005_286)))]',
  'disabled:bg-[var(--rad-switch-disabled-background,var(--rad-color-disabled-background,oklch(0.96_0.005_286)))]',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]',
  'forced-colors:checked:bg-[Highlight]',
  'forced-colors:disabled:border-[GrayText] forced-colors:disabled:bg-[Canvas]'
])

// The thumb sits 3px inside the track: its corner is the track corner minus 3px, capped at half its own size.
const thumbClass =
  'block size-full shrink-0 forced-colors:[forced-color-adjust:none] rounded-[var(--rad-switch-thumb-radius,max(0px,min(calc(var(--rad-switch-radius,var(--rad-control-radius,0.5rem))-3px),50%)))] [corner-shape:var(--rad-switch-corner-shape,var(--rad-control-corner-shape,round))] [box-shadow:var(--rad-control-indicator-thumb-shadow,none)] bg-current forced-colors:[box-shadow:none]'
const indicatorClass =
  'pointer-events-none absolute inset-[3px] flex justify-start peer-checked:justify-end [color:var(--rad-switch-thumb,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))] peer-checked:[color:var(--rad-switch-checked-thumb,var(--rad-color-accent-foreground,oklch(0.985_0_0)))] peer-disabled:[color:var(--rad-switch-disabled-thumb,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))] forced-colors:text-[CanvasText] forced-colors:peer-checked:text-[HighlightText] forced-colors:peer-disabled:text-[GrayText]'

const rowClass =
  'inline-flex min-h-6 min-w-0 max-w-full cursor-default items-center gap-[var(--rad-switch-gap,var(--rad-spacing-label-gap,0.5rem))] select-none has-disabled:cursor-not-allowed'
const labelClass =
  'min-w-0 break-words font-[family-name:var(--rad-typography-roles-ui-label-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-label-letter-spacing,-0.011em)] font-[number:var(--rad-typography-roles-ui-label-weight,400)] [color:var(--rad-switch-label-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] text-[length:var(--rad-switch-label-size,var(--_rad-control-font-size))] leading-[var(--rad-typography-roles-ui-label-line-height,1.4)]'

export type SwitchProps = Omit<
  ComponentProps<'input'>,
  'type' | 'role' | 'aria-checked' | 'checked' | 'defaultChecked' | 'readOnly' | 'style'
> &
  CheckedOwner & {
    /** Stable setting name. Omit when Field supplies the label. */
    label?: ReactNode
    controlSize?: ControlSize
    /** Native input styles. Parts style the wrapper, label and decorative thumb. */
    style?: ThemeStyle
    parts?: ControlParts
  }

/** Native on/off setting. Read checked for state and value for submitted data. */
export function Switch({
  className,
  controlSize = 'medium',
  parts,
  label,
  id,
  disabled,
  required,
  checked,
  defaultChecked,
  ref,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  ...props
}: SwitchProps) {
  const controlled = useNativeOwner('Switch', checked, defaultChecked)
  const labelled = label != null && label !== false && label !== ''
  const control = useFieldControl({
    id,
    disabled,
    required,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired
  })
  const nodeRef = useRef<HTMLInputElement>(null)
  const railRef = useRef<HTMLSpanElement>(null)
  const handleRef = useRef<HTMLSpanElement>(null)
  const drag = useSwitchDrag(nodeRef, railRef, handleRef)
  const initialise = useCallback(
    (node: HTMLInputElement | null) => {
      nodeRef.current = node
      if (node && controlled) node.defaultChecked = node.checked
    },
    [controlled]
  )
  const hostRef = useComposedRefs(initialise, ref)
  useLayoutEffect(() => {
    if (nodeRef.current && controlled) nodeRef.current.defaultChecked = !!checked
  })
  const controlNode = (
    <span
      className={cn('relative inline-grid w-fit shrink-0', !labelled && parts?.wrapper?.className)}
      style={!labelled ? parts?.wrapper?.style : undefined}
      data-slot={!labelled ? 'switch-wrapper' : undefined}
    >
      <input
        {...props}
        {...control}
        onPointerDown={event => {
          props.onPointerDown?.(event)
          drag.start(event.nativeEvent)
        }}
        onKeyDown={event => {
          props.onKeyDown?.(event)
          if (drag.escape(event.nativeEvent)) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        checked={checked}
        defaultChecked={defaultChecked}
        ref={hostRef}
        className={cn(switchVariants(), controlMetrics({ controlSize }), className)}
        data-control-size={controlSize}
        data-slot="switch"
        data-dragging={undefined}
        type="checkbox"
        role="switch"
        aria-checked={undefined}
      />
      <span
        aria-hidden="true"
        ref={railRef}
        dir={props.dir}
        style={{ direction: props.style?.direction }}
        className={indicatorClass}
      >
        <span
          ref={handleRef}
          className="h-full w-auto shrink-0 aspect-square"
        >
          <span
            className={cn(thumbClass, parts?.indicator?.className)}
            style={parts?.indicator?.style}
            data-slot="switch-indicator"
          />
        </span>
      </span>
    </span>
  )
  if (!labelled) return controlNode
  return (
    <label
      className={cn(rowClass, parts?.wrapper?.className)}
      style={parts?.wrapper?.style}
      data-slot="switch-wrapper"
    >
      {controlNode}
      <span
        className={cn(labelClass, controlMetrics({ controlSize }), parts?.label?.className)}
        style={parts?.label?.style}
        data-slot="switch-label"
      >
        {label}
      </span>
    </label>
  )
}
