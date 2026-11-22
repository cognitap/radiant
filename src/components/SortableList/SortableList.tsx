'use client'

import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode
} from 'react'
import { cn } from 'cn'
import { Button } from '../Button/Button.js'
import { joinIds } from '../../internal/ids.js'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { useField } from '../Field/Field.js'
import { sameSelection } from '../../internal/selection.js'
import { arrangeOrder, dropIndex, moveItem } from '../../internal/sortable.js'
import { useTransitionHost } from '../../motion/host.js'
import { useArrayFormBridge } from '../../react/useArrayFormBridge.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ControlSize, PartStyle, Spacing } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { pickLayoutClass, spacingGapClasses } from '../shared/layoutStyles.js'

/** Announcement text for an item's name, its zero-based index and the item count. */
export type SortableListText = (item: string, index: number, count: number) => string

/**
 * Ordered list host whose `SortableListItem` children are reordered by dragging a handle or with
 * the keyboard: Space or Enter picks an item up and drops it, arrows and Home or End move it, and
 * Escape cancels. The value is the item values in order; moves are announced politely. Name it
 * with `aria-label` or `aria-labelledby`, or place it in a group `Field`, whose label names it.
 */
export type SortableListProps = Omit<
  ComponentProps<'ol'>,
  'style' | 'children' | 'defaultValue' | 'onChange'
> &
  ValueOwner<string[]> & {
    children?: ReactNode
    /** Receives the item values in their new order after a drop. */
    onValueChange?: (value: string[]) => void
    /** Submits one named value per item, in order. */
    name?: string
    form?: string
    disabled?: boolean
    /** How to reorder with the keyboard; describes each handle. */
    instructionsText: string
    /** Announced when the keyboard picks an item up. */
    pickUpText: SortableListText
    /** Announced after each keyboard move with the item's new position. */
    moveText: SortableListText
    /** Announced when an item settles in a new place; a drop in place says nothing. */
    dropText: SortableListText
    /** Announced when a move is cancelled, or the app declines a drop, and the item returns. */
    cancelText: SortableListText
    /** Names each handle from its item's name; by default the item's own content names it. */
    handleLabel?: (item: string) => string
    /** Space between items from the theme spacing scale. */
    gap?: Spacing
    controlSize?: ControlSize
    /** Requires MotionProvider for the item springs. Off also skips the drop glide. */
    motion?: 'inherit' | 'off'
    parts?: { handle?: PartStyle; content?: PartStyle }
    style?: ThemeStyle
    'data-slot'?: string
  }

/** Div host of one reorderable item; its handle comes first and its children name it. */
export type SortableListItemProps = Omit<ComponentProps<'div'>, 'style'> & {
  /** Stable, unique value submitted and reported in the order. */
  value: string
  /**
   * Plain name used in announcements and `handleLabel`; defaults to the item's text. Set it when
   * the children are not plain text, such as an icon with a caption.
   */
  textValue?: string
  style?: ThemeStyle
  'data-slot'?: string
}

type Nodes = { slot?: HTMLLIElement; item?: HTMLDivElement; handle?: HTMLButtonElement }
type ListContext = {
  instructionsId: string
  disabled: boolean
  controlSize: ControlSize
  motion: 'inherit' | 'off'
  parts: SortableListProps['parts']
  handleLabel: SortableListProps['handleLabel']
  grabbed: string | null
  dragging: string | null
  register(value: string, kind: keyof Nodes, node: HTMLElement | null): void
  keyDown(value: string, event: ReactKeyboardEvent<HTMLButtonElement>): void
  keyUp(event: ReactKeyboardEvent<HTMLButtonElement>): void
  click(value: string, event: ReactMouseEvent<HTMLButtonElement>): void
  blur(value: string): void
  pointerDown(value: string, event: ReactPointerEvent<HTMLButtonElement>): void
}
const Context = createContext<ListContext | null>(null)

/** Lets the focus re-announcement settle before a move is read. */
const ANNOUNCE_DELAY = 500
const DRAG_THRESHOLD = 3
/** Autoscroll speed, in pixels per second, with the pointer one zone into an edge. */
const SCROLL_SPEED = 600

type PointerDrag = {
  pointerId: number
  value: string
  startY: number
  y: number
  slotTop: number
  origin: number
  index: number
  started: boolean
  cleanup(): void
}
type Settled = { item: string; from: number; requested: boolean }

/** The nearest ancestor that scrolls vertically, or the document's scroller. */
function scrollerOf(node: HTMLElement) {
  const view = node.ownerDocument.defaultView!
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const overflow = view.getComputedStyle(parent).overflowY
    if (/auto|scroll|overlay/.test(overflow) && parent.scrollHeight > parent.clientHeight)
      return parent
  }
  return node.ownerDocument.scrollingElement as HTMLElement | null
}

export function SortableList({
  value,
  defaultValue,
  onValueChange,
  name,
  form,
  disabled: disabledProp = false,
  instructionsText,
  pickUpText,
  moveText,
  dropText,
  cancelText,
  handleLabel,
  gap = 'tight',
  controlSize = 'medium',
  motion = 'inherit',
  parts,
  className,
  children,
  ref,
  ...props
}: SortableListProps) {
  const field = useField()
  const labelledBy = props['aria-labelledby'] ?? (props['aria-label'] ? undefined : field?.labelId)
  requireAccessibleName('SortableList', {
    'aria-label': props['aria-label'],
    'aria-labelledby': labelledBy
  })
  const disabled = disabledProp || !!field?.disabled
  if (!instructionsText?.trim()) throw new TypeError('SortableList requires instructionsText.')
  for (const text of [pickUpText, moveText, dropText, cancelText])
    if (typeof text !== 'function')
      throw new TypeError(
        'SortableList requires pickUpText, moveText, dropText and cancelText functions.'
      )
  if (handleLabel !== undefined && typeof handleLabel !== 'function')
    throw new TypeError('SortableList handleLabel must be a function.')
  const elements = Children.toArray(children).filter(
    (child): child is ReactElement<SortableListItemProps> => isValidElement(child)
  )
  if (elements.some(element => element.type !== SortableListItem))
    throw new TypeError('SortableList children must be SortableListItem elements.')
  const byValue = new Map(elements.map(element => [element.props.value, element]))
  const known = elements.map(element => element.props.value)
  if (known.some(item => typeof item !== 'string' || !item) || byValue.size !== known.length)
    throw new TypeError('SortableListItem values must be unique nonempty strings.')

  const owner = useControllableState({
    name: 'SortableList value',
    value,
    defaultValue: defaultValue ? [...defaultValue] : undefined,
    initialValue: [] as string[],
    equal: sameSelection,
    onChange: (next: string[]) => onValueChange?.([...next])
  })
  const committed = arrangeOrder(owner.value, known)
  const [grabState, setGrab] = useState<{ value: string; index: number; origin: number } | null>(
    null
  )
  // A picked-up item that is removed ends the pick.
  const grab = grabState && byValue.has(grabState.value) ? grabState : null
  if (grabState && !grab) setGrab(null)
  const [pointer, setPointer] = useState<{ value: string; phase: 'drag' | 'release' } | null>(null)
  // The draft keeps the picked-up item's place while the app changes the rest of the order.
  const order = grab ? moveItem(committed, grab.value, grab.index) : committed
  const instructionsId = useId()
  const list = useRef<HTMLOListElement>(null)
  const status = useRef<HTMLSpanElement>(null)
  const nodes = useRef(new Map<string, Nodes>())
  const timer = useRef<number | undefined>(undefined)
  const pending = useRef<string[] | null>(null)
  const refocus = useRef<string | null>(null)
  const settled = useRef<Settled | null>(null)
  const keyActivated = useRef(false)
  const drag = useRef<PointerDrag | null>(null)
  const releaseFrom = useRef(0)
  const host = useComposedRefs(list, ref)
  const { ref: layoutRef, off: motionOff } = useTransitionHost('layout', host, motion === 'off')

  const textOf = (item: string) =>
    byValue.get(item)?.props.textValue?.trim() ||
    nodes.current
      .get(item)
      ?.item?.querySelector('[data-slot~="sortable-list-item-content"]')
      ?.textContent?.trim() ||
    item
  const announce = (message: string) => {
    const node = status.current
    if (!node) return
    const view = node.ownerDocument.defaultView!
    view.clearTimeout(timer.current)
    node.textContent = ''
    timer.current = view.setTimeout(() => {
      node.textContent = message
    }, ANNOUNCE_DELAY)
  }
  const request = (next: string[]) => {
    if (sameSelection(next, committed)) return
    pending.current = next
    owner.request(next)
    queueMicrotask(() => {
      pending.current = null
    })
  }
  /** Follow the pointer and the scroll, and mark the drop spot among the other items. */
  const track = () => {
    const state = drag.current,
      root = list.current
    if (!state?.started || !root) return
    const { slot, item } = nodes.current.get(state.value) ?? {}
    const shift = slot ? slot.getBoundingClientRect().top - state.slotTop : 0
    if (item) item.style.translate = `0px ${state.y - state.startY - shift}px`
    const others = latest.current.order
      .filter(other => other !== state.value)
      .map(other => nodes.current.get(other)?.slot?.getBoundingClientRect())
      .filter((rect): rect is DOMRect => rect !== undefined)
    const index = dropIndex(
      others.map(rect => rect.top + rect.height / 2),
      state.y
    )
    state.index = index
    if (index === state.origin || !others.length) {
      root.removeAttribute('data-drop')
      return
    }
    const space = parseFloat(root.ownerDocument.defaultView!.getComputedStyle(root).rowGap) || 0
    const edge = index === 0 ? others[0]!.top - space / 2 : others[index - 1]!.bottom + space / 2
    const origin = root.getBoundingClientRect().top - root.scrollTop + root.clientTop
    root.style.setProperty('--_rad-sortable-list-drop', `${edge - origin}px`)
    root.setAttribute('data-drop', '')
  }

  // Event handlers registered outside React read the latest render through this ref.
  const actions = {
    order,
    grab,
    track,
    pickUp(item: string) {
      const index = committed.indexOf(item)
      setGrab({ value: item, index, origin: index })
      refocus.current = item
      announce(pickUpText(textOf(item), index, committed.length))
    },
    move(item: string, target: number) {
      if (!grab) return
      const index = Math.max(0, Math.min(order.length - 1, target))
      if (index === order.indexOf(item)) return
      setGrab({ ...grab, index })
      refocus.current = item
      announce(moveText(textOf(item), index, order.length))
    },
    drop(keepFocus: boolean) {
      if (!grab) return
      setGrab(null)
      if (keepFocus) refocus.current = grab.value
      settled.current = {
        item: grab.value,
        from: committed.indexOf(grab.value),
        requested: !sameSelection(order, committed)
      }
      request(order)
    },
    cancel() {
      if (!grab) return
      setGrab(null)
      refocus.current = grab.value
      const index = committed.indexOf(grab.value)
      announce(cancelText(textOf(grab.value), index, committed.length))
    },
    finishPointer(commit: boolean) {
      const state = drag.current
      if (!state) return
      track()
      drag.current = null
      state.cleanup()
      const root = list.current
      root?.removeAttribute('data-drop')
      root?.style.removeProperty('--_rad-sortable-list-drop')
      if (!state.started) return
      const item = nodes.current.get(state.value)?.item
      const from = committed.indexOf(state.value)
      // An item removed mid-drag ends the drag without reporting it back.
      if (from < 0) {
        item?.style.removeProperty('translate')
        setPointer(null)
        return
      }
      releaseFrom.current = item?.getBoundingClientRect().top ?? 0
      const next = moveItem(committed, state.value, state.index)
      if (!commit) announce(cancelText(textOf(state.value), from, committed.length))
      else if (!sameSelection(next, committed)) {
        settled.current = { item: state.value, from, requested: true }
        request(next)
      }
      setPointer({ value: state.value, phase: 'release' })
    }
  }
  const latest = useRef(actions)
  useLayoutEffect(() => {
    latest.current = actions
  })

  const context: ListContext = {
    instructionsId,
    disabled,
    controlSize,
    motion,
    parts,
    handleLabel,
    grabbed: grab?.value ?? null,
    dragging: pointer?.value ?? null,
    register: useCallback((item, kind, node) => {
      const entry = nodes.current.get(item) ?? {}
      if (node) Object.assign(entry, { [kind]: node })
      else delete entry[kind]
      if (entry.slot || entry.item || entry.handle) nodes.current.set(item, entry)
      else nodes.current.delete(item)
    }, []),
    keyDown(item, event) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (drag.current) {
        if (event.key === 'Escape') {
          event.preventDefault()
          actions.finishPointer(false)
        }
        return
      }
      const activate = event.key === ' ' || event.key === 'Enter'
      if (activate) keyActivated.current = true
      if (grab?.value !== item) {
        if (activate && !grab) {
          event.preventDefault()
          actions.pickUp(item)
        }
        return
      }
      const index = order.indexOf(item)
      const target =
        event.key === 'ArrowUp'
          ? index - 1
          : event.key === 'ArrowDown'
            ? index + 1
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? order.length - 1
                : undefined
      if (target !== undefined) {
        event.preventDefault()
        actions.move(item, target)
      } else if (activate) {
        event.preventDefault()
        actions.drop(true)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        actions.cancel()
      }
    },
    keyUp(event) {
      // The click a released Space key fires belongs to the key press already handled.
      event.currentTarget.ownerDocument.defaultView!.setTimeout(() => {
        keyActivated.current = false
      }, 0)
    },
    click(item, event) {
      // Screen readers in browse mode activate with a click that has no pointer detail.
      if (event.detail !== 0 || drag.current || keyActivated.current || disabled) return
      if (grab?.value === item) actions.drop(true)
      else if (!grab) actions.pickUp(item)
    },
    blur(item) {
      const handle = nodes.current.get(item)?.handle
      if (grab?.value !== item || !handle) return
      // A move can blur the handle while its node is placed again; only a real departure drops.
      handle.ownerDocument.defaultView!.setTimeout(() => {
        const current = latest.current
        if (current.grab?.value === item && handle.ownerDocument.activeElement !== handle)
          current.drop(false)
      }, 0)
    },
    pointerDown(item, event) {
      const handle = event.currentTarget
      if (
        event.button !== 0 ||
        !event.isPrimary ||
        disabled ||
        grab ||
        drag.current ||
        handle.matches(':disabled')
      )
        return
      // A new grab finishes any glide still running from the last drop.
      if (pointer) setPointer(null)
      const doc = handle.ownerDocument,
        view = doc.defaultView!
      const pointerId = event.pointerId
      let frame: number | undefined, last: number | undefined
      const loop = (time: number) => {
        const state = drag.current
        if (!state || state.pointerId !== pointerId) return
        const elapsed = Math.min(50, last === undefined ? 16 : time - last)
        last = time
        const scroller = scrollerOf(list.current ?? handle)
        const slot = nodes.current.get(state.value)?.slot
        if (scroller && slot) {
          const page = scroller === doc.scrollingElement
          const box = page ? { top: 0, bottom: view.innerHeight } : scroller.getBoundingClientRect()
          const zone = Math.min(slot.offsetHeight, (box.bottom - box.top) / 3)
          const into =
            state.y < box.top + zone
              ? state.y - box.top - zone
              : state.y > box.bottom - zone
                ? state.y - box.bottom + zone
                : 0
          const speed = Math.max(-2, Math.min(2, into / zone)) * SCROLL_SPEED
          if (speed) scroller.scrollTop += (speed * elapsed) / 1000
        }
        latest.current.track()
        frame = view.requestAnimationFrame(loop)
      }
      const move = (next: PointerEvent) => {
        const state = drag.current
        if (!state || next.pointerId !== pointerId) return
        state.y = next.clientY
        if (state.started || Math.abs(state.y - state.startY) < DRAG_THRESHOLD) return
        state.started = true
        state.slotTop = nodes.current.get(item)?.slot?.getBoundingClientRect().top ?? 0
        setPointer({ value: item, phase: 'drag' })
        frame = view.requestAnimationFrame(loop)
      }
      const up = (next: PointerEvent) => {
        if (next.pointerId === pointerId) latest.current.finishPointer(true)
      }
      const cancel = (next: PointerEvent) => {
        if (next.pointerId === pointerId) latest.current.finishPointer(false)
      }
      const escape = (next: KeyboardEvent) => {
        if (next.key !== 'Escape' || !drag.current?.started) return
        next.preventDefault()
        latest.current.finishPointer(false)
      }
      try {
        handle.setPointerCapture(pointerId)
      } catch {
        /* Document listeners still see the release. */
      }
      doc.addEventListener('pointermove', move)
      doc.addEventListener('pointerup', up)
      doc.addEventListener('pointercancel', cancel)
      doc.addEventListener('keydown', escape)
      handle.addEventListener('lostpointercapture', cancel)
      drag.current = {
        pointerId,
        value: item,
        startY: event.clientY,
        y: event.clientY,
        slotTop: 0,
        origin: committed.indexOf(item),
        index: committed.indexOf(item),
        started: false,
        cleanup() {
          if (frame !== undefined) view.cancelAnimationFrame(frame)
          doc.removeEventListener('pointermove', move)
          doc.removeEventListener('pointerup', up)
          doc.removeEventListener('pointercancel', cancel)
          doc.removeEventListener('keydown', escape)
          handle.removeEventListener('lostpointercapture', cancel)
          if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId)
        }
      }
    }
  }

  // Keep focus on the moved handle: placing its node again can drop focus to the body.
  useLayoutEffect(() => {
    const item = refocus.current
    if (!item) return
    refocus.current = null
    const { slot, handle } = nodes.current.get(item) ?? {}
    if (!handle) return
    slot?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    if (handle.ownerDocument.activeElement !== handle) handle.focus({ preventScroll: true })
  })

  // Announce a drop from the order the app kept: a declined drop reads as cancelled.
  useLayoutEffect(() => {
    const note = settled.current
    if (!note) return
    settled.current = null
    const index = committed.indexOf(note.item)
    if (index < 0) return
    if (index !== note.from) announce(dropText(textOf(note.item), index, committed.length))
    else if (note.requested) announce(cancelText(textOf(note.item), index, committed.length))
  })

  // Glide the released item from where the pointer left it into its slot.
  useLayoutEffect(() => {
    if (pointer?.phase !== 'release') return
    const item = nodes.current.get(pointer.value)?.item
    const done = () => setPointer(current => (current === pointer ? null : current))
    if (!item) return done()
    const view = item.ownerDocument.defaultView!
    const clear = () => {
      item.style.removeProperty('transition')
      item.style.removeProperty('translate')
    }
    item.style.removeProperty('translate')
    const offset = releaseFrom.current - item.getBoundingClientRect().top
    if (
      motion === 'off' ||
      motionOff ||
      Math.abs(offset) < 0.5 ||
      view.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return done()
    item.style.transition = 'none'
    item.style.translate = `0px ${offset}px`
    item.getBoundingClientRect()
    item.style.transition =
      'translate var(--rad-sortable-list-release-duration,var(--rad-motion-release-duration,160ms)) var(--rad-motion-release-ease,ease-out)'
    item.style.translate = '0px 0px'
    let fallback = 0
    const end = () => {
      view.clearTimeout(fallback)
      item.removeEventListener('transitionend', end)
      clear()
      done()
    }
    item.addEventListener('transitionend', end)
    fallback = view.setTimeout(end, 1000)
    return () => {
      view.clearTimeout(fallback)
      item.removeEventListener('transitionend', end)
      clear()
    }
  }, [pointer, motion, motionOff])

  useEffect(
    () => () => {
      drag.current?.cleanup()
      drag.current = null
      status.current?.ownerDocument.defaultView?.clearTimeout(timer.current)
    },
    []
  )

  const bridgeRef = useArrayFormBridge({
    values: committed,
    controlled: owner.controlled,
    pending,
    form,
    validity: '',
    reset() {
      latest.current.finishPointer(false)
      owner.reset()
      setGrab(null)
    }
  })

  return (
    <div
      data-slot="sortable-list-root"
      className="contents"
    >
      <Context.Provider value={context}>
        <ol
          {...props}
          aria-labelledby={labelledBy}
          ref={layoutRef}
          data-slot={joinIds('sortable-list', props['data-slot'])}
          data-dragging={pointer?.phase === 'drag' ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
          className={cn(
            'relative m-0 box-border flex w-full min-w-0 list-none flex-col p-0',
            pickLayoutClass('SortableList', spacingGapClasses, 'gap', gap),
            "after:pointer-events-none after:absolute after:inset-x-0 after:top-[var(--_rad-sortable-list-drop,0px)] after:hidden after:h-[var(--rad-sortable-list-marker-width,2px)] after:-translate-y-1/2 after:rounded-full after:bg-[var(--rad-sortable-list-marker-color,var(--rad-color-focus,oklch(0.55_0.13_255)))] after:content-[''] data-drop:after:block forced-colors:after:bg-[Highlight]",
            'data-dragging:cursor-grabbing data-dragging:[&_*]:cursor-grabbing',
            // Handles inside a disabled list keep full opacity so the list dims once.
            'data-disabled:opacity-[var(--rad-sortable-list-disabled-opacity,var(--rad-state-disabled-opacity,0.5))] data-disabled:[--_rad-disabled-opacity:1] forced-colors:data-disabled:opacity-100 forced-colors:data-disabled:[&_[data-slot~=sortable-list-item]]:border-[GrayText] forced-colors:data-disabled:[&_[data-slot~=sortable-list-item]]:text-[GrayText]',
            className
          )}
        >
          {order.map(item => (
            <Fragment key={item}>{byValue.get(item)}</Fragment>
          ))}
        </ol>
      </Context.Provider>
      <span
        id={instructionsId}
        hidden
      >
        {instructionsText}
      </span>
      <span
        ref={status}
        data-slot="sortable-list-status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <input
        ref={bridgeRef}
        type="text"
        className="sr-only"
        data-slot="sortable-list-native"
        data-form-name={name}
        form={form}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        defaultValue={JSON.stringify(committed)}
      />
      {committed.map(item => (
        <input
          key={item}
          data-slot="sortable-list-value"
          type="hidden"
          name={name}
          form={form}
          disabled={disabled}
          value={item}
        />
      ))}
    </div>
  )
}

const itemClass = [
  'relative box-border flex min-w-0 items-center gap-[var(--rad-sortable-list-item-gap,0.5rem)] py-[0.25rem] ps-[0.25rem] pe-[var(--rad-sortable-list-item-padding,0.75rem)] text-start',
  'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
  'rounded-[var(--rad-sortable-list-item-radius,var(--rad-control-radius,0.5rem))] [corner-shape:var(--rad-control-corner-shape,round)]',
  '[border-width:var(--rad-sortable-list-item-border-width,var(--rad-control-border-width,1px))] [border-style:solid] [border-color:var(--rad-sortable-list-item-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
  'bg-[var(--rad-sortable-list-item-background,var(--rad-color-surface,oklch(1_0_0)))] [color:var(--rad-color-foreground,oklch(0.21_0.006_286))]',
  '[box-shadow:var(--rad-sortable-list-item-shadow,none)]',
  'transition-[box-shadow,border-color] duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none',
  'data-grabbed:[border-color:var(--rad-sortable-list-grabbed-border-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'data-dragging:z-[1] data-dragging:pointer-events-none data-dragging:[box-shadow:var(--rad-sortable-list-dragging-shadow,var(--rad-surface-overlay-shadow,0_12px_32px_-12px_rgb(0_0_0/0.35)))]',
  'data-grabbed:[box-shadow:var(--rad-sortable-list-dragging-shadow,var(--rad-surface-overlay-shadow,0_12px_32px_-12px_rgb(0_0_0/0.35)))]',
  'forced-colors:border-[CanvasText] forced-colors:data-grabbed:border-[Highlight] forced-colors:data-dragging:border-[Highlight]'
].join(' ')
const handleClass =
  'shrink-0 cursor-grab touch-none select-none [-webkit-touch-callout:none] disabled:cursor-not-allowed [color:var(--rad-sortable-list-handle-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]'

/** Text of plain string children, for naming a handle before the item renders. */
function plainText(children: ReactNode): string {
  return Children.toArray(children)
    .filter(child => typeof child === 'string' || typeof child === 'number')
    .join('')
    .trim()
}

/** One item: a layout slot and motion part around the visible item, so springs never touch it. */
export function SortableListItem({
  value,
  textValue,
  className,
  children,
  ref,
  ...props
}: SortableListItemProps) {
  const list = useContext(Context)
  if (!list) throw new TypeError('SortableListItem must be inside a SortableList.')
  const contentId = useId()
  const { register } = list
  const slotRef = useCallback(
    (node: HTMLLIElement | null) => register(value, 'slot', node),
    [register, value]
  )
  const itemRef = useCallback(
    (node: HTMLDivElement | null) => register(value, 'item', node),
    [register, value]
  )
  const handleRef = useCallback(
    (node: HTMLButtonElement | null) => register(value, 'handle', node),
    [register, value]
  )
  const composed = useComposedRefs(itemRef, ref)
  const grabbed = list.grabbed === value
  const dragging = list.dragging === value
  return (
    <li
      ref={slotRef}
      data-slot="sortable-list-slot"
      // The dragged item follows the pointer on its own, so it leaves the layout springs.
      data-rad-layout-slot={dragging ? undefined : ''}
      className="m-0 min-w-0 list-none p-0 [scroll-margin-block:var(--rad-spacing-tight,0.5rem)]"
    >
      <div
        data-rad-layout-part=""
        data-slot="sortable-list-part"
        className="min-w-0"
      >
        <div
          {...props}
          ref={composed}
          data-slot={joinIds('sortable-list-item', props['data-slot'])}
          data-grabbed={grabbed ? '' : undefined}
          data-dragging={dragging ? '' : undefined}
          className={cn(itemClass, className)}
        >
          <Button
            type="button"
            ref={handleRef}
            variant="ghost"
            tone="neutral"
            iconOnly
            controlSize={list.controlSize}
            motion={list.motion}
            disabled={list.disabled}
            data-slot="sortable-list-handle"
            aria-labelledby={list.handleLabel ? undefined : contentId}
            aria-label={
              list.handleLabel?.(textValue?.trim() || plainText(children) || value) ?? undefined
            }
            aria-describedby={list.instructionsId}
            aria-pressed={grabbed}
            className={cn(handleClass, list.parts?.handle?.className)}
            style={list.parts?.handle?.style}
            onKeyDown={event => list.keyDown(value, event)}
            onKeyUp={list.keyUp}
            onClick={event => list.click(value, event)}
            onBlur={() => list.blur(value)}
            onPointerDown={event => list.pointerDown(value, event)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <circle
                cx="5.5"
                cy="3.5"
                r="1.25"
              />
              <circle
                cx="10.5"
                cy="3.5"
                r="1.25"
              />
              <circle
                cx="5.5"
                cy="8"
                r="1.25"
              />
              <circle
                cx="10.5"
                cy="8"
                r="1.25"
              />
              <circle
                cx="5.5"
                cy="12.5"
                r="1.25"
              />
              <circle
                cx="10.5"
                cy="12.5"
                r="1.25"
              />
            </svg>
          </Button>
          <div
            id={contentId}
            data-slot="sortable-list-item-content"
            className={cn('min-w-0 flex-1 break-words', list.parts?.content?.className)}
            style={list.parts?.content?.style}
          >
            {children}
          </div>
        </div>
      </div>
    </li>
  )
}
