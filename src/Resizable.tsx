'use client'

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  useCallback,
  type ComponentProps
} from 'react'
import { SeparatorRoot, type SeparatorProps } from './Separator.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { requireAccessibleName, type AccessibleName } from './internal/accessibleName.js'
import {
  checkResizableItems,
  checkResizableValue,
  resizableIndex,
  resizableNeighbor,
  resizableRanges,
  resizePanel,
  sameResizableValue,
  type ResizableItem
} from './internal/resizable.js'
import { addDecimal } from './internal/decimal.js'
import { useControllableState } from './react/useControllableState.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import type { ValueOwner } from './react/useNativeOwner.js'
import type { Orientation } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'
export type { ResizableItem } from './internal/resizable.js'

type LayoutOwner = ValueOwner<number[]> & ({ value: number[] } | { defaultValue: number[] })
export type ResizableProps = Omit<
  ComponentProps<'div'>,
  'value' | 'defaultValue' | 'onChange' | 'style'
> &
  LayoutOwner & {
    items: readonly ResizableItem[]
    onValueChange?: (value: number[]) => void
    orientation?: Orientation
    disabled?: boolean
    style?: ThemeStyle
    'data-slot'?: string
  }
export type ResizablePanelState = {
  id: string
  size: number
  min: number
  max: number
  collapsed: boolean
  canCollapse: boolean
  canExpand: boolean
}
export type ResizableState = {
  value: number[]
  controlled: boolean
  orientation: Orientation
  disabled: boolean
  setValue: (value: number[]) => void
  resize: (panel: string, size: number) => void
  resizeBy: (panel: string, amount: number) => void
  toggle: (panel: string) => void
  getPanel: (panel: string) => ResizablePanelState
}
type Binding = {
  state: ResizableState
  items: readonly ResizableItem[]
  id: string
  dragging: string | null
  registerPanel: (value: string, node: HTMLDivElement | null) => void
  registerHandle: (value: string, node: HTMLHRElement | null) => void
  focusHandle: (value: string) => void
  begin: (value: string) => symbol | null
  finish: (token: symbol) => void
  room: () => number
  direction: () => string
  pointerResize: (value: string, size: number, sum: number) => void
}
const Context = createContext<Binding | null>(null)
export function useResizable(): ResizableState | null {
  return useContext(Context)?.state ?? null
}
function useBinding() {
  const binding = useContext(Context)
  if (!binding) throw new Error('Resizable parts must render inside Resizable.')
  return binding
}
export function Resizable({
  items,
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  disabled = false,
  className,
  style,
  ref,
  ...props
}: ResizableProps) {
  checkResizableItems(items)
  if (value === undefined && defaultValue === undefined)
    throw new TypeError('Resizable requires value or defaultValue.')
  const selection = useControllableState({
    name: 'Resizable',
    value,
    defaultValue,
    initialValue: [],
    onChange: (value: number[]) => onValueChange?.([...value]),
    equal: sameResizableValue
  })
  checkResizableValue(items, selection.value)
  const id = useId(),
    root = useRef<HTMLDivElement>(null),
    panels = useRef(new Map<string, HTMLDivElement>()),
    handles = useRef(new Map<string, HTMLHRElement>()),
    history = useRef(new Map<string, number>()),
    gesture = useRef<symbol | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const composed = useComposedRefs(root, ref)
  const registerPanel = useCallback((value: string, node: HTMLDivElement | null) => {
    if (node) panels.current.set(value, node)
    else panels.current.delete(value)
  }, [])
  const registerHandle = useCallback((value: string, node: HTMLHRElement | null) => {
    if (node) handles.current.set(value, node)
    else handles.current.delete(value)
  }, [])
  useLayoutEffect(() => {
    items.forEach((item, index) => {
      if (selection.value[index]! > 0) history.current.set(item.value, selection.value[index]!)
    })
    const node = root.current
    if (!node) return
    const sequence = Array.from(node.children).filter(child =>
      child.matches('[data-slot~="resizable-panel"],[data-slot~="resizable-handle"]')
    )
    if (!sequence.length) return
    if (
      sequence.length !== items.length * 2 - 1 ||
      sequence.some(
        (child, index) =>
          child.getAttribute('data-panel') !== items[Math.floor(index / 2)]?.value ||
          !child.matches(
            index % 2 ? '[data-slot~="resizable-handle"]' : '[data-slot~="resizable-panel"]'
          )
      )
    )
      throw new Error('Render Resizable panels and handles directly in items order.')
  })
  const request = (update: (value: number[]) => number[]) => {
    if (disabled) return
    selection.request(previous => {
      const next = update(previous)
      checkResizableValue(items, next)
      return next
    })
  }
  const resize = (panel: string, size: number) =>
    request(previous => resizePanel(items, previous, resizableIndex(items, panel), size))
  const resizeBy = (panel: string, amount: number) => {
    if (!Number.isFinite(amount)) throw new TypeError('Resizable increments must be finite.')
    request(previous => {
      const index = resizableIndex(items, panel)
      return resizePanel(items, previous, index, addDecimal(previous[index]!, amount))
    })
  }
  const toggle = (panel: string) =>
    request(previous => {
      const index = resizableIndex(items, panel)
      if (!items[index]!.collapsible) return previous
      const size = previous[index]!
      if (size > 0) {
        if (!resizableRanges(items, previous, index).some(range => range[0] === 0)) return previous
        history.current.set(panel, size)
        return resizePanel(items, previous, index, 0)
      }
      const neighbor = resizableNeighbor(items, index)
      return resizePanel(
        items,
        previous,
        index,
        history.current.get(panel) ?? addDecimal(previous[index]!, previous[neighbor]!) / 2
      )
    })
  const getPanel = (panel: string): ResizablePanelState => {
    const index = resizableIndex(items, panel),
      ranges = resizableRanges(items, selection.value, index),
      size = selection.value[index]!,
      min = ranges[0]?.[0] ?? size,
      max = ranges.at(-1)?.[1] ?? size
    return {
      id: id + '-panel-' + encodeURIComponent(panel),
      size,
      min,
      max,
      collapsed: size === 0,
      canCollapse: !!items[index]!.collapsible && min === 0 && size > 0,
      canExpand: !!items[index]!.collapsible && max > 0 && size === 0
    }
  }
  const state: ResizableState = {
    value: selection.value,
    controlled: selection.controlled,
    orientation,
    disabled,
    setValue: value => request(() => [...value]),
    resize,
    resizeBy,
    toggle,
    getPanel
  }
  const beginGesture = useCallback(
    (panel: string) => {
      if (disabled || gesture.current) return null
      const token = Symbol()
      gesture.current = token
      setDragging(panel)
      return token
    },
    [disabled]
  )
  const finishGesture = useCallback((token: symbol) => {
    if (gesture.current !== token) return
    gesture.current = null
    setDragging(null)
  }, [])
  const binding: Binding = {
    state,
    items,
    id,
    dragging,
    registerPanel,
    registerHandle,
    focusHandle(panel) {
      const index = resizableIndex(items, panel)
      handles.current
        .get(items[Math.min(index, items.length - 2)]!.value)
        ?.focus({ preventScroll: true })
    },
    begin: beginGesture,
    finish: finishGesture,
    direction() {
      const node = root.current
      return node?.ownerDocument.defaultView?.getComputedStyle(node).direction ?? 'ltr'
    },
    room() {
      let room = 0
      for (const panel of panels.current.values()) {
        const rect = panel.getBoundingClientRect(),
          view = panel.ownerDocument.defaultView
        if (!view) continue
        const css = view.getComputedStyle(panel),
          horizontal = orientation === 'horizontal',
          length = horizontal ? rect.width : rect.height,
          outer = horizontal ? panel.offsetWidth : panel.offsetHeight
        const scale = outer ? length / outer : 1
        const edges =
          (horizontal
            ? [css.paddingLeft, css.paddingRight, css.borderLeftWidth, css.borderRightWidth]
            : [css.paddingTop, css.paddingBottom, css.borderTopWidth, css.borderBottomWidth]
          ).reduce((sum, edge) => sum + (parseFloat(edge) || 0), 0) * scale
        room += Math.max(0, length - edges)
      }
      return room
    },
    pointerResize(panel, size, sum) {
      request(previous => {
        const index = resizableIndex(items, panel),
          neighbor = resizableNeighbor(items, index)
        return Math.abs(addDecimal(previous[index]!, previous[neighbor]!) - sum) > 1e-7
          ? previous
          : resizePanel(items, previous, index, size, false)
      })
    }
  }
  return (
    <Context.Provider value={binding}>
      <div
        {...props}
        ref={composed}
        data-slot={joinIds('resizable', props['data-slot'])}
        data-orientation={orientation}
        data-disabled={disabled ? '' : undefined}
        data-dragging={dragging ? '' : undefined}
        className={cn(
          'flex min-h-0 min-w-0 data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col data-dragging:select-none',
          className
        )}
        style={style}
      />
    </Context.Provider>
  )
}
export type ResizablePanelProps = Omit<
  ComponentProps<'div'>,
  'id' | 'hidden' | 'inert' | 'style'
> & { value: string; style?: ThemeStyle; 'data-slot'?: string }
export function ResizablePanel({
  value,
  ref,
  className,
  style,
  onFocusCapture,
  onBlurCapture,
  ...props
}: ResizablePanelProps) {
  const context = useBinding(),
    index = resizableIndex(context.items, value),
    size = context.state.value[index]!,
    collapsed = size === 0
  const node = useRef<HTMLDivElement>(null),
    hadFocus = useRef(false)
  const registerPanel = context.registerPanel
  const register = useCallback(
    (element: HTMLDivElement | null) => {
      node.current = element
      registerPanel(value, element)
    },
    [registerPanel, value]
  )
  const composed = useComposedRefs(register, ref)
  useLayoutEffect(() => {
    const panel = node.current
    if (!collapsed || !panel) return
    const active = panel.ownerDocument.activeElement
    if (hadFocus.current && (panel.contains(active) || active === panel.ownerDocument.body))
      context.focusHandle(value)
    hadFocus.current = false
  })
  const panelStyle: ThemeStyle = { '--_rad-resizable-size': size, ...style }
  return (
    <div
      {...props}
      ref={composed}
      id={context.id + '-panel-' + encodeURIComponent(value)}
      hidden={collapsed}
      inert={collapsed || undefined}
      data-slot={joinIds('resizable-panel', props['data-slot'])}
      data-panel={value}
      data-size={size}
      data-collapsed={collapsed ? '' : undefined}
      className={cn(
        'box-border min-h-0 min-w-0 basis-0 shrink grow-(--_rad-resizable-size) overflow-hidden',
        className
      )}
      style={panelStyle}
      onFocusCapture={event => {
        onFocusCapture?.(event)
        hadFocus.current = true
      }}
      onBlurCapture={event => {
        onBlurCapture?.(event)
        if (
          !event.currentTarget.contains(event.relatedTarget) &&
          (!collapsed || event.relatedTarget !== null)
        )
          hadFocus.current = false
      }}
    />
  )
}
export type ResizableHandleProps = Omit<
  SeparatorProps,
  | 'orientation'
  | 'decorative'
  | 'aria-controls'
  | 'aria-disabled'
  | 'aria-valuenow'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuetext'
> &
  AccessibleName & {
    value: string
    step?: number
    largeStep?: number
  }
type Drag = {
  node: HTMLHRElement
  pointer: number
  token: symbol
  start: number
  size: number
  room: number
  sum: number
  orientation: Orientation
  direction: string
  cleanup: () => void
}
export function ResizableHandle({
  value,
  step = 1,
  largeStep = step * 10,
  className,
  ref,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onBlur,
  ...props
}: ResizableHandleProps) {
  const context = useBinding(),
    index = resizableIndex(context.items, value)
  if (index === context.items.length - 1)
    throw new TypeError('Resizable handles follow every panel except the last.')
  requireAccessibleName('ResizableHandle', props)
  if (!Number.isFinite(step) || step <= 0 || !Number.isFinite(largeStep) || largeStep <= 0)
    throw new TypeError('Resizable handle steps must be finite and positive.')
  const ranges = resizableRanges(context.items, context.state.value, index),
    min = ranges[0]?.[0] ?? context.state.value[index]!,
    max = ranges.at(-1)?.[1] ?? min
  const disabled = context.state.disabled || min === max,
    drag = useRef<Drag | null>(null)
  const registerHandle = context.registerHandle,
    finishGesture = context.finish
  const register = useCallback(
    (node: HTMLHRElement | null) => registerHandle(value, node),
    [registerHandle, value]
  )
  const composed = useComposedRefs(register, ref)
  const finish = useCallback(() => {
    const current = drag.current
    if (!current) return
    drag.current = null
    current.cleanup()
    try {
      if (current.node.hasPointerCapture(current.pointer))
        current.node.releasePointerCapture(current.pointer)
    } catch {}
    finishGesture(current.token)
  }, [finishGesture])
  useEffect(() => () => finish(), [finish])
  useLayoutEffect(() => {
    if (disabled || (drag.current && drag.current.orientation !== context.state.orientation))
      finish()
  })
  return (
    <SeparatorRoot
      {...props}
      interactive
      tabIndex={disabled ? -1 : 0}
      decorative={false}
      ref={composed}
      orientation={context.state.orientation === 'horizontal' ? 'vertical' : 'horizontal'}
      aria-controls={context.id + '-panel-' + encodeURIComponent(value)}
      aria-disabled={disabled || undefined}
      aria-valuenow={context.state.value[index]}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={Number(context.state.value[index]!.toFixed(4)) + '%'}
      data-slot={joinIds('resizable-handle', props['data-slot'])}
      data-panel={value}
      data-dragging={context.dragging === value ? '' : undefined}
      className={cn(
        'touch-none select-none m-0 bg-[var(--rad-resizable-handle-background,transparent)] [border-color:var(--rad-resizable-handle-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
        'hover:bg-[var(--rad-resizable-handle-hover-background,var(--rad-control-track-background,var(--rad-color-neutral,oklch(0.955_0.004_286))))] data-dragging:bg-[var(--rad-resizable-handle-active-background,var(--rad-control-track-background,var(--rad-color-neutral,oklch(0.955_0.004_286))))]',
        'not-aria-disabled:hover:[box-shadow:var(--rad-control-track-shadow,none)] data-dragging:[box-shadow:var(--rad-control-track-shadow,none)]',
        'focus-visible:outline-solid focus-visible:outline-[color:var(--rad-resizable-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))] focus-visible:outline-[length:var(--rad-resizable-focus-width,var(--rad-focus-width,2px))] focus-visible:outline-offset-[var(--rad-resizable-focus-offset,-2px)]',
        'aria-disabled:cursor-not-allowed aria-disabled:bg-[var(--rad-resizable-handle-background,transparent)] forced-colors:border-[CanvasText] forced-colors:focus-visible:outline-[Highlight]',
        context.state.orientation === 'horizontal'
          ? 'h-auto w-[length:var(--rad-resizable-handle-size,0.5rem)] cursor-col-resize'
          : 'w-auto h-[length:var(--rad-resizable-handle-size,0.5rem)] cursor-row-resize',
        className
      )}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented || disabled || event.altKey || event.ctrlKey || event.metaKey)
          return
        if (event.key === 'Enter') {
          event.preventDefault()
          context.state.toggle(value)
          return
        }
        if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault()
          context.state.resize(value, event.key === 'Home' ? min : max)
          return
        }
        const horizontal = context.state.orientation === 'horizontal',
          direction = context.direction(),
          amount = event.shiftKey ? largeStep : step
        const sign = horizontal
          ? event.key === 'ArrowRight'
            ? 1
            : event.key === 'ArrowLeft'
              ? -1
              : 0
          : event.key === 'ArrowDown'
            ? 1
            : event.key === 'ArrowUp'
              ? -1
              : 0
        if (!sign) return
        event.preventDefault()
        context.state.resizeBy(value, sign * amount * (horizontal && direction === 'rtl' ? -1 : 1))
      }}
      onPointerDown={event => {
        onPointerDown?.(event)
        if (event.defaultPrevented || disabled || event.button !== 0 || !event.isPrimary) return
        const room = context.room(),
          token = room > 0 ? context.begin(value) : null
        if (!token) return
        event.preventDefault()
        event.currentTarget.focus({ preventScroll: true })
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          context.finish(token)
          return
        }
        const view = event.currentTarget.ownerDocument.defaultView
        view?.addEventListener('blur', finish)
        drag.current = {
          node: event.currentTarget,
          pointer: event.pointerId,
          token,
          start: context.state.orientation === 'horizontal' ? event.clientX : event.clientY,
          size: context.state.value[index]!,
          room,
          sum: addDecimal(context.state.value[index]!, context.state.value[index + 1]!),
          orientation: context.state.orientation,
          direction: context.direction(),
          cleanup: () => view?.removeEventListener('blur', finish)
        }
      }}
      onPointerMove={event => {
        onPointerMove?.(event)
        const current = drag.current
        if (!current || current.pointer !== event.pointerId) return
        const room = context.room(),
          coordinate = current.orientation === 'horizontal' ? event.clientX : event.clientY
        if (
          disabled ||
          !event.currentTarget.isConnected ||
          context.direction() !== current.direction ||
          Math.abs(
            addDecimal(context.state.value[index]!, context.state.value[index + 1]!) - current.sum
          ) > 1e-7
        ) {
          finish()
          return
        }
        if (event.defaultPrevented) return
        if (Math.abs(room - current.room) > 0.5) {
          current.start = coordinate
          current.size = context.state.value[index]!
          current.room = room
          return
        }
        if (room <= 0) return
        const delta =
          ((coordinate - current.start) / room) *
          100 *
          (current.orientation === 'horizontal' && current.direction === 'rtl' ? -1 : 1)
        context.pointerResize(value, addDecimal(current.size, delta), current.sum)
      }}
      onPointerUp={event => {
        onPointerUp?.(event)
        if (drag.current?.pointer === event.pointerId) finish()
      }}
      onPointerCancel={event => {
        onPointerCancel?.(event)
        if (drag.current?.pointer === event.pointerId) finish()
      }}
      onLostPointerCapture={event => {
        onLostPointerCapture?.(event)
        if (drag.current?.pointer === event.pointerId) finish()
      }}
      onBlur={event => {
        onBlur?.(event)
        finish()
      }}
    />
  )
}
