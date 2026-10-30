'use client'
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Pressed action groups are not form fieldsets. */

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps
} from 'react'
import { Button, type ButtonProps } from './Button.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { isItemOpen, nextSelection, sameSelection, type Selection } from './internal/selection.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useControllableState } from './react/useControllableState.js'
import { CompositeFocusContext, useRovingFocus } from './react/useRovingFocus.js'
import { useTransitionHost } from './motion/host.js'
import type { ControlSize } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

type Name =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string }
type Owner<Value> =
  | { value: Value; defaultValue?: never }
  | { value?: undefined; defaultValue?: Value }
type PartStyle = { className?: string; style?: ThemeStyle }
export type ToggleGroupOrientation = 'horizontal' | 'vertical'
export type ToggleGroupAppearance = 'buttons' | 'segmented'
export type ToggleGroupValue = Selection
type Base = Omit<
  ComponentProps<'div'>,
  'style' | 'role' | 'defaultValue' | 'contentEditable' | 'dangerouslySetInnerHTML' | 'tabIndex'
> &
  Name & {
    style?: ThemeStyle
    orientation?: ToggleGroupOrientation
    loop?: boolean
    disabled?: boolean
    controlSize?: ControlSize
    motion?: 'inherit' | 'off'
    parts?: { indicator?: PartStyle }
    'data-slot'?: string
  }
export type ToggleGroupProps = Base &
  (
    | (Owner<string | null> & {
        type?: 'single'
        appearance?: ToggleGroupAppearance
        onValueChange?: (value: string | null) => void
      })
    | (Owner<string[]> & {
        type: 'multiple'
        appearance?: 'buttons'
        onValueChange?: (value: string[]) => void
      })
  )
export type ToggleGroupItemProps = Omit<
  ButtonProps,
  | 'pressed'
  | 'defaultPressed'
  | 'onPressedChange'
  | 'aria-pressed'
  | 'value'
  | 'type'
  | 'role'
  | 'tabIndex'
> & { value: string }
export type ToggleGroupState = {
  type: 'single' | 'multiple'
  value: ToggleGroupValue
  controlled: boolean
  disabled: boolean
  orientation: ToggleGroupOrientation
  loop: boolean
  controlSize: ControlSize
  appearance: ToggleGroupAppearance
  motion: 'inherit' | 'off'
  setItemPressed: (value: string, pressed: boolean) => void
}
const Context = createContext<ToggleGroupState | null>(null)
export function useToggleGroup(): ToggleGroupState | null {
  return useContext(Context)
}
function useOwner() {
  const state = useToggleGroup()
  if (!state) throw new Error('ToggleGroupItem must render inside ToggleGroup.')
  return state
}
const rootClass =
  'relative isolate inline-flex w-fit max-w-full flex-wrap gap-[var(--rad-toggle-group-gap,0.25rem)]'
const segmentedClass =
  'rounded-[var(--rad-toggle-group-radius,var(--rad-control-radius,0.5rem))] bg-[var(--rad-toggle-group-background,var(--rad-color-neutral,oklch(0.955_0.004_286)))] p-[var(--rad-toggle-group-padding,0.25rem)]'

export function ToggleGroup(allProps: ToggleGroupProps) {
  const {
    ref,
    type = 'single',
    value,
    defaultValue,
    onValueChange: _onValueChange,
    appearance = 'buttons',
    orientation = 'horizontal',
    loop = true,
    disabled = false,
    controlSize = 'medium',
    motion = 'inherit',
    parts,
    className,
    children,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
  } = allProps
  const [initialType] = useState(type)
  if (type !== initialType)
    throw new TypeError('ToggleGroup cannot change type during a mount. Remount with a new key.')
  if (!props['aria-label']?.trim() && !props['aria-labelledby']?.trim())
    throw new TypeError('ToggleGroup requires aria-label or aria-labelledby.')
  if (type === 'multiple' && appearance === 'segmented')
    throw new TypeError('The segmented indicator requires single selection.')
  const {
    value: current,
    request,
    controlled
  } = useControllableState<Selection>({
    name: 'ToggleGroup',
    value,
    defaultValue,
    initialValue: type === 'multiple' ? [] : null,
    equal: sameSelection,
    onChange: next => {
      if (allProps.type === 'multiple' && Array.isArray(next)) allProps.onValueChange?.(next)
      else if (allProps.type !== 'multiple' && !Array.isArray(next)) allProps.onValueChange?.(next)
    }
  })
  if (
    type === 'multiple'
      ? !Array.isArray(current) ||
        current.some(item => typeof item !== 'string') ||
        new Set(current).size !== current.length
      : current !== null && typeof current !== 'string'
  )
    throw new TypeError(
      'ToggleGroup values must match its single or multiple type and contain distinct strings.'
    )
  const host = useRef<HTMLDivElement>(null),
    hostRef = useComposedRefs(host, ref),
    parentOwnsFocus = useContext(CompositeFocusContext)
  const roving = useRovingFocus({
    host,
    selector: 'button[data-slot~="toggle-group-item"]',
    scope: '[data-slot~="toggle-group"]',
    preferred: Array.isArray(current) ? current[0] : current,
    orientation,
    loop,
    active: !parentOwnsFocus
  })
  const state: ToggleGroupState = {
    type,
    value: current,
    controlled,
    disabled,
    orientation,
    loop,
    controlSize,
    appearance,
    motion,
    setItemPressed(item, pressed) {
      if (!disabled) request(current => nextSelection(current, item, pressed))
    }
  }
  return (
    <Context.Provider value={state}>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- The group delegates roving keyboard navigation from its native button children. */}
      <div
        {...props}
        ref={hostRef}
        role="group"
        tabIndex={undefined}
        contentEditable={undefined}
        dangerouslySetInnerHTML={undefined}
        className={cn(
          rootClass,
          orientation === 'vertical' ? 'flex-col items-stretch' : 'items-center',
          appearance === 'segmented' && segmentedClass,
          className
        )}
        data-slot={joinIds('toggle-group', props['data-slot'])}
        data-type={type}
        data-appearance={appearance}
        data-orientation={orientation}
        data-control-size={controlSize}
        data-disabled={disabled ? '' : undefined}
        onFocus={event => {
          onFocus?.(event)
          roving.onFocus(event)
        }}
        onBlur={event => {
          onBlur?.(event)
          roving.onBlur(event)
        }}
        onKeyDown={event => {
          onKeyDown?.(event)
          roving.onKeyDown(event)
        }}
      >
        {appearance === 'segmented' ? (
          <Indicator
            value={current}
            motion={motion}
            part={parts?.indicator}
          />
        ) : null}
        {children}
      </div>
    </Context.Provider>
  )
}
export function ToggleGroupItem({
  value,
  disabled = false,
  controlSize,
  variant = 'outline',
  tone = 'neutral',
  className,
  ...props
}: ToggleGroupItemProps) {
  const group = useOwner()
  if (typeof value !== 'string') throw new TypeError('ToggleGroupItem requires a string value.')
  const pressed = isItemOpen(group.value, value),
    unavailable = disabled || group.disabled
  return (
    <Button
      {...props}
      type="button"
      role="button"
      value={value}
      tabIndex={0}
      disabled={unavailable}
      pressed={pressed}
      defaultPressed={undefined}
      aria-pressed={undefined}
      onPressedChange={next => group.setItemPressed(value, next)}
      controlSize={controlSize ?? group.controlSize}
      variant={group.appearance === 'segmented' ? 'ghost' : variant}
      tone={tone}
      motion={group.motion === 'off' ? 'off' : props.motion}
      data-slot={joinIds('toggle-group-item', props['data-slot'])}
      data-value={value}
      data-state={pressed ? 'on' : 'off'}
      data-disabled={unavailable ? '' : undefined}
      className={cn(
        'relative z-10',
        group.appearance === 'segmented' &&
          'bg-transparent hover:bg-transparent active:bg-transparent disabled:bg-transparent aria-busy:bg-transparent [background-image:none] shadow-none inset-shadow-none [border-color:transparent]',
        className
      )}
    />
  )
}
function Indicator({
  value,
  motion,
  part
}: {
  value: Selection
  motion: 'inherit' | 'off'
  part?: PartStyle
}) {
  const node = useRef<HTMLSpanElement>(null),
    { ref: indicatorRef } = useTransitionHost('indicator', node, motion === 'off')
  useLayoutEffect(() => {
    const mark = node.current,
      root = mark?.closest<HTMLDivElement>('[data-slot~="toggle-group"]')
    if (!root || !mark) return
    const view = root.ownerDocument.defaultView!
    const items = () =>
      Array.from(
        root.querySelectorAll<HTMLButtonElement>('button[data-slot~="toggle-group-item"]')
      ).filter(item => item.closest('[data-slot~="toggle-group"]') === root)
    const measure = () => {
      const selected = items().find(
        item => item.getAttribute('aria-pressed') === 'true' && item.getClientRects().length > 0
      )
      mark.hidden = !selected
      if (!selected) {
        mark.removeAttribute('data-rad-indicator-target')
        return
      }
      const target = [
        selected.offsetLeft,
        selected.offsetTop,
        selected.offsetWidth,
        selected.offsetHeight
      ]
      for (const [index, axis] of ['x', 'y', 'width', 'height'].entries())
        mark.style.setProperty(`--_rad-indicator-target-${axis}`, `${target[index]}px`)
      const serialized = JSON.stringify(target)
      if (mark.getAttribute('data-rad-indicator-target') !== serialized)
        mark.setAttribute('data-rad-indicator-target', serialized)
    }
    let frame = 0
    const schedule = () => {
      if (!frame)
        frame = view.requestAnimationFrame(() => {
          frame = 0
          measure()
        })
    }
    const resize = new view.ResizeObserver(schedule)
    const observe = () => {
      resize.disconnect()
      resize.observe(root)
      items().forEach(item => resize.observe(item))
    }
    const changes = new view.MutationObserver(records => {
      if (records.some(record => record.target !== mark && !mark.contains(record.target))) {
        observe()
        schedule()
      }
    })
    changes.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-pressed', 'class', 'style', 'hidden', 'dir']
    })
    observe()
    measure()
    view.addEventListener('resize', schedule)
    root.ownerDocument.fonts?.addEventListener('loadingdone', schedule)
    return () => {
      changes.disconnect()
      resize.disconnect()
      view.cancelAnimationFrame(frame)
      view.removeEventListener('resize', schedule)
      root.ownerDocument.fonts?.removeEventListener('loadingdone', schedule)
    }
  }, [value])
  return (
    <span
      ref={indicatorRef}
      aria-hidden="true"
      data-rad-indicator=""
      hidden={value === null}
      className="pointer-events-none absolute top-0 left-0 z-0 [translate:var(--_rad-indicator-x,var(--_rad-indicator-target-x,0px))_var(--_rad-indicator-y,var(--_rad-indicator-target-y,0px))] [width:var(--_rad-indicator-width,var(--_rad-indicator-target-width,0px))] [height:var(--_rad-indicator-height,var(--_rad-indicator-target-height,0px))]"
    >
      <span
        data-slot="toggle-group-indicator"
        className={cn(
          'block size-full rounded-[var(--rad-toggle-group-indicator-radius,var(--rad-control-radius,0.5rem))] bg-[var(--rad-toggle-group-indicator-color,var(--rad-color-surface,white))] [box-shadow:var(--rad-toggle-group-indicator-shadow,var(--rad-surface-shadow,0_1px_3px_#0002))] forced-colors:bg-[Canvas] forced-colors:[outline:1px_solid_Highlight]',
          part?.className
        )}
        style={part?.style}
      />
    </span>
  )
}
