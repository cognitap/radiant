'use client'

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Slides and their viewport are non-form ARIA groups with native scrolling. */
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode
} from 'react'
import { Button, type ButtonProps } from './Button.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { requireAccessibleName, type AccessibleName } from './internal/accessibleName.js'
import type { WithoutToggle } from './internal/types.js'
import { useControllableState } from './react/useControllableState.js'
import type { ValueOwner } from './react/useNativeOwner.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type CarouselItem = { value: string; label?: string; children: ReactNode }
export type CarouselProps = Omit<ComponentProps<'section'>, 'style' | 'role'> &
  AccessibleName &
  ValueOwner<string | null> & {
    items: readonly CarouselItem[]
    onValueChange?: (value: string | null) => void
    autoPlay?: boolean
    interval?: number
    slideLabel?: (index: number, count: number) => string
    style?: ThemeStyle
    'data-slot'?: string
  }
export type CarouselState = {
  value: string | null
  index: number
  count: number
  playing: boolean
  setValue: (value: string) => void
  setPlaying: (playing: boolean) => void
}
type Binding = CarouselState & {
  items: readonly CarouselItem[]
  viewportId: string
  setViewport: (node: HTMLDivElement | null) => void
  slideLabel: (index: number, count: number) => string
}
const Context = createContext<Binding | null>(null)
export function useCarousel(): CarouselState | null {
  return useContext(Context)
}
function binding() {
  const value = useContext(Context)
  if (!value) throw new Error('Carousel parts must be inside Carousel.')
  return value
}
function slides(viewport: HTMLElement) {
  return Array.from(viewport.children).filter(
    (node): node is HTMLElement =>
      node instanceof viewport.ownerDocument.defaultView!.HTMLElement &&
      node.hasAttribute('data-rad-carousel-value')
  )
}
function nearest(viewport: HTMLElement) {
  const bounds = viewport.getBoundingClientRect(),
    rtl = viewport.ownerDocument.defaultView!.getComputedStyle(viewport).direction === 'rtl'
  return slides(viewport).reduce<HTMLElement | null>((best, node) => {
    const distance = (item: HTMLElement) =>
      Math.abs(
        rtl
          ? item.getBoundingClientRect().right - bounds.right
          : item.getBoundingClientRect().left - bounds.left
      )
    return !best || distance(node) < distance(best) ? node : best
  }, null)
}
function scrollTo(viewport: HTMLElement, value: string | null, smooth = false) {
  const node = slides(viewport).find(node => node.dataset.radCarouselValue === value)
  if (!node) return
  const view = viewport.ownerDocument.defaultView!,
    box = viewport.getBoundingClientRect(),
    rect = node.getBoundingClientRect(),
    rtl = view.getComputedStyle(viewport).direction === 'rtl'
  const delta = rtl ? rect.right - box.right : rect.left - box.left
  if (Math.abs(delta) < 0.5) return false
  viewport.scrollTo({
    left: viewport.scrollLeft + delta,
    behavior:
      smooth && !view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant'
  })
  return true
}
export function Carousel({
  items,
  value,
  defaultValue,
  onValueChange,
  autoPlay = false,
  interval = 5000,
  slideLabel = (index, count) => `${index + 1} of ${count}`,
  children,
  ref,
  className,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: CarouselProps) {
  requireAccessibleName('Carousel', props)
  if (!Number.isFinite(interval) || interval < 1000)
    throw new TypeError('Carousel interval must be at least 1000ms.')
  const keys = items.map(item => item.value)
  if (keys.some(key => !key.trim()) || new Set(keys).size !== keys.length)
    throw new TypeError('Carousel items need unique nonempty values.')
  const owner = useControllableState({
    name: 'Carousel value',
    value,
    defaultValue,
    initialValue: items[0]?.value ?? null,
    onChange: onValueChange
  })
  if (owner.value !== null && !keys.includes(owner.value))
    throw new TypeError('Carousel value must match an item.')
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null),
    [playing, setPlaying] = useState(autoPlay),
    [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false),
    [reduced, setReduced] = useState(false),
    [hidden, setHidden] = useState(false)
  const programmatic = useRef<string | null>(null)
  const current = useRef(owner.value),
    request = useRef(owner.request),
    controlled = useRef(owner.controlled)
  useLayoutEffect(() => {
    current.current = owner.value
    request.current = owner.request
    controlled.current = owner.controlled
  })
  const id = useId(),
    index = keys.indexOf(owner.value ?? ''),
    viewportId = `${id}-viewport`
  const [priorAutoPlay, setPriorAutoPlay] = useState(autoPlay)
  if (priorAutoPlay !== autoPlay) {
    setPriorAutoPlay(autoPlay)
    setPlaying(autoPlay)
  }
  useEffect(() => {
    if (!viewport) return
    const view = viewport.ownerDocument.defaultView!,
      doc = viewport.ownerDocument,
      query = view.matchMedia('(prefers-reduced-motion: reduce)')
    const preferences = () => {
      setReduced(query.matches)
      setHidden(doc.hidden)
    }
    preferences()
    query.addEventListener('change', preferences)
    doc.addEventListener('visibilitychange', preferences)
    return () => {
      query.removeEventListener('change', preferences)
      doc.removeEventListener('visibilitychange', preferences)
    }
  }, [viewport])
  useLayoutEffect(() => {
    if (viewport) {
      programmatic.current = scrollTo(viewport, owner.value, true) ? owner.value : null
    }
  }, [viewport, owner.value])
  const itemsKey = keys.join('\u0000')
  useEffect(() => {
    if (!viewport) return
    const view = viewport.ownerDocument.defaultView!
    let timer: number | undefined, frame: number | undefined
    let lastRequested: string | null = null
    const settled = () => {
      view.clearTimeout(timer)
      if (viewport.hasAttribute('data-dragging')) return
      const next = nearest(viewport)?.dataset.radCarouselValue
      if (programmatic.current !== null) {
        if (next === programmatic.current) programmatic.current = null
        return
      }
      if (!next || next === current.current) {
        lastRequested = null
        return
      }
      if (next === lastRequested) return
      lastRequested = next
      request.current(next)
      if (controlled.current)
        frame = view.requestAnimationFrame(() => scrollTo(viewport, current.current))
    }
    const scrolling = () => {
      view.clearTimeout(timer)
      timer = view.setTimeout(settled, 150)
    }
    const resize = new view.ResizeObserver(() => {
      scrollTo(viewport, current.current)
    })
    const interrupt = () => {
      programmatic.current = null
    }
    viewport.addEventListener('pointerdown', interrupt)
    viewport.addEventListener('wheel', interrupt)
    viewport.addEventListener('keydown', interrupt)
    resize.observe(viewport)
    viewport.addEventListener('scroll', scrolling)
    viewport.addEventListener('scrollend', settled)
    return () => {
      view.clearTimeout(timer)
      if (frame !== undefined) view.cancelAnimationFrame(frame)
      resize.disconnect()
      viewport.removeEventListener('pointerdown', interrupt)
      viewport.removeEventListener('wheel', interrupt)
      viewport.removeEventListener('keydown', interrupt)
      viewport.removeEventListener('scroll', scrolling)
      viewport.removeEventListener('scrollend', settled)
    }
  }, [viewport, itemsKey])
  useEffect(() => {
    if (!viewport || !playing || hovered || focused || reduced || hidden || items.length < 2) return
    const view = viewport.ownerDocument.defaultView!,
      timer = view.setTimeout(
        () => request.current(items[(index + 1) % items.length]!.value),
        interval
      )
    return () => view.clearTimeout(timer)
  }, [viewport, playing, hovered, focused, reduced, hidden, items, index, interval])
  const setValue = (next: string) => {
    setPlaying(false)
    owner.request(next)
  }
  return (
    <Context.Provider
      value={{
        value: owner.value,
        index,
        count: items.length,
        playing,
        setValue,
        setPlaying,
        items,
        viewportId,
        setViewport,
        slideLabel
      }}
    >
      <section
        {...props}
        ref={ref}
        aria-roledescription="carousel"
        data-slot={joinIds('carousel', props['data-slot'])}
        data-playing={playing && !hovered && !focused && !reduced && !hidden ? '' : undefined}
        className={cn(
          'grid min-w-0 gap-[var(--rad-carousel-gap,var(--rad-spacing-group-gap,1rem))]',
          className
        )}
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
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
        }}
      >
        {children}
        <output
          className="sr-only"
          aria-live={playing ? 'off' : 'polite'}
          aria-atomic="true"
        >
          {index >= 0 ? slideLabel(index, items.length) : ''}
        </output>
      </section>
    </Context.Provider>
  )
}
export type CarouselViewportProps = Omit<
  ComponentProps<'div'>,
  'children' | 'id' | 'style' | 'role' | 'tabIndex'
> & { style?: ThemeStyle; 'data-slot'?: string }
/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The named native scroll viewport is keyboard reachable and retains group semantics. */
export function CarouselViewport({
  ref,
  className,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onClickCapture,
  ...props
}: CarouselViewportProps) {
  const state = binding(),
    host = useRef<HTMLDivElement>(null),
    owned = useComposedRefs(host, state.setViewport),
    composed = useComposedRefs(owned, ref),
    gesture = useRef<{ id: number; x: number; left: number; moved: boolean } | null>(null),
    suppress = useRef(false)
  function finish(node: HTMLDivElement) {
    const active = gesture.current
    if (!active) return
    gesture.current = null
    node.style.removeProperty('scroll-snap-type')
    node.removeAttribute('data-dragging')
    if (node.hasPointerCapture(active.id)) node.releasePointerCapture(active.id)
    if (active.moved) {
      suppress.current = true
      node.dispatchEvent(new Event('scroll'))
    }
  }
  return (
    <div
      {...props}
      ref={composed}
      id={state.viewportId}
      role="group"
      aria-label="Slides"
      tabIndex={0}
      data-slot={joinIds('carousel-viewport', props['data-slot'])}
      className={cn(
        'flex min-w-0 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [touch-action:pan-x_pan-y] gap-[var(--rad-carousel-slide-gap,0px)] rounded-[var(--rad-carousel-radius,var(--rad-surface-radius,0.75rem))] focus-visible:outline-[color:var(--rad-color-focus)] focus-visible:outline-[length:var(--rad-focus-width,2px)] focus-visible:outline-offset-2',
        className
      )}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (
          event.defaultPrevented ||
          event.target !== event.currentTarget ||
          event.altKey ||
          event.metaKey ||
          event.ctrlKey
        )
          return
        const rtl =
          event.currentTarget.ownerDocument.defaultView!.getComputedStyle(event.currentTarget)
            .direction === 'rtl'
        let next: number | undefined
        if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = state.count - 1
        else if (event.key === 'ArrowRight') next = state.index + (rtl ? -1 : 1)
        else if (event.key === 'ArrowLeft') next = state.index + (rtl ? 1 : -1)
        if (next !== undefined) {
          event.preventDefault()
          const item = state.items[Math.max(0, Math.min(state.count - 1, next))]
          if (item) state.setValue(item.value)
        }
      }}
      onPointerDown={event => {
        onPointerDown?.(event)
        suppress.current = false
        if (
          event.defaultPrevented ||
          event.pointerType === 'touch' ||
          event.button !== 0 ||
          !event.isPrimary ||
          (event.target as Element).closest(
            'a,button,input,textarea,select,[contenteditable="true"]'
          )
        )
          return
        gesture.current = {
          id: event.pointerId,
          x: event.clientX,
          left: event.currentTarget.scrollLeft,
          moved: false
        }
      }}
      onPointerMove={event => {
        onPointerMove?.(event)
        const active = gesture.current
        if (!active || active.id !== event.pointerId || event.defaultPrevented) return
        const delta = event.clientX - active.x
        if (!active.moved && Math.abs(delta) < 5) return
        if (!active.moved) {
          active.moved = true
          event.currentTarget.setPointerCapture(event.pointerId)
          event.currentTarget.style.scrollSnapType = 'none'
          event.currentTarget.setAttribute('data-dragging', '')
        }
        event.preventDefault()
        event.currentTarget.scrollLeft = active.left - delta
      }}
      onPointerUp={event => {
        onPointerUp?.(event)
        finish(event.currentTarget)
      }}
      onPointerCancel={event => {
        onPointerCancel?.(event)
        finish(event.currentTarget)
      }}
      onLostPointerCapture={event => {
        onLostPointerCapture?.(event)
        finish(event.currentTarget)
      }}
      onClickCapture={event => {
        onClickCapture?.(event)
        if (suppress.current) {
          suppress.current = false
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      {state.items.map((item, index) => (
        <div
          key={item.value}
          role="group"
          aria-roledescription="slide"
          aria-label={`${item.label ? `${item.label}, ` : ''}${state.slideLabel(index, state.count)}`}
          data-slot="carousel-slide"
          inert={state.value !== item.value || undefined}
          data-rad-carousel-value={item.value}
          data-selected={state.value === item.value ? '' : undefined}
          className="box-border min-w-0 flex-[0_0_100%] snap-start"
        >
          {item.children}
        </div>
      ))}
    </div>
  )
}
/* oxlint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
export type CarouselActionProps = WithoutToggle<ButtonProps>
function Action({ direction, ...props }: CarouselActionProps & { direction: -1 | 1 }) {
  const state = binding(),
    item = state.items[state.index + direction]
  return (
    <Button
      {...props}
      pressed={undefined}
      defaultPressed={undefined}
      onPressedChange={undefined}
      aria-pressed={undefined}
      disabled={props.disabled || !item}
      aria-controls={state.viewportId}
      data-slot={joinIds(direction < 0 ? 'carousel-previous' : 'carousel-next', props['data-slot'])}
      onClick={event => {
        props.onClick?.(event)
        if (!event.defaultPrevented && item) state.setValue(item.value)
      }}
    />
  )
}
export function CarouselPrevious(props: CarouselActionProps) {
  return (
    <Action
      {...props}
      direction={-1}
    />
  )
}
export function CarouselNext(props: CarouselActionProps) {
  return (
    <Action
      {...props}
      direction={1}
    />
  )
}
export type CarouselIndicatorsProps = Omit<ComponentProps<'div'>, 'children' | 'style'> & {
  style?: ThemeStyle
  indicatorLabel?: (index: number, count: number) => string
  'data-slot'?: string
}
export function CarouselIndicators({
  indicatorLabel = (index, count) => `Show slide ${index + 1} of ${count}`,
  className,
  ...props
}: CarouselIndicatorsProps) {
  const state = binding()
  return (
    <div
      {...props}
      data-slot={joinIds('carousel-indicators', props['data-slot'])}
      className={cn('flex flex-wrap gap-2', className)}
    >
      {state.items.map((item, index) => (
        <Button
          key={item.value}
          variant="ghost"
          tone="neutral"
          aria-label={indicatorLabel(index, state.count)}
          aria-current={state.value === item.value ? 'true' : undefined}
          aria-controls={state.viewportId}
          onClick={() => state.setValue(item.value)}
        >
          {index + 1}
        </Button>
      ))}
    </div>
  )
}
export function CarouselAutoPlay({ onClick, ...props }: CarouselActionProps) {
  const state = binding()
  return (
    <Button
      {...props}
      pressed={undefined}
      defaultPressed={undefined}
      onPressedChange={undefined}
      aria-pressed={undefined}
      data-slot={joinIds('carousel-auto-play', props['data-slot'])}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) state.setPlaying(!state.playing)
      }}
    >
      {props.children ?? (state.playing ? 'Pause slides' : 'Play slides')}
    </Button>
  )
}
