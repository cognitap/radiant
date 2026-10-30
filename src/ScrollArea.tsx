'use client'

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- A scrolling ARIA group preserves menu/listbox child semantics; a fieldset would add unrelated form behavior. */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent
} from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import type { PartStyle } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both'
export type ScrollAreaVisibility = 'hover' | 'scroll' | 'always'
type Name =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string }
export type ScrollAreaProps = Omit<
  ComponentProps<'div'>,
  'style' | 'role' | 'contentEditable' | 'dangerouslySetInnerHTML'
> &
  Name & {
    orientation?: ScrollAreaOrientation
    visibility?: ScrollAreaVisibility
    style?: ThemeStyle
    parts?: { content?: PartStyle; scrollbar?: PartStyle; thumb?: PartStyle }
    'data-slot'?: string
  }
type Axis = 'vertical' | 'horizontal'
type Metrics = {
  width: number
  height: number
  scrollWidth: number
  scrollHeight: number
  innerWidth: number
  innerHeight: number
  rtl: boolean
  orientation: ScrollAreaOrientation
}
type Gesture = {
  pointerId: number
  axis: Axis
  start: number
  offset: number
  travel: number
  max: number
}
const hitSize = 24
const clamp = (value: number) => Math.min(1, Math.max(0, value))
function tracks(metrics: Metrics) {
  const vertical = metrics.orientation !== 'horizontal' && metrics.scrollHeight > metrics.height + 1
  const horizontal = metrics.orientation !== 'vertical' && metrics.scrollWidth > metrics.width + 1
  const height = Math.max(0, metrics.innerHeight - (horizontal ? hitSize : 0))
  const width = Math.max(0, metrics.innerWidth - (vertical ? hitSize : 0))
  return {
    vertical,
    horizontal,
    height,
    width,
    thumbHeight:
      metrics.scrollHeight > 0
        ? Math.min(height, Math.max(hitSize, (height * metrics.height) / metrics.scrollHeight))
        : 0,
    thumbWidth:
      metrics.scrollWidth > 0
        ? Math.min(width, Math.max(hitSize, (width * metrics.width) / metrics.scrollWidth))
        : 0
  }
}
function same(a: Metrics | null, b: Metrics) {
  return a !== null && Object.entries(b).every(([key, value]) => a[key as keyof Metrics] === value)
}

/** The ref and native props reach the browser-owned scroll viewport. */
export function ScrollArea({
  orientation = 'vertical',
  visibility = 'hover',
  parts,
  children,
  className,
  style,
  ref,
  tabIndex = 0,
  onScroll,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: ScrollAreaProps) {
  if (!props['aria-label']?.trim() && !props['aria-labelledby']?.trim())
    throw new TypeError('ScrollArea requires aria-label or aria-labelledby.')
  const owner = useId(),
    root = useRef<HTMLDivElement>(null),
    content = useRef<HTMLDivElement>(null)
  const hostRef = useComposedRefs(root, ref)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const measured = useRef<Metrics | null>(null),
    gesture = useRef<Gesture | null>(null)
  const [dragging, setDragging] = useState<Axis | null>(null)
  const [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false)
  const [scrolling, setScrolling] = useState(false),
    hideTimer = useRef<number | undefined>(undefined)
  const finish = useCallback((node = root.current, notify = true) => {
    const active = gesture.current
    if (!active) return
    gesture.current = null
    if (node?.hasPointerCapture(active.pointerId)) node.releasePointerCapture(active.pointerId)
    if (notify) setDragging(null)
  }, [])
  const position = useCallback((next = measured.current) => {
    const node = root.current
    if (!node || !next) return
    const track = tracks(next)
    const maxX = Math.max(0, next.scrollWidth - next.width),
      maxY = Math.max(0, next.scrollHeight - next.height)
    const x = maxX > 0 ? clamp((next.rtl ? maxX + node.scrollLeft : node.scrollLeft) / maxX) : 0
    const y = maxY > 0 ? clamp(node.scrollTop / maxY) : 0
    node.style.setProperty(
      '--_rad-scroll-area-thumb-x',
      `${x * (track.width - track.thumbWidth)}px`
    )
    node.style.setProperty(
      '--_rad-scroll-area-thumb-y',
      `${y * (track.height - track.thumbHeight)}px`
    )
  }, [])
  const measure = useCallback(() => {
    const node = root.current,
      win = node?.ownerDocument.defaultView
    if (!node || !win) return
    const css = win.getComputedStyle(node)
    const next: Metrics = {
      width: node.clientWidth,
      height: node.clientHeight,
      scrollWidth: node.scrollWidth,
      scrollHeight: node.scrollHeight,
      innerWidth: Math.max(
        0,
        node.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight)
      ),
      innerHeight: Math.max(
        0,
        node.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom)
      ),
      rtl: css.direction === 'rtl',
      orientation
    }
    if (!same(measured.current, next)) finish(node)
    measured.current = next
    position(next)
    setMetrics(previous => (same(previous, next) ? previous : next))
  }, [orientation, finish, position])
  useLayoutEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Read external native viewport geometry, including edits before hydration.
    measure()
  })
  useEffect(() => {
    const node = root.current,
      body = content.current,
      win = node?.ownerDocument.defaultView
    if (!node || !body || !win) return
    let frame: number | undefined
    const schedule = () => {
      if (frame !== undefined) return
      frame = win.requestAnimationFrame(() => {
        frame = undefined
        measure()
      })
    }
    const resize = new win.ResizeObserver(schedule),
      mutation = new win.MutationObserver(schedule)
    resize.observe(node)
    resize.observe(body)
    mutation.observe(body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    })
    body.addEventListener('load', schedule, true)
    body.addEventListener('loadedmetadata', schedule, true)
    node.ownerDocument.fonts?.addEventListener('loadingdone', schedule)
    win.addEventListener('resize', schedule)
    return () => {
      resize.disconnect()
      mutation.disconnect()
      body.removeEventListener('load', schedule, true)
      body.removeEventListener('loadedmetadata', schedule, true)
      node.ownerDocument.fonts?.removeEventListener('loadingdone', schedule)
      win.removeEventListener('resize', schedule)
      if (frame !== undefined) win.cancelAnimationFrame(frame)
      win.clearTimeout(hideTimer.current)
      finish(node, false)
    }
  }, [measure, finish])
  const moveTo = (axis: Axis, offset: number) => {
    const node = root.current
    if (!node) return
    node.scrollTo(
      axis === 'vertical'
        ? { top: offset, behavior: 'instant' }
        : { left: offset, behavior: 'instant' }
    )
    position()
  }
  const start = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event)
    const node = root.current,
      win = node?.ownerDocument.defaultView
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      !node ||
      !win ||
      !(event.target instanceof win.Element)
    )
      return
    const bar = event.target.closest<HTMLElement>('[data-scroll-area-hit]')
    if (!bar || bar.dataset.owner !== owner || !node.contains(bar)) return
    const axis = bar.dataset.axis === 'horizontal' ? 'horizontal' : 'vertical'
    const thumb = bar.querySelector<HTMLElement>('[data-scroll-area-thumb-hit]')
    if (!thumb) return
    measure()
    const current = measured.current
    if (!current) return
    const box = bar.getBoundingClientRect(),
      knob = thumb.getBoundingClientRect()
    const travel = axis === 'vertical' ? box.height - knob.height : box.width - knob.width
    const max =
      axis === 'vertical'
        ? current.scrollHeight - current.height
        : current.scrollWidth - current.width
    if (travel <= 0 || max <= 0) return
    event.preventDefault()
    const coordinate = axis === 'vertical' ? event.clientY : event.clientX
    if (!thumb.contains(event.target)) {
      const progress = clamp(
        (coordinate -
          (axis === 'vertical' ? box.top + knob.height / 2 : box.left + knob.width / 2)) /
          travel
      )
      moveTo(axis, axis === 'horizontal' && current.rtl ? (progress - 1) * max : progress * max)
    }
    gesture.current = {
      pointerId: event.pointerId,
      axis,
      start: coordinate,
      offset: axis === 'vertical' ? node.scrollTop : node.scrollLeft,
      travel,
      max
    }
    if (node.tabIndex >= 0) node.focus({ preventScroll: true })
    node.setPointerCapture(event.pointerId)
    setDragging(axis)
  }
  const active =
    visibility === 'always' ||
    focused ||
    dragging !== null ||
    (visibility === 'hover' ? hovered : scrolling)
  const track = metrics ? tracks(metrics) : null
  const nativeProps = {
    ...props,
    role: undefined,
    contentEditable: undefined,
    dangerouslySetInnerHTML: undefined
  }
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- The native scroll viewport owns keyboard scrolling; pointer delegation operates its decorative scrollbars.
    <div
      {...nativeProps}
      role="group"
      ref={hostRef}
      tabIndex={tabIndex}
      style={style}
      data-slot={joinIds('scroll-area', props['data-slot'])}
      data-orientation={orientation}
      data-visibility={visibility}
      data-enhanced={metrics ? '' : undefined}
      className={cn(
        'relative box-border min-h-0 min-w-0 [scrollbar-width:thin] [scrollbar-color:var(--rad-scroll-area-thumb-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))_var(--rad-scroll-area-track-color,var(--rad-color-surface,oklch(1_0_0)))]',
        'data-enhanced:[scrollbar-width:none] [&[data-enhanced]::-webkit-scrollbar]:hidden',
        'focus-visible:outline-solid focus-visible:[outline-color:var(--rad-color-focus,oklch(0.55_0.13_255))] focus-visible:[outline-width:var(--rad-focus-width,2px)] focus-visible:[outline-offset:var(--rad-focus-offset,2px)] forced-colors:focus-visible:outline-[Highlight]',
        orientation === 'vertical'
          ? 'overflow-x-hidden overflow-y-auto'
          : orientation === 'horizontal'
            ? 'overflow-x-auto overflow-y-hidden'
            : 'overflow-auto',
        className
      )}
      onPointerDown={start}
      onPointerMove={event => {
        onPointerMove?.(event)
        const current = gesture.current
        if (!current || current.pointerId !== event.pointerId) return
        if (event.defaultPrevented) {
          finish()
          return
        }
        event.preventDefault()
        const coordinate = current.axis === 'vertical' ? event.clientY : event.clientX
        moveTo(
          current.axis,
          current.offset + ((coordinate - current.start) / current.travel) * current.max
        )
      }}
      onPointerUp={event => {
        onPointerUp?.(event)
        if (gesture.current?.pointerId === event.pointerId) finish()
      }}
      onPointerCancel={event => {
        onPointerCancel?.(event)
        if (gesture.current?.pointerId === event.pointerId) finish()
      }}
      onLostPointerCapture={event => {
        onLostPointerCapture?.(event)
        if (gesture.current?.pointerId === event.pointerId) finish()
      }}
      onPointerEnter={event => {
        onPointerEnter?.(event)
        setHovered(true)
      }}
      onPointerLeave={event => {
        onPointerLeave?.(event)
        setHovered(false)
      }}
      onFocus={event => {
        onFocus?.(event)
        setFocused(true)
      }}
      onBlur={event => {
        onBlur?.(event)
        const win = event.currentTarget.ownerDocument.defaultView
        if (
          !win ||
          !(event.relatedTarget instanceof win.Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        )
          setFocused(false)
      }}
      onScroll={event => {
        onScroll?.(event)
        if (event.target !== event.currentTarget) return
        position()
        if (visibility === 'scroll') {
          setScrolling(true)
          const win = event.currentTarget.ownerDocument.defaultView
          if (win) {
            win.clearTimeout(hideTimer.current)
            hideTimer.current = win.setTimeout(() => setScrolling(false), 900)
          }
        }
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none sticky start-0 top-0 z-10 h-0 w-full"
      >
        {track?.vertical && metrics ? (
          <Bar
            owner={owner}
            axis="vertical"
            length={track.height}
            thumb={track.thumbHeight}
            active={active}
            dragging={dragging === 'vertical'}
            offset={0}
            parts={parts}
          />
        ) : null}
        {track?.horizontal && metrics ? (
          <Bar
            owner={owner}
            axis="horizontal"
            length={track.width}
            thumb={track.thumbWidth}
            active={active}
            dragging={dragging === 'horizontal'}
            offset={metrics.rtl && track.vertical ? hitSize : 0}
            top={metrics.innerHeight - hitSize}
            parts={parts}
          />
        ) : null}
      </div>
      <div
        ref={content}
        className={cn(
          'box-border min-h-full min-w-full',
          orientation === 'vertical' ? 'w-full' : 'w-max'
        )}
        style={{
          paddingInlineEnd: orientation !== 'horizontal' ? hitSize : undefined,
          paddingBottom: orientation !== 'vertical' ? hitSize : undefined
        }}
      >
        <div
          data-slot="scroll-area-content"
          className={cn('flow-root min-w-0', parts?.content?.className)}
          style={parts?.content?.style}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
function Bar({
  owner,
  axis,
  length,
  thumb,
  active,
  dragging,
  offset,
  top = 0,
  parts
}: {
  owner: string
  axis: Axis
  length: number
  thumb: number
  active: boolean
  dragging: boolean
  offset: number
  top?: number
  parts?: ScrollAreaProps['parts']
}) {
  const vertical = axis === 'vertical'
  const shape = vertical
    ? 'left-1/2 h-full max-w-full -translate-x-1/2 w-[var(--rad-scroll-area-size,6px)]'
    : 'top-1/2 w-full max-h-full -translate-y-1/2 h-[var(--rad-scroll-area-size,6px)]'
  return (
    <div
      data-scroll-area-hit=""
      data-axis={axis}
      data-owner={owner}
      className="absolute touch-none select-none"
      style={{
        width: vertical ? hitSize : length,
        height: vertical ? length : hitSize,
        insetInlineEnd: vertical ? 0 : undefined,
        left: vertical ? undefined : offset,
        top,
        opacity: active ? 1 : 0,
        pointerEvents: active ? 'auto' : 'none'
      }}
    >
      <span
        data-slot="scroll-area-scrollbar"
        data-axis={axis}
        data-state={active ? 'visible' : 'hidden'}
        className={cn(
          'absolute rounded-[var(--rad-scroll-area-radius,var(--rad-control-radius,0.5rem))] bg-[var(--rad-scroll-area-track-color,var(--rad-color-surface,oklch(1_0_0)))] forced-colors:bg-[Canvas]',
          shape,
          parts?.scrollbar?.className
        )}
        style={parts?.scrollbar?.style}
      />
      <div
        data-scroll-area-thumb-hit=""
        data-axis={axis}
        className="absolute top-0 left-0 touch-none"
        style={{
          width: vertical ? hitSize : thumb,
          height: vertical ? thumb : hitSize,
          translate: vertical
            ? '0 var(--_rad-scroll-area-thumb-y,0px)'
            : 'var(--_rad-scroll-area-thumb-x,0px) 0'
        }}
      >
        <span
          data-slot="scroll-area-thumb"
          data-axis={axis}
          data-dragging={dragging ? '' : undefined}
          className={cn(
            'absolute rounded-[var(--rad-scroll-area-radius,var(--rad-control-radius,0.5rem))] bg-[var(--rad-scroll-area-thumb-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))] forced-colors:bg-[CanvasText]',
            shape,
            parts?.thumb?.className
          )}
          style={parts?.thumb?.style}
        />
      </div>
    </div>
  )
}
