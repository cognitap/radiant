'use client'

import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { PartStyle } from '../../presentation.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useFormReset } from '../../react/useFormReset.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import { Field } from '../Field/Field.js'
import { Radio, RadioGroup, type RadioGroupProps } from '../RadioGroup/RadioGroup.js'
import { controlMetrics } from '../shared/controlStyles.js'
import { focusWithinRingClass } from '../shared/focusStyles.js'

export type RatingProps = Omit<
  RadioGroupProps,
  'children' | 'value' | 'defaultValue' | 'onValueChange' | 'onChange' | 'parts'
> &
  ValueOwner<number | null> & {
    max?: number
    readOnly?: boolean
    onValueChange?: (value: number) => void
    /** Rating marks are decorative. Supply both states for a custom mark. */
    icon?: { filled: ReactNode; empty: ReactNode }
    formatValue?: (value: number, max: number) => string
    parts?: RadioGroupProps['parts'] & { item?: PartStyle; icon?: PartStyle }
  }

const formatRating = (value: number, max: number) => `${value} out of ${max}`

// WebKit and Chromium disagree about native horizontal radio keys in RTL.
function navigateRtl(event: KeyboardEvent<HTMLInputElement>) {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
  )
    return
  const input = event.currentTarget
  if (input.ownerDocument.defaultView?.getComputedStyle(input).direction !== 'rtl') return
  const group = input.closest('[data-slot~="rating"]')
  const options = Array.from(
    group?.querySelectorAll<HTMLInputElement>('[data-slot~="rating-option"]:enabled') ?? []
  )
  const index = options.indexOf(input)
  if (index < 0) return
  event.preventDefault()
  const step = event.key === 'ArrowLeft' ? 1 : -1
  const next = options[(index + step + options.length) % options.length]
  next.focus()
  next.click()
}

function RatingMark({
  filled,
  icon,
  part
}: {
  filled: boolean
  icon: RatingProps['icon']
  part: PartStyle | undefined
}) {
  return (
    <span
      aria-hidden="true"
      data-slot="rating-icon"
      data-filled={filled ? '' : undefined}
      className={cn(
        'pointer-events-none grid size-[var(--_rad-control-height)] place-items-center text-[length:calc(var(--_rad-control-height)*0.69)] leading-none [&_svg]:size-[65%]',
        filled
          ? '[color:var(--rad-rating-filled,var(--rad-color-accent))] forced-colors:text-[Highlight]'
          : '[color:var(--rad-rating-empty,var(--rad-color-muted-foreground))] forced-colors:text-[CanvasText]',
        part?.className
      )}
      style={part?.style}
    >
      {filled ? (icon?.filled ?? '★') : (icon?.empty ?? '☆')}
    </span>
  )
}

export function Rating({
  max = 5,
  value,
  defaultValue,
  onValueChange,
  readOnly = false,
  icon,
  formatValue = formatRating,
  controlSize = 'medium',
  parts,
  ref,
  'data-slot': slot,
  ...props
}: RatingProps) {
  const selection = useControllableState<number | null>({
    name: 'Rating value',
    value,
    defaultValue,
    initialValue: null,
    onChange: next => {
      if (next !== null) onValueChange?.(next)
    }
  })
  const host = useRef<HTMLFieldSetElement>(null)
  const hostRef = useComposedRefs(ref, host)
  useFormReset(host, selection.reset)
  if (!Number.isInteger(max) || max < 1)
    throw new RangeError('Rating max must be a positive integer.')
  if (
    selection.value !== null &&
    (!Number.isInteger(selection.value) || selection.value < 1 || selection.value > max)
  ) {
    throw new RangeError('Rating value must be null or a whole number within the rating scale.')
  }
  const marks = Array.from({ length: max }, (_, index) => index + 1)
  const { options, item, icon: iconPart, ...fieldParts } = parts ?? {}
  const slotName = joinIds('rating', slot)

  if (readOnly) {
    return (
      <Field
        {...props}
        ref={hostRef}
        layout="group"
        data-slot={slotName}
        parts={fieldParts}
        data-readonly=""
      >
        <span
          className={cn(
            'flex flex-wrap items-center',
            controlMetrics({ controlSize }),
            options?.className
          )}
          style={options?.style}
          data-slot="rating-value"
        >
          <span className="sr-only">{formatValue(selection.value ?? 0, max)}</span>
          {marks.map(mark => (
            <RatingMark
              key={mark}
              filled={mark <= (selection.value ?? 0)}
              icon={icon}
              part={iconPart}
            />
          ))}
        </span>
      </Field>
    )
  }

  return (
    <RadioGroup
      {...props}
      ref={hostRef}
      data-slot={slotName}
      controlSize={controlSize}
      value={selection.value === null ? null : String(selection.value)}
      onValueChange={key => selection.request(Number(key))}
      parts={{
        ...fieldParts,
        options: {
          ...options,
          className: cn('flex flex-wrap items-center gap-0.5', options?.className)
        }
      }}
    >
      {marks.map(mark => (
        <Radio
          key={mark}
          data-slot="rating-option"
          value={String(mark)}
          aria-label={formatValue(mark, max)}
          onKeyDown={navigateRtl}
          className="sr-only"
          label={
            <RatingMark
              filled={mark <= (selection.value ?? 0)}
              icon={icon}
              part={iconPart}
            />
          }
          parts={{
            wrapper: {
              ...item,
              className: cn(
                'relative rounded-[var(--rad-control-radius,0.5rem)] gap-0',
                focusWithinRingClass,
                item?.className
              )
            },
            indicator: { className: 'hidden' }
          }}
        />
      ))}
    </RadioGroup>
  )
}
