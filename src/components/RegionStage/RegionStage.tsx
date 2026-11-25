'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject
} from 'react'
import { cn } from 'cn'
import { Button } from '../Button/Button.js'
import { Popover, PopoverContent, PopoverPortal, usePopover } from '../Popover/Popover.js'
import { requireAccessibleName, type AccessibleName } from '../../internal/accessibleName.js'
import { joinIds } from '../../internal/ids.js'
import {
  blendView,
  center,
  clampView,
  initialView,
  panBy,
  parseViewBox,
  revealBox,
  sameView,
  validateMaxZoom,
  validateSeries,
  viewTransform,
  zoomAt,
  type RegionStageBox,
  type RegionStageView
} from '../../internal/regionStage.js'
import {
  isItemOpen,
  nextSelection,
  sameSelection,
  type Selection
} from '../../internal/selection.js'
import { MotionProfileContext } from '../../motion/context.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { StateOwner, ValueOwner } from '../../react/useNativeOwner.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import type { SeriesNumber } from '../../internal/series.js'
import type { ControlSize } from '../../presentation.js'

type Base = Omit<ComponentProps<'div'>, 'style' | 'role' | 'defaultValue' | 'children'> &
  AccessibleName & {
    style?: ThemeStyle
    /** Largest zoom factor; 1 shows the whole viewBox. Defaults to 8. */
    maxZoom?: number
    children?: ReactNode
    'data-slot'?: string
  }

/**
 * Div host, a group named by `aria-label` or `aria-labelledby`, that owns the selection and the
 * view of one RegionStageViewport. Regions are toggle buttons. Regions and pins share one tab
 * stop; arrow keys move between them in document order (Left and Right swap in RTL), Home and
 * End jump to the ends, and Enter or Space selects a region or opens a pin's callout. Anywhere
 * inside, `+` and `-` zoom, `0` resets and Shift with an arrow key pans. Focusing an offscreen
 * item pans it into view. These keys are not discoverable, so describe them with
 * `aria-describedby` where the page has room. A viewport without regions or pins becomes one
 * focusable image that takes this host's name and pans with plain arrow keys; the host then
 * drops its group role and name.
 */
export type RegionStageProps = Base &
  (
    | (ValueOwner<string | null> & {
        type?: 'single'
        onValueChange?: (value: string | null) => void
      })
    | (ValueOwner<string[]> & {
        type: 'multiple'
        onValueChange?: (value: string[]) => void
      })
  )

/** Div host for the zoom buttons. Each label names its button; there is no default text. */
export type RegionStageControlsProps = Omit<ComponentProps<'div'>, 'style' | 'children'> & {
  zoomInLabel: string
  zoomOutLabel: string
  zoomResetLabel: string
  controlSize?: ControlSize
  style?: ThemeStyle
  'data-slot'?: string
}

/**
 * Svg host drawn in the content's own `viewBox`. Children are SVG: a backdrop such as an
 * `<image>` or paths, then regions and pins in the same coordinates. Pointer drag pans and
 * two-finger pinch zooms. The wheel zooms around the pointer with Ctrl or Meta held (a trackpad
 * pinch sends Ctrl); a plain wheel pans once zoomed and scrolls the page otherwise or at an edge.
 * Touch scrolls the page until the view is zoomed, then drags pan.
 */
export type RegionStageViewportProps = Omit<
  ComponentProps<'svg'>,
  'style' | 'viewBox' | 'role' | 'tabIndex'
> & {
  viewBox: string
  style?: ThemeStyle
  'data-slot'?: string
}

/**
 * Svg `g` host: a toggle button named by `aria-label` or `aria-labelledby`. Draws `d` as a path,
 * or its SVG shape children, which inherit fill and stroke and must not set their own so the
 * hover, selected and focus states show. `series` fills it with a categorical color. Values
 * must be unique within a RegionStage.
 */
export type RegionStageRegionProps = Omit<
  ComponentProps<'g'>,
  'style' | 'role' | 'tabIndex' | 'aria-pressed' | 'aria-label' | 'aria-labelledby'
> &
  AccessibleName & {
    value: string
    d?: string
    series?: SeriesNumber
    style?: ThemeStyle
    'data-slot'?: string
  }

/**
 * Svg `g` host: a marker at `x`, `y` in content coordinates that keeps its screen size, named by
 * `aria-label` or `aria-labelledby`. Its children form a callout, a Popover anchored to the
 * marker and named by it, which closes when the pin leaves the view. Without children the pin
 * is an image; it stays in the arrow-key order so keyboard users can read its name.
 */
export type RegionStagePinProps = Omit<
  ComponentProps<'g'>,
  'style' | 'role' | 'tabIndex' | 'aria-label' | 'aria-labelledby' | 'x' | 'y'
> &
  AccessibleName &
  StateOwner<'open', boolean> & {
    x: number
    y: number
    onOpenChange?: (open: boolean) => void
    /** Props of the callout's PopoverContent; the role defaults to `dialog`. */
    callout?: Omit<ComponentProps<typeof PopoverContent>, 'children'>
    style?: ThemeStyle
    'data-slot'?: string
  }

/** Selection, refs and actions; stable while the view moves. */
type StageContext = {
  type: 'single' | 'multiple'
  value: Selection
  toggle: (value: string) => void
  host: RefObject<HTMLDivElement | null>
  box: RefObject<RegionStageBox | null>
  /** The view the next keyboard, wheel or pointer step starts from. */
  target: RefObject<RegionStageView>
  maxZoom: number
  /** Moves to `next`; animated unless reduced motion or `animate` is false. */
  go: (next: RegionStageView, animate?: boolean) => void
  zoomBy: (factor: number) => void
  reset: () => void
  /** Registers an item; returns the unregister function. */
  register: (key: string, shape?: string) => () => void
  /** Region value to the id of its shape group, for the outline overlay. */
  shapes: RefObject<Map<string, string>>
  /** Bumped when the set of items changes. */
  items: number
  empty: boolean
  name: { 'aria-label'?: string; 'aria-labelledby'?: string }
  setFocused: (shape: string | null) => void
}

/** The moving view, read by the viewport, the controls and pins. */
type ViewContext = {
  view: RegionStageView
  /** Screen pixels per viewBox unit at zoom 1; 0 before the first measure. */
  unit: number
  setUnit: (unit: number) => void
  focused: string | null
}

const StageContext = createContext<StageContext | null>(null)
const ViewContext = createContext<ViewContext>({
  view: initialView,
  unit: 0,
  setUnit: () => {},
  focused: null
})

function useRegionStage(part: string) {
  const value = useContext(StageContext)
  if (!value) throw new Error(`${part} must render inside RegionStage.`)
  return value
}

const ITEMS = '[data-slot~="region-stage-region"], [data-slot~="region-stage-pin"]'
const STEP = 1.5
const DURATION = 200

const seriesClass: Record<SeriesNumber, string> = {
  1: '[--_rs-solid:var(--rad-series-1-solid)] [--_rs-soft:var(--rad-series-1-soft)] [--_rs-border:var(--rad-series-1-border)]',
  2: '[--_rs-solid:var(--rad-series-2-solid)] [--_rs-soft:var(--rad-series-2-soft)] [--_rs-border:var(--rad-series-2-border)]',
  3: '[--_rs-solid:var(--rad-series-3-solid)] [--_rs-soft:var(--rad-series-3-soft)] [--_rs-border:var(--rad-series-3-border)]',
  4: '[--_rs-solid:var(--rad-series-4-solid)] [--_rs-soft:var(--rad-series-4-soft)] [--_rs-border:var(--rad-series-4-border)]',
  5: '[--_rs-solid:var(--rad-series-5-solid)] [--_rs-soft:var(--rad-series-5-soft)] [--_rs-border:var(--rad-series-5-border)]',
  6: '[--_rs-solid:var(--rad-series-6-solid)] [--_rs-soft:var(--rad-series-6-soft)] [--_rs-border:var(--rad-series-6-border)]',
  7: '[--_rs-solid:var(--rad-series-7-solid)] [--_rs-soft:var(--rad-series-7-soft)] [--_rs-border:var(--rad-series-7-border)]',
  8: '[--_rs-solid:var(--rad-series-8-solid)] [--_rs-soft:var(--rad-series-8-soft)] [--_rs-border:var(--rad-series-8-border)]'
}

const rootClass = [
  'relative box-border grid min-w-0 gap-[var(--rad-region-stage-gap,0.5rem)] text-start antialiased',
  'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
  '[color:var(--rad-color-foreground,oklch(0.21_0.006_286))]'
].join(' ')

const controlsClass = 'flex min-w-0 flex-wrap items-center gap-[var(--rad-spacing-tight,0.5rem)]'

// Touch scrolls the page until the view is zoomed; then drags pan the drawing.
const viewportClass = [
  'block box-border h-auto w-full max-w-full touch-pan-x touch-pan-y select-none overflow-hidden',
  'data-zoomed:touch-none data-zoomed:cursor-grab data-panning:cursor-grabbing',
  'rounded-[var(--rad-region-stage-radius,var(--rad-control-radius,0.5rem))]',
  '[border:var(--rad-region-stage-border-width,1px)_solid_var(--rad-region-stage-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
  'bg-[var(--rad-region-stage-background,var(--rad-color-surface,oklch(1_0_0)))]',
  'focus-visible:outline-[length:var(--rad-focus-width,2px)] focus-visible:outline-offset-0 focus-visible:outline-solid focus-visible:rad-focus-edge',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:focus-visible:outline-[CanvasText]'
].join(' ')

// Shapes keep a one-pixel stroke at any zoom. Selection and focus outlines sit in an overlay
// drawn after every shape, so a neighbor never covers them.
const regionClass = [
  'cursor-pointer outline-none [&_*]:[vector-effect:non-scaling-stroke]',
  '[fill:var(--_rs-soft,var(--rad-region-stage-region-fill,var(--rad-color-neutral,oklch(0.955_0.004_286))))]',
  '[stroke:var(--_rs-border,var(--rad-region-stage-region-stroke,var(--rad-color-border,oklch(0.885_0.005_286))))] [stroke-width:1]',
  'transition-[fill,stroke] duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none',
  'hover:[stroke:var(--_rs-solid,var(--rad-color-foreground,oklch(0.21_0.006_286)))] hover:[stroke-width:2]',
  'aria-pressed:[fill:var(--_rs-solid,var(--rad-region-stage-selected-fill,var(--rad-color-accent,oklch(0.55_0.13_255))))]',
  'forced-colors:[fill:Canvas] forced-colors:[stroke:CanvasText] forced-colors:hover:[stroke:CanvasText] forced-colors:aria-pressed:[fill:Highlight]'
].join(' ')

const overlayClass = [
  'pointer-events-none [fill:none]',
  '[--_rs-ring:var(--rad-focus-width,2px)] forced-colors:[--_rs-ring:calc(var(--rad-focus-width,2px)*2)]'
].join(' ')
const selectedOutlineClass =
  '[stroke:var(--rad-color-foreground,oklch(0.21_0.006_286))] forced-colors:[stroke:CanvasText]'
const focusOutlineClass =
  '[stroke:var(--rad-color-focus,oklch(0.55_0.13_255))] forced-colors:[stroke:CanvasText]'

const pinClass = [
  'cursor-pointer outline-none',
  '[fill:var(--rad-region-stage-pin-color,var(--rad-color-danger,oklch(0.58_0.2_27)))] [stroke:var(--rad-region-stage-pin-ring,var(--rad-color-surface,oklch(1_0_0)))] [stroke-width:2]',
  'aria-expanded:[stroke:var(--rad-color-foreground,oklch(0.21_0.006_286))]',
  'focus-visible:[stroke:var(--rad-color-focus,oklch(0.55_0.13_255))] focus-visible:[stroke-width:calc(var(--rad-focus-width,2px)*1.5)]',
  'forced-colors:[fill:CanvasText] forced-colors:[stroke:Canvas] forced-colors:focus-visible:[stroke:CanvasText] forced-colors:focus-visible:[stroke-width:calc(var(--rad-focus-width,2px)*2)]'
].join(' ')

/** Pan-and-zoom drawing with named, selectable regions and pins with callouts. */
export function RegionStage(allProps: RegionStageProps) {
  const {
    ref,
    type = 'single',
    value,
    defaultValue,
    onValueChange: _onValueChange,
    maxZoom = 8,
    className,
    children,
    onKeyDown,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...props
  } = allProps
  const [initialType] = useState(type)
  if (type !== initialType)
    throw new TypeError('RegionStage cannot change type during a mount. Remount with a new key.')
  requireAccessibleName('RegionStage', { 'aria-label': label, 'aria-labelledby': labelledBy })
  validateMaxZoom(maxZoom)
  const selection = useControllableState<Selection>({
    name: 'RegionStage',
    value,
    defaultValue,
    initialValue: type === 'multiple' ? [] : null,
    equal: sameSelection,
    onChange: next => {
      if (allProps.type === 'multiple' && Array.isArray(next)) allProps.onValueChange?.(next)
      else if (allProps.type !== 'multiple' && !Array.isArray(next)) allProps.onValueChange?.(next)
    }
  })
  const current = selection.value
  if (
    type === 'multiple'
      ? !Array.isArray(current) || current.some(item => typeof item !== 'string')
      : current !== null && typeof current !== 'string'
  )
    throw new TypeError('RegionStage values must match its single or multiple type.')
  const host = useRef<HTMLDivElement>(null),
    hostRef = useComposedRefs(host, ref)
  const box = useRef<RegionStageBox | null>(null)
  const [view, setView] = useState(initialView)
  const [unit, setUnit] = useState(0)
  const [focused, setFocused] = useState<string | null>(null)
  const target = useRef(initialView)
  const shown = useRef(view)
  const frame = useRef(0)
  const profile = useContext(MotionProfileContext)
  const latest = useRef({ maxZoom, profile, request: selection.request })
  useLayoutEffect(() => {
    shown.current = view
    latest.current = { maxZoom, profile, request: selection.request }
  })
  useEffect(() => {
    const win = host.current?.ownerDocument.defaultView
    return () => {
      if (frame.current) win?.cancelAnimationFrame(frame.current)
    }
  }, [])

  const go = useCallback((next: RegionStageView, animate = true) => {
    const win = host.current?.ownerDocument.defaultView
    if (win && frame.current) win.cancelAnimationFrame(frame.current)
    frame.current = 0
    target.current = next
    const reduced =
      !win ||
      latest.current.profile.mode === 'off' ||
      win.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!animate || reduced || sameView(shown.current, next)) {
      setView(next)
      return
    }
    const from = shown.current,
      start = win.performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION)
      setView(progress < 1 ? blendView(from, next, progress) : next)
      frame.current = progress < 1 ? win.requestAnimationFrame(step) : 0
    }
    frame.current = win.requestAnimationFrame(step)
  }, [])
  const zoomBy = useCallback(
    (factor: number) => {
      const area = box.current
      if (area) go(zoomAt(target.current, factor, center(area), area, latest.current.maxZoom))
    },
    [go]
  )
  const reset = useCallback(() => go(initialView), [go])

  // A lower maximum pulls the view back within it.
  useLayoutEffect(() => {
    const area = box.current
    if (!area) return
    const next = clampView(target.current, area, maxZoom)
    if (!sameView(next, target.current)) go(next, false)
  }, [maxZoom, go])

  const keys = useRef(new Map<string, number>())
  const shapes = useRef(new Map<string, string>())
  // `items` changes whenever an item mounts or unmounts; `count` is how many there are.
  const [registry, setRegistry] = useState({ items: 0, count: 0 })
  const [mounted, setMounted] = useState(false)
  // The empty state waits for the first client layout, so server markup matches hydration.
  // oxlint-disable-next-line react/set-state-in-effect
  useLayoutEffect(() => setMounted(true), [])
  const register = useCallback((key: string, shape?: string) => {
    const map = keys.current
    if (shape && map.has(key))
      throw new TypeError(`RegionStage region values must be unique; "${key}" repeats.`)
    map.set(key, (map.get(key) ?? 0) + 1)
    if (shape) shapes.current.set(key, shape)
    setRegistry(({ items, count }) => ({ items: items + 1, count: count + 1 }))
    return () => {
      const left = (map.get(key) ?? 1) - 1
      if (left) map.set(key, left)
      else map.delete(key)
      if (shape && shapes.current.get(key) === shape) shapes.current.delete(key)
      setRegistry(({ items, count }) => ({ items: items + 1, count: count - 1 }))
    }
  }, [])
  const { items } = registry
  const empty = mounted && registry.count === 0

  const toggle = useCallback(
    (item: string) => {
      latest.current.request(previous =>
        type === 'single'
          ? previous === item
            ? null
            : item
          : nextSelection(previous, item, !isItemOpen(previous, item))
      )
    },
    [type]
  )
  const stage = useMemo<StageContext>(
    () => ({
      type,
      value: current,
      toggle,
      host,
      box,
      target,
      maxZoom,
      go,
      zoomBy,
      reset,
      register,
      shapes,
      items,
      empty,
      name: { 'aria-label': label, 'aria-labelledby': labelledBy },
      setFocused
    }),
    [type, current, toggle, maxZoom, go, zoomBy, reset, register, items, empty, label, labelledBy]
  )
  const viewState = useMemo<ViewContext>(
    () => ({ view, unit, setUnit, focused }),
    [view, unit, focused]
  )

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    const element = event.target as Element
    // Callouts and the zoom buttons keep their own keys.
    if (!element.closest('[data-slot~="region-stage-viewport"]')) return
    const area = box.current
    if (!area) return
    const item = element.closest(ITEMS)
    const rtl = host.current?.ownerDocument.defaultView?.getComputedStyle(host.current).direction
    const step = { x: area.width / 10, y: area.height / 10 }
    const pan = event.shiftKey || !item
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [step.x, 0],
      ArrowRight: [-step.x, 0],
      ArrowUp: [0, step.y],
      ArrowDown: [0, -step.y]
    }
    if (pan && arrows[event.key]) {
      event.preventDefault()
      const [dx, dy] = arrows[event.key]!
      go(panBy(target.current, dx, dy, area, maxZoom))
      return
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      zoomBy(STEP)
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      zoomBy(1 / STEP)
    } else if (event.key === '0') {
      event.preventDefault()
      reset()
    } else if (item && !event.shiftKey) {
      const all = Array.from(host.current!.querySelectorAll<SVGGElement>(ITEMS))
      const index = all.indexOf(item as SVGGElement)
      const forward = rtl === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
      const backward = rtl === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
      const next =
        event.key === forward || event.key === 'ArrowDown'
          ? Math.min(all.length - 1, index + 1)
          : event.key === backward || event.key === 'ArrowUp'
            ? Math.max(0, index - 1)
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? all.length - 1
                : -1
      if (next < 0) return
      event.preventDefault()
      all[next]!.focus()
    }
  }

  return (
    <StageContext.Provider value={stage}>
      <ViewContext.Provider value={viewState}>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions -- The host delegates pan, zoom and roving keys from its regions, pins or drawing. */}
        <div
          {...props}
          // An empty drawing is one image that carries the name instead of this group.
          aria-label={empty ? undefined : label}
          aria-labelledby={empty ? undefined : labelledBy}
          ref={hostRef}
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- A fieldset would add form semantics; the group only names the drawing.
          role={empty ? undefined : 'group'}
          data-slot={joinIds('region-stage', props['data-slot'])}
          data-type={type}
          data-zoomed={view.zoom > 1 ? '' : undefined}
          className={cn(rootClass, className)}
          onKeyDown={onKey}
        >
          {children}
        </div>
      </ViewContext.Provider>
    </StageContext.Provider>
  )
}

function PlusIcon({ minus = false }: { minus?: boolean }) {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d={minus ? 'M3.5 8h9' : 'M3.5 8h9M8 3.5v9'} />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 6V2.5H6M13.5 10v3.5H10M2.5 2.5l4 4M13.5 13.5l-4-4" />
    </svg>
  )
}

export function RegionStageControls({
  zoomInLabel,
  zoomOutLabel,
  zoomResetLabel,
  controlSize = 'small',
  className,
  ...props
}: RegionStageControlsProps) {
  const stage = useRegionStage('RegionStageControls')
  const { zoom } = useContext(ViewContext).view
  if (![zoomInLabel, zoomOutLabel, zoomResetLabel].every(label => label?.trim()))
    throw new TypeError(
      'RegionStageControls requires nonempty zoomInLabel, zoomOutLabel and zoomResetLabel.'
    )
  const button = (
    slot: string,
    label: string,
    unavailable: boolean,
    action: () => void,
    icon: ReactNode
  ) => (
    <Button
      variant="outline"
      tone="neutral"
      controlSize={controlSize}
      iconOnly
      aria-label={label}
      // Buttons stay focusable at a limit, so focus does not drop to the page.
      aria-disabled={unavailable || undefined}
      data-slot={slot}
      className="aria-disabled:opacity-50"
      onClick={() => {
        if (!unavailable) action()
      }}
    >
      {icon}
    </Button>
  )
  return (
    <div
      {...props}
      data-slot={joinIds('region-stage-controls', props['data-slot'])}
      className={cn(controlsClass, className)}
    >
      {button(
        'region-stage-zoom-in',
        zoomInLabel,
        zoom >= stage.maxZoom - 1e-6,
        () => stage.zoomBy(STEP),
        <PlusIcon />
      )}
      {button(
        'region-stage-zoom-out',
        zoomOutLabel,
        zoom <= 1 + 1e-6,
        () => stage.zoomBy(1 / STEP),
        <PlusIcon minus />
      )}
      {button(
        'region-stage-reset',
        zoomResetLabel,
        zoom <= 1 + 1e-6,
        () => stage.reset(),
        <ResetIcon />
      )}
    </div>
  )
}

type Pointer = { x: number; y: number }

export function RegionStageViewport({
  viewBox,
  ref,
  className,
  children,
  onPointerDown,
  onClickCapture,
  preserveAspectRatio = 'xMidYMid meet',
  ...props
}: RegionStageViewportProps) {
  const stage = useRegionStage('RegionStageViewport')
  const { view, unit, setUnit, focused } = useContext(ViewContext)
  const area = parseViewBox(viewBox)
  const svg = useRef<SVGSVGElement>(null),
    svgRef = useComposedRefs(svg, ref)
  const [panning, setPanning] = useState(false)
  const latest = useRef(stage)
  useLayoutEffect(() => {
    latest.current = stage
  })
  const areaKey = `${area.x} ${area.y} ${area.width} ${area.height}`
  useLayoutEffect(() => {
    latest.current.box.current = parseViewBox(areaKey)
    latest.current.go(initialView, false)
  }, [areaKey])

  // One item is in the tab order: the one that had it, else the first selected, else the first.
  const { items, empty } = stage
  useLayoutEffect(() => {
    const node = svg.current
    if (!node) return
    const all = Array.from(node.querySelectorAll<SVGGElement>(ITEMS))
    if (all.some(item => item.tabIndex === 0)) return
    const first = all.find(item => item.getAttribute('aria-pressed') === 'true') ?? all[0]
    if (first) first.tabIndex = 0
  }, [items])

  // Screen pixels per viewBox unit, read from the svg's own transform so borders, aspect ratio
  // and page zoom are included; pins use it to keep their size.
  useLayoutEffect(() => {
    const node = svg.current
    if (!node) return
    const win = node.ownerDocument.defaultView!
    const measure = () => {
      const matrix = node.getScreenCTM()
      if (matrix && matrix.a > 0) setUnit(matrix.a)
    }
    measure()
    const observer = new win.ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [areaKey, setUnit])

  const pointers = useRef(new Map<number, Pointer>())
  const gesture = useRef<{ start: Pointer; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  // Listeners are bound once and read the latest stage through refs.
  useEffect(() => {
    const node = svg.current
    if (!node) return
    const doc = node.ownerDocument
    const startDrag = () => {
      if (!gesture.current) return
      gesture.current.moved = true
      setPanning(true)
      // Capture only once dragging, so a plain click still reaches its region or pin.
      for (const id of pointers.current.keys()) {
        try {
          node.setPointerCapture(id)
        } catch {
          // The pointer already ended.
        }
      }
    }
    const finish = (cancelled: boolean) => {
      if (gesture.current?.moved && !cancelled) suppressClick.current = true
      pointers.current.clear()
      gesture.current = null
      setPanning(false)
    }
    const end = (event: PointerEvent) => {
      const map = pointers.current
      if (!map.delete(event.pointerId)) return
      if (event.type === 'pointercancel') finish(true)
      else if (!map.size) finish(false)
    }
    const down = (event: PointerEvent) => {
      if (event.defaultPrevented || (event.pointerType === 'mouse' && event.button !== 0)) return
      const point = { x: event.clientX, y: event.clientY }
      pointers.current.set(event.pointerId, point)
      suppressClick.current = false
      if (!gesture.current) gesture.current = { start: point, moved: false }
      // A second finger starts a pinch at once.
      else startDrag()
    }
    const move = (event: PointerEvent) => {
      const map = pointers.current
      const previous = map.get(event.pointerId)
      const { box, target, maxZoom, go } = latest.current
      if (!previous || !box.current || !gesture.current) return
      // A mouse released outside the page reports no pointerup; its next move has no buttons.
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        map.delete(event.pointerId)
        if (!map.size) finish(false)
        return
      }
      const next = { x: event.clientX, y: event.clientY }
      if (!gesture.current.moved) {
        const { start } = gesture.current
        if (Math.hypot(next.x - start.x, next.y - start.y) < 4) return
        startDrag()
      }
      const scale = scales(node)
      if (map.size >= 2) {
        const [a, b] = Array.from(map.values())
        const before = { mid: midpoint(a!, b!), distance: Math.hypot(a!.x - b!.x, a!.y - b!.y) }
        map.set(event.pointerId, next)
        const [c, d] = Array.from(map.values())
        const after = { mid: midpoint(c!, d!), distance: Math.hypot(c!.x - d!.x, c!.y - d!.y) }
        let view = panBy(
          target.current,
          (after.mid.x - before.mid.x) / scale.x,
          (after.mid.y - before.mid.y) / scale.y,
          box.current,
          maxZoom
        )
        if (before.distance > 0)
          view = zoomAt(
            view,
            after.distance / before.distance,
            toViewBox(node, after.mid.x, after.mid.y),
            box.current,
            maxZoom
          )
        go(view, false)
        return
      }
      map.set(event.pointerId, next)
      go(
        panBy(
          target.current,
          (next.x - previous.x) / scale.x,
          (next.y - previous.y) / scale.y,
          box.current,
          maxZoom
        ),
        false
      )
    }
    // Ctrl or Meta with the wheel zooms; a plain wheel pans a zoomed view. Neither moves the
    // page while it changes the view, and Ctrl never zooms the page.
    const wheel = (event: WheelEvent) => {
      const { box, target, maxZoom, go } = latest.current
      if (!box.current) return
      const lines = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1
      let next: RegionStageView
      if (event.ctrlKey || event.metaKey) {
        if (event.ctrlKey) event.preventDefault()
        const factor = Math.exp(-event.deltaY * lines * 0.01)
        next = zoomAt(
          target.current,
          factor,
          toViewBox(node, event.clientX, event.clientY),
          box.current,
          maxZoom
        )
      } else {
        if (target.current.zoom <= 1) return
        const scale = scales(node)
        next = panBy(
          target.current,
          (-event.deltaX * lines) / scale.x,
          (-event.deltaY * lines) / scale.y,
          box.current,
          maxZoom
        )
      }
      if (sameView(next, target.current)) return
      event.preventDefault()
      go(next, false)
    }
    // A browser that starts a scroll with the first finger would cancel a pinch.
    const touch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault()
    }
    node.addEventListener('pointerdown', down)
    node.addEventListener('pointermove', move)
    node.addEventListener('wheel', wheel, { passive: false })
    node.addEventListener('touchstart', touch, { passive: false })
    node.addEventListener('touchmove', touch, { passive: false })
    // Releases outside the drawing still end the gesture.
    doc.addEventListener('pointerup', end, true)
    doc.addEventListener('pointercancel', end, true)
    return () => {
      node.removeEventListener('pointerdown', down)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('wheel', wheel)
      node.removeEventListener('touchstart', touch)
      node.removeEventListener('touchmove', touch)
      doc.removeEventListener('pointerup', end, true)
      doc.removeEventListener('pointercancel', end, true)
    }
  }, [])

  const scale = unit ? 1 / (unit * view.zoom) : 1
  const selected = Array.isArray(stage.value) ? stage.value : stage.value ? [stage.value] : []
  const outline = (shape: string, kind: 'selected' | 'focus') => (
    <use
      key={`${kind}-${shape}`}
      href={`#${shape}`}
      data-slot={`region-stage-${kind}-outline`}
      className={kind === 'focus' ? focusOutlineClass : selectedOutlineClass}
      style={{
        strokeWidth: `calc(var(--_rs-ring) * ${round(scale * (kind === 'focus' ? 2 : 1.5))})`
      }}
    />
  )
  return (
    <div
      data-slot="region-stage-frame"
      className="relative min-w-0"
    >
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Without regions or pins the drawing itself takes the pan and zoom keys. */}
      <svg
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio={preserveAspectRatio}
        role={empty ? 'img' : undefined}
        aria-label={empty ? stage.name['aria-label'] : undefined}
        aria-labelledby={empty ? stage.name['aria-labelledby'] : undefined}
        {...props}
        tabIndex={empty ? 0 : undefined}
        data-slot={joinIds('region-stage-viewport', props['data-slot'])}
        data-zoomed={view.zoom > 1 ? '' : undefined}
        data-panning={panning ? '' : undefined}
        className={cn(viewportClass, className)}
        onPointerDown={onPointerDown}
        onClickCapture={event => {
          onClickCapture?.(event)
          if (!suppressClick.current) return
          suppressClick.current = false
          event.stopPropagation()
          event.preventDefault()
        }}
      >
        <g
          data-slot="region-stage-content"
          transform={viewTransform(view)}
        >
          <PinScaleContext.Provider value={scale}>{children}</PinScaleContext.Provider>
          <g
            aria-hidden
            data-slot="region-stage-outlines"
            className={overlayClass}
          >
            {selected.flatMap(item => {
              const shape = stage.shapes.current.get(item)
              return shape && shape !== focused ? [outline(shape, 'selected')] : []
            })}
            {focused ? outline(focused, 'focus') : null}
          </g>
        </g>
      </svg>
    </div>
  )
}

const PinScaleContext = createContext(1)

const round = (value: number) => Math.round(value * 1e6) / 1e6

const midpoint = (a: Pointer, b: Pointer) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/** Screen pixels per viewBox unit on each axis. */
function scales(node: SVGSVGElement) {
  const matrix = node.getScreenCTM()
  return {
    x: matrix && matrix.a > 0 ? matrix.a : 1,
    y: matrix && matrix.d > 0 ? matrix.d : 1
  }
}

/** A client point in the svg's viewBox units. */
function toViewBox(node: SVGSVGElement, x: number, y: number) {
  const matrix = node.getScreenCTM()
  if (!matrix) return { x, y }
  const Point = node.ownerDocument.defaultView!.DOMPoint
  const point = new Point(x, y).matrixTransform(matrix.inverse())
  return { x: point.x, y: point.y }
}

/** Pans a focused item into view when part of it sits outside the viewport. */
function reveal(stage: StageContext, bounds: RegionStageBox) {
  const area = stage.box.current
  if (!area) return
  const next = revealBox(stage.target.current, bounds, area, stage.maxZoom)
  if (!sameView(next, stage.target.current)) stage.go(next)
}

const focusFromKeyboard = (element: Element) => element.matches(':focus-visible')

/** Moves the tab stop to the focused item. */
function takeTabStop(element: SVGGElement) {
  const root = element.closest('[data-slot~="region-stage-viewport"]')
  for (const item of root?.querySelectorAll<SVGGElement>(ITEMS) ?? [])
    item.tabIndex = item === element ? 0 : -1
}

export function RegionStageRegion({
  value,
  d,
  series,
  className,
  children,
  onClick,
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}: RegionStageRegionProps) {
  const stage = useRegionStage('RegionStageRegion')
  requireAccessibleName('RegionStageRegion', props)
  if (typeof value !== 'string' || !value)
    throw new TypeError('RegionStageRegion requires a nonempty string value.')
  if (d === undefined && children == null)
    throw new TypeError('RegionStageRegion requires d or SVG shape children.')
  validateSeries(series)
  const shape = `${useId()}-shape`
  const { register, setFocused } = stage
  useLayoutEffect(() => register(value, shape), [register, value, shape])
  const selected = isItemOpen(stage.value, value)
  return (
    <g
      {...props}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- An SVG shape cannot be a native button.
      role="button"
      tabIndex={-1}
      aria-pressed={selected}
      data-slot={joinIds('region-stage-region', props['data-slot'])}
      data-value={value}
      data-series={series}
      data-selected={selected ? '' : undefined}
      className={cn(regionClass, series && seriesClass[series], className)}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) stage.toggle(value)
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented || (event.key !== 'Enter' && event.key !== ' ')) return
        event.preventDefault()
        stage.toggle(value)
      }}
      onFocus={event => {
        onFocus?.(event)
        takeTabStop(event.currentTarget)
        if (!focusFromKeyboard(event.currentTarget)) return
        setFocused(shape)
        const { x, y, width, height } = event.currentTarget.getBBox()
        reveal(stage, { x, y, width, height })
      }}
      onBlur={event => {
        onBlur?.(event)
        setFocused(null)
      }}
    >
      <g id={shape}>
        {d === undefined ? null : <path d={d} />}
        {children}
      </g>
    </g>
  )
}

export function RegionStagePin({
  x,
  y,
  open,
  defaultOpen,
  onOpenChange,
  callout,
  className,
  children,
  onClick,
  onKeyDown,
  onFocus,
  ...props
}: RegionStagePinProps) {
  const stage = useRegionStage('RegionStagePin')
  requireAccessibleName('RegionStagePin', props)
  if (!Number.isFinite(x) || !Number.isFinite(y))
    throw new TypeError('RegionStagePin requires finite x and y.')
  const scale = useContext(PinScaleContext)
  const { view } = useContext(ViewContext)
  const id = useId()
  const pinId = props.id ?? id
  const { register } = stage
  useLayoutEffect(() => register(`pin:${id}`), [register, id])
  const [anchor, setAnchor] = useState<SVGGElement | null>(null)
  const state = useControllableState({
    name: 'RegionStagePin',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })
  const hasCallout = children != null
  const isOpen = hasCallout && state.value
  // A callout whose pin leaves the view would point at nothing, so it closes.
  const request = useRef(state.request)
  useLayoutEffect(() => {
    request.current = state.request
  })
  useLayoutEffect(() => {
    if (!isOpen || !anchor) return
    const frame = anchor.ownerSVGElement?.getBoundingClientRect()
    const marker = anchor.getBoundingClientRect()
    if (!frame) return
    const cx = marker.left + marker.width / 2,
      cy = marker.top + marker.height / 2
    if (cx < frame.left || cx > frame.right || cy < frame.top || cy > frame.bottom)
      request.current(false)
  }, [isOpen, anchor, view.x, view.y, view.zoom])
  return (
    <Popover
      open={isOpen}
      onOpenChange={next => state.request(next)}
      anchor={anchor}
    >
      <PinBody
        {...props}
        id={pinId}
        anchorRef={setAnchor}
        x={x}
        y={y}
        scale={scale}
        expanded={hasCallout ? state.value : undefined}
        className={className}
        onClick={event => {
          onClick?.(event)
          if (!event.defaultPrevented && hasCallout) state.request(!state.value)
        }}
        onKeyDown={event => {
          onKeyDown?.(event)
          if (event.defaultPrevented || (event.key !== 'Enter' && event.key !== ' ')) return
          event.preventDefault()
          if (hasCallout) state.request(!state.value)
        }}
        onFocus={event => {
          onFocus?.(event)
          takeTabStop(event.currentTarget)
          if (focusFromKeyboard(event.currentTarget))
            reveal(stage, {
              x: x - 12 * scale,
              y: y - 12 * scale,
              width: 24 * scale,
              height: 24 * scale
            })
        }}
      />
      {hasCallout ? (
        <PopoverPortal>
          <PopoverContent
            side="top"
            align="center"
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- The callout is a nonmodal popover named by its pin.
            role="dialog"
            aria-labelledby={props['aria-labelledby'] ?? pinId}
            {...callout}
            data-slot={joinIds('region-stage-callout', callout?.['data-slot'])}
          >
            {children}
          </PopoverContent>
        </PopoverPortal>
      ) : null}
    </Popover>
  )
}

function PinBody({
  anchorRef,
  x,
  y,
  scale,
  expanded,
  className,
  ...props
}: Omit<RegionStagePinProps, 'open' | 'defaultOpen' | 'onOpenChange' | 'callout' | 'children'> & {
  anchorRef: (node: SVGGElement | null) => void
  scale: number
  expanded: boolean | undefined
}) {
  const ref = useComposedRefs(anchorRef, props.ref)
  const contentId = usePopover()?.contentId
  return (
    <g
      {...props}
      ref={ref}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- An SVG marker cannot be a native button.
      role={expanded === undefined ? 'img' : 'button'}
      tabIndex={-1}
      aria-expanded={expanded}
      aria-controls={expanded === undefined ? undefined : contentId}
      data-slot={joinIds('region-stage-pin', props['data-slot'])}
      data-state={expanded === undefined ? undefined : expanded ? 'open' : 'closed'}
      transform={`translate(${x} ${y}) scale(${round(scale)})`}
      className={cn(pinClass, expanded === undefined && 'cursor-default', className)}
    >
      {/* A 24px hit area around a 12px marker. */}
      <circle
        r={12}
        fill="transparent"
        stroke="none"
      />
      <circle r={6} />
    </g>
  )
}
