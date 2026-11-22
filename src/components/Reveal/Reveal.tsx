'use client'

import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ControlSize, PartStyle, Spacing } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { Button } from '../Button/Button.js'
import { pickLayoutClass, spacingGapClasses } from '../shared/layoutStyles.js'

export type RevealItem = { value: string; children: ReactNode }

/**
 * Div host that shows one of `items` at a time with previous and next buttons. Hidden steps
 * stay mounted, so their state survives, and the position text is announced on each change.
 */
export type RevealProps = Omit<ComponentProps<'div'>, 'style' | 'children' | 'defaultValue'> &
  ValueOwner<string> & {
    items: readonly RevealItem[]
    onValueChange?: (value: string) => void
    /** Text of the button that shows the previous step. */
    previousLabel: string
    /** Text of the button that shows the next step. */
    nextLabel: string
    /** Visible, announced position text, such as `Step 2 of 4`, for a zero-based index. */
    positionLabel: (index: number, count: number) => string
    /** Space between the step and its controls from the theme spacing scale. */
    gap?: Spacing
    controlSize?: ControlSize
    parts?: { controls?: PartStyle; position?: PartStyle }
    style?: ThemeStyle
    'data-slot'?: string
  }

/** Content shown one step at a time, moved through with previous and next buttons. */
export function Reveal({
  items,
  value,
  defaultValue,
  onValueChange,
  previousLabel,
  nextLabel,
  positionLabel,
  gap = 'normal',
  controlSize = 'medium',
  parts,
  className,
  ...props
}: RevealProps) {
  if (!previousLabel?.trim() || !nextLabel?.trim())
    throw new TypeError('Reveal requires nonempty previousLabel and nextLabel.')
  if (typeof positionLabel !== 'function')
    throw new TypeError('Reveal requires a positionLabel function.')
  const keys = items.map(item => item.value)
  if (!keys.length || keys.some(key => !key.trim()) || new Set(keys).size !== keys.length)
    throw new TypeError('Reveal items need unique nonempty values.')
  const owner = useControllableState({
    name: 'Reveal value',
    value,
    defaultValue,
    initialValue: keys[0]!,
    onChange: onValueChange
  })
  const index = keys.indexOf(owner.value)
  if (index < 0) throw new TypeError('Reveal value must match an item.')
  const stepsId = useId()
  const previous = useRef<HTMLButtonElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  // When a button disables itself at either end, focus moves to the other one.
  const refocus = useRef<'previous' | 'next' | null>(null)
  useEffect(() => {
    const target = refocus.current === 'previous' ? previous : next
    if (refocus.current && target.current && !target.current.disabled) target.current.focus()
    refocus.current = null
  }, [index])
  const go = (direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= keys.length) return
    if (target === 0) refocus.current = 'next'
    else if (target === keys.length - 1) refocus.current = 'previous'
    owner.request(keys[target]!)
  }
  return (
    <div
      {...props}
      data-slot={joinIds('reveal', props['data-slot'])}
      className={cn(
        'box-border grid min-w-0',
        pickLayoutClass('Reveal', spacingGapClasses, 'gap', gap),
        className
      )}
    >
      <div
        id={stepsId}
        data-slot="reveal-steps"
        className="grid min-w-0"
      >
        {items.map((item, itemIndex) => (
          <div
            key={item.value}
            data-slot="reveal-step"
            data-selected={itemIndex === index ? '' : undefined}
            hidden={itemIndex !== index}
            className="min-w-0"
          >
            {item.children}
          </div>
        ))}
      </div>
      <div
        data-slot="reveal-controls"
        className={cn(
          'flex min-w-0 flex-wrap items-center justify-between gap-[var(--rad-spacing-tight,0.5rem)]',
          parts?.controls?.className
        )}
        style={parts?.controls?.style}
      >
        <Button
          ref={previous}
          variant="outline"
          controlSize={controlSize}
          data-slot="reveal-previous"
          aria-controls={stepsId}
          disabled={index === 0}
          onClick={() => go(-1)}
        >
          {previousLabel}
        </Button>
        <output
          data-slot="reveal-position"
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            '[color:var(--rad-color-muted-foreground,oklch(0.45_0.01_286))] tabular-nums',
            parts?.position?.className
          )}
          style={parts?.position?.style}
        >
          {positionLabel(index, keys.length)}
        </output>
        <Button
          ref={next}
          controlSize={controlSize}
          data-slot="reveal-next"
          aria-controls={stepsId}
          disabled={index === keys.length - 1}
          onClick={() => go(1)}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
