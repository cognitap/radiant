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
import { useField } from '../Field/Field.js'
import { joinIds } from '../../internal/ids.js'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import {
  arrangeContainers,
  containerOf,
  hasRoom,
  moveToContainer,
  relocate,
  sameLayout,
  type ContainerLayout
} from '../../internal/dragAndDrop.js'
import {
  autoscroll,
  capturePointer,
  dropIndex,
  glideHome,
  scrollerOf
} from '../../internal/sortable.js'
import { MotionProfileContext } from '../../motion/context.js'
import { useTransitionHost } from '../../motion/host.js'
import { useArrayFormBridge } from '../../react/useArrayFormBridge.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useLiveAnnouncer } from '../../react/useLiveAnnouncer.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ControlSize, PartStyle, Spacing } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { GripIcon } from '../shared/GripIcon.js'
import { pickLayoutClass, spacingGapClasses } from '../shared/layoutStyles.js'

/** Item values by container value. */
export type DragAndDropValue = Record<string, string[]>

/** What an announcement describes. */
export type DragAndDropMove = {
  /** The item's name. */
  item: string
  /** Name of the container the item was picked up from. */
  from: string
  /** Name of the container the item is in, over, or kept out of. */
  to: string
  /** Zero-based position in `to`. */
  index: number
  /** Items in `to`, counting the moved item. */
  count: number
}

/** Announcement text for a move. */
export type DragAndDropText = (move: DragAndDropMove) => string

/**
 * Named containers whose `DragAndDropItem` children move between them by dragging a handle, by
 * tapping a handle and then a container, or with the keyboard: Space or Enter picks an item up and
 * drops it, Left and Right (mirrored in right-to-left text) move it to the previous or next
 * container, Up, Down, Home and End move it within one, and Escape cancels. The value maps each
 * container to its item values in order. Left and Right follow container order even when the
 * containers stack in a narrow host. Name it with `aria-label` or `aria-labelledby`, or place it
 * in a group `Field`, whose label names it.
 */
export type DragAndDropProps = Omit<
  ComponentProps<'div'>,
  'style' | 'children' | 'defaultValue' | 'onChange'
> &
  ValueOwner<DragAndDropValue> & {
    /** `DragAndDropContainer` elements, in order, and `DragAndDropItem` elements; fragments flatten. */
    children?: ReactNode
    /** Receives every container's items after a drop. */
    onValueChange?: (value: DragAndDropValue) => void
    /** Submits the value as one JSON object. */
    name?: string
    form?: string
    disabled?: boolean
    /** How to move items with the keyboard; describes each handle. */
    instructionsText: string
    /** Announced when an item is picked up. */
    pickUpText: DragAndDropText
    /** Announced after each keyboard move. */
    moveText: DragAndDropText
    /** Announced when an item settles in a new place; a drop in place says nothing. */
    dropText: DragAndDropText
    /** Announced when a move is cancelled, or the app declines a drop, and the item returns. */
    cancelText: DragAndDropText
    /**
     * Announced, and shown in the container, when a full container refuses an item. Required
     * when any container sets `capacity`.
     */
    fullText?: DragAndDropText
    /** Names each handle from its item's name; by default the item's own content names it. */
    handleLabel?: (item: string) => string
    /** Space between containers from the theme spacing scale. */
    gap?: Spacing
    controlSize?: ControlSize
    /** Requires MotionProvider for the item springs. Off also skips the drop glide. */
    motion?: 'inherit' | 'off'
    parts?: { label?: PartStyle; list?: PartStyle; handle?: PartStyle; content?: PartStyle }
    style?: ThemeStyle
    'data-slot'?: string
  }

/** Div host of one container; its visible `label` names it. */
export type DragAndDropContainerProps = Omit<ComponentProps<'div'>, 'style' | 'children'> & {
  /** Stable, unique key of this container in the value. */
  value: string
  /** Visible container name. */
  label: ReactNode
  /** Plain name used in announcements; defaults to the label's text. */
  textValue?: string
  /** Most items the user may move in; the app's own value may hold more. */
  capacity?: number
  style?: ThemeStyle
  'data-slot'?: string
}

/**
 * Div host of one movable item; its handle comes first and its children name it. Moving it to
 * another container mounts it again there, so state inside it resets.
 */
export type DragAndDropItemProps = Omit<ComponentProps<'div'>, 'style'> & {
  /** Stable, unique value reported in the container's items. */
  value: string
  /** Plain name used in announcements and `handleLabel`; defaults to the item's text. */
  textValue?: string
  style?: ThemeStyle
  'data-slot'?: string
}

type ItemNodes = { slot?: HTMLLIElement; item?: HTMLDivElement; handle?: HTMLButtonElement }
type ContainerNodes = { box?: HTMLDivElement; list?: HTMLUListElement }
type Grab = { value: string; from: string; to: string; index: number }
type PointerDrag = {
  value: string
  from: string
  startX: number
  startY: number
  x: number
  y: number
  slot: { left: number; top: number }
  target: string | null
  index: number
  started: boolean
  cleanup(): void
}
type Settled = { item: string; from: string; index: number; requested: boolean }

type RootContext = {
  instructionsId: string
  disabled: boolean
  controlSize: ControlSize
  motion: 'inherit' | 'off'
  motionOff: boolean
  parts: DragAndDropProps['parts']
  handleLabel: DragAndDropProps['handleLabel']
  order: ContainerLayout
  items: ReadonlyMap<string, ReactElement<DragAndDropItemProps>>
  grabbed: string | null
  dragging: string | null
  target: string | null
  full: (container: string) => string | null
  registerItem(value: string, kind: keyof ItemNodes, node: HTMLElement | null): void
  registerContainer(value: string, kind: keyof ContainerNodes, node: HTMLElement | null): void
  keyDown(value: string, event: ReactKeyboardEvent<HTMLButtonElement>): void
  keyUp(event: ReactKeyboardEvent<HTMLButtonElement>): void
  click(value: string): void
  blur(value: string): void
  pointerDown(value: string, event: ReactPointerEvent<HTMLButtonElement>): void
  place(container: string, event: ReactMouseEvent<HTMLDivElement>): void
}
const Context = createContext<RootContext | null>(null)

const DRAG_THRESHOLD = 3
const RELEASE =
  'translate var(--rad-drag-and-drop-release-duration,var(--rad-motion-release-duration,160ms)) var(--rad-motion-release-ease,ease-out)'
const COLUMNS = [
  '',
  '',
  '@min-[30rem]/drag-and-drop:grid-cols-2',
  '@min-[30rem]/drag-and-drop:grid-cols-2 @min-[46rem]/drag-and-drop:grid-cols-3',
  '@min-[30rem]/drag-and-drop:grid-cols-2 @min-[46rem]/drag-and-drop:grid-cols-3 @min-[62rem]/drag-and-drop:grid-cols-4'
]

const textOfNode = (node: Element | null | undefined) => node?.textContent?.trim() || ''

export function DragAndDrop({
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
  fullText,
  handleLabel,
  gap = 'normal',
  controlSize = 'medium',
  motion = 'inherit',
  parts,
  className,
  children,
  ref,
  ...props
}: DragAndDropProps) {
  const field = useField()
  const labelledBy = props['aria-labelledby'] ?? (props['aria-label'] ? undefined : field?.labelId)
  requireAccessibleName('DragAndDrop', {
    'aria-label': props['aria-label'],
    'aria-labelledby': labelledBy
  })
  const disabled = disabledProp || !!field?.disabled
  if (!instructionsText?.trim()) throw new TypeError('DragAndDrop requires instructionsText.')
  for (const text of [pickUpText, moveText, dropText, cancelText])
    if (typeof text !== 'function')
      throw new TypeError(
        'DragAndDrop requires pickUpText, moveText, dropText and cancelText functions.'
      )
  if (handleLabel !== undefined && typeof handleLabel !== 'function')
    throw new TypeError('DragAndDrop handleLabel must be a function.')
  const elements = flatten(children)
  const containerElements: ReactElement<DragAndDropContainerProps>[] = []
  const itemElements: ReactElement<DragAndDropItemProps>[] = []
  for (const element of elements)
    if (element.type === DragAndDropContainer)
      containerElements.push(element as ReactElement<DragAndDropContainerProps>)
    else if (element.type === DragAndDropItem)
      itemElements.push(element as ReactElement<DragAndDropItemProps>)
    else
      throw new TypeError(
        'DragAndDrop children must be DragAndDropContainer and DragAndDropItem elements.'
      )
  if (!containerElements.length)
    throw new TypeError('DragAndDrop needs at least one DragAndDropContainer.')
  const containers = containerElements.map(element => element.props.value)
  const byContainer = new Map(containerElements.map(element => [element.props.value, element]))
  if (
    containers.some(item => typeof item !== 'string' || !item) ||
    byContainer.size !== containers.length
  )
    throw new TypeError('DragAndDropContainer values must be unique nonempty strings.')
  const capacities = new Map<string, number>()
  for (const element of containerElements) {
    const capacity = element.props.capacity
    if (capacity === undefined) continue
    if (!Number.isInteger(capacity) || capacity < 0)
      throw new TypeError('DragAndDropContainer capacity must be a whole number of items.')
    capacities.set(element.props.value, capacity)
  }
  if (capacities.size && typeof fullText !== 'function')
    throw new TypeError('DragAndDrop requires a fullText function when a container sets capacity.')
  const known = itemElements.map(element => element.props.value)
  const byValue = new Map(itemElements.map(element => [element.props.value, element]))
  if (known.some(item => typeof item !== 'string' || !item) || byValue.size !== known.length)
    throw new TypeError('DragAndDropItem values must be unique nonempty strings.')

  const [seed] = useState(() => (defaultValue ? copy(defaultValue) : undefined))
  const owner = useControllableState<DragAndDropValue>({
    name: 'DragAndDrop value',
    value,
    defaultValue: defaultValue === undefined ? undefined : seed,
    initialValue: {},
    equal: (left, right) => sameLayout(left, right),
    onChange: next => onValueChange?.(copy(next))
  })
  const committed = arrangeContainers(owner.value, containers, known)
  const [grabState, setGrab] = useState<Grab | null>(null)
  // A picked-up item, or the container it is over, that is removed ends the pick, as disabling does.
  const grab =
    grabState && !disabled && byValue.has(grabState.value) && byContainer.has(grabState.to)
      ? grabState
      : null
  if (grabState && !grab) setGrab(null)
  const [pointer, setPointer] = useState<{ value: string; phase: 'drag' | 'release' } | null>(null)
  const [pointerTarget, setPointerTarget] = useState<string | null>(null)
  // The draft keeps the picked-up item's place while the app changes the rest of the value.
  const order = grab ? moveToContainer(committed, grab.value, grab.to, grab.index) : committed
  const instructionsId = useId()
  const root = useRef<HTMLDivElement>(null)
  const { ref: status, announce } = useLiveAnnouncer()
  const itemNodes = useRef(new Map<string, ItemNodes>())
  const containerNodes = useRef(new Map<string, ContainerNodes>())
  const pending = useRef<string[] | null>(null)
  const refocus = useRef<string | null>(null)
  const settled = useRef<Settled | null>(null)
  const keyActivated = useRef(false)
  const dragClick = useRef(false)
  const drag = useRef<PointerDrag | null>(null)
  const releaseFrom = useRef({ x: 0, y: 0 })
  const keyGlide = useRef<{ item: string; x: number; y: number } | null>(null)
  const stopKeyGlide = useRef<(() => void) | undefined>(undefined)
  const host = useComposedRefs(root, ref)
  const motionOff = useContext(MotionProfileContext).mode === 'off'

  const itemName = (item: string) =>
    byValue.get(item)?.props.textValue?.trim() ||
    textOfNode(
      itemNodes.current.get(item)?.item?.querySelector('[data-slot~="drag-and-drop-item-content"]')
    ) ||
    item
  const containerName = (container: string) =>
    byContainer.get(container)?.props.textValue?.trim() ||
    textOfNode(
      containerNodes.current
        .get(container)
        ?.box?.querySelector('[data-slot~="drag-and-drop-container-label"]')
    ) ||
    container
  const describe = (item: string, from: string, to: string, layout: ContainerLayout) => {
    const items = layout[to] ?? []
    const index = items.indexOf(item)
    return {
      item: itemName(item),
      from: containerName(from),
      to: containerName(to),
      index: index < 0 ? items.length : index,
      count: index < 0 ? items.length + 1 : items.length
    }
  }
  const roomFor = (container: string, item: string) =>
    hasRoom(committed, container, item, capacities.get(container))
  /** Report `item` at `index` in `to`; only that item moves in the app's own value. */
  const settle = (item: string, to: string, index: number) => {
    const from = containerOf(committed, item)!
    const next = moveToContainer(committed, item, to, index)
    const requested = !sameLayout(next, committed)
    settled.current = { item, from, index: committed[from]!.indexOf(item), requested }
    if (!requested) return
    pending.current = [JSON.stringify(next)]
    owner.request(relocate(owner.value, containers, known, item, to, index))
    queueMicrotask(() => {
      pending.current = null
    })
  }
  const clearMarkers = () => {
    for (const { list } of containerNodes.current.values()) {
      list?.removeAttribute('data-drop')
      list?.style.removeProperty('--_rad-drag-and-drop-drop')
    }
  }
  /** Follow the pointer and the scroll, and mark the drop spot in the container under it. */
  const track = () => {
    const state = drag.current
    if (!state?.started) return
    const { slot, item } = itemNodes.current.get(state.value) ?? {}
    const now = slot?.getBoundingClientRect()
    const shiftX = now ? now.left - state.slot.left : 0,
      shiftY = now ? now.top - state.slot.top : 0
    if (item)
      item.style.translate = `${state.x - state.startX - shiftX}px ${state.y - state.startY - shiftY}px`
    let target: string | null = null
    for (const container of containers) {
      const rect = containerNodes.current.get(container)?.box?.getBoundingClientRect()
      if (
        rect &&
        state.x >= rect.left &&
        state.x <= rect.right &&
        state.y >= rect.top &&
        state.y <= rect.bottom
      )
        target = container
    }
    const current = latest.current.committed
    const others = target
      ? current[target]!.filter(other => other !== state.value)
          .map(other => itemNodes.current.get(other)?.slot?.getBoundingClientRect())
          .filter((rect): rect is DOMRect => rect !== undefined)
      : []
    const index = dropIndex(
      others.map(rect => rect.top + rect.height / 2),
      state.y
    )
    state.target = target
    state.index = index
    if (latest.current.pointerTarget !== target) setPointerTarget(target)
    clearMarkers()
    const list = target ? containerNodes.current.get(target)?.list : undefined
    const origin = current[state.from]!.indexOf(state.value)
    if (
      !target ||
      !list ||
      !others.length ||
      (target === state.from && index === origin) ||
      !latest.current.roomFor(target, state.value)
    )
      return
    const space = parseFloat(list.ownerDocument.defaultView!.getComputedStyle(list).rowGap) || 0
    const edge = index === 0 ? others[0]!.top - space / 2 : others[index - 1]!.bottom + space / 2
    const top = list.getBoundingClientRect().top - list.scrollTop + list.clientTop
    list.style.setProperty('--_rad-drag-and-drop-drop', `${edge - top}px`)
    list.setAttribute('data-drop', '')
  }

  const containerIndex = (container: string) => containers.indexOf(container)
  // Event handlers registered outside React read the latest render through this ref.
  const actions = {
    committed,
    grab,
    pointerTarget,
    roomFor,
    track,
    pickUp(item: string) {
      const from = containerOf(committed, item)!
      const index = committed[from]!.indexOf(item)
      setGrab({ value: item, from, to: from, index })
      refocus.current = item
      announce(pickUpText(describe(item, from, from, committed)))
    },
    move(to: string, target: number) {
      if (!grab) return
      const without = order[to]!.filter(other => other !== grab.value)
      const index = Math.max(0, Math.min(without.length, target))
      if (to === grab.to && index === order[to]!.indexOf(grab.value)) return
      setGrab({ ...grab, to, index })
      refocus.current = grab.value
      // Another container mounts the item again; it glides there from its old place.
      const rect =
        to === grab.to
          ? undefined
          : itemNodes.current.get(grab.value)?.item?.getBoundingClientRect()
      if (rect) keyGlide.current = { item: grab.value, x: rect.left, y: rect.top }
      const next = moveToContainer(order, grab.value, to, index)
      const move = describe(grab.value, grab.from, to, next)
      announce(roomFor(to, grab.value) ? moveText(move) : fullText!(move))
    },
    drop(keepFocus: boolean) {
      if (!grab) return
      if (!roomFor(grab.to, grab.value)) {
        if (keepFocus) return announce(fullText!(describe(grab.value, grab.from, grab.to, order)))
        return actions.cancel()
      }
      setGrab(null)
      if (keepFocus) refocus.current = grab.value
      settle(grab.value, grab.to, order[grab.to]!.indexOf(grab.value))
    },
    /** Tap-to-place: drop the held item at `index` in `to`, or say why the container refuses it. */
    placeAt(to: string, index: number) {
      if (!grab) return
      const next = moveToContainer(committed, grab.value, to, index)
      if (!roomFor(to, grab.value))
        return announce(fullText!(describe(grab.value, grab.from, to, next)))
      setGrab(null)
      refocus.current = grab.value
      settle(grab.value, to, index)
    },
    /** Tap-to-place on another item: the held item goes before it. */
    placeBefore(item: string) {
      if (!grab || item === grab.value) return
      const to = containerOf(order, item)!
      const before = committed[to]!.filter(other => other !== grab.value).indexOf(item)
      actions.placeAt(to, before < 0 ? Infinity : before)
    },
    cancel() {
      if (!grab) return
      setGrab(null)
      refocus.current = grab.value
      announce(cancelText(describe(grab.value, grab.from, grab.from, committed)))
    },
    finishPointer(commit: boolean) {
      const state = drag.current
      if (!state) return
      track()
      drag.current = null
      state.cleanup()
      clearMarkers()
      setPointerTarget(null)
      if (!state.started) return
      // The click that follows a drag belongs to the drag.
      dragClick.current = true
      root.current?.ownerDocument.defaultView?.setTimeout(() => {
        dragClick.current = false
      }, 0)
      const item = itemNodes.current.get(state.value)?.item
      const from = containerOf(committed, state.value)
      // An item removed mid-drag ends the drag without reporting it back.
      if (!from) {
        item?.style.removeProperty('translate')
        setPointer(null)
        return
      }
      const rect = item?.getBoundingClientRect()
      releaseFrom.current = { x: rect?.left ?? 0, y: rect?.top ?? 0 }
      const target = state.target && byContainer.has(state.target) ? state.target : null
      if (!commit || !target) announce(cancelText(describe(state.value, from, from, committed)))
      else if (!roomFor(target, state.value))
        announce(
          fullText!(
            describe(
              state.value,
              from,
              target,
              moveToContainer(committed, state.value, target, state.index)
            )
          )
        )
      else settle(state.value, target, state.index)
      // A drop elsewhere mounts the handle again; it keeps focus if it had it.
      const handle = itemNodes.current.get(state.value)?.handle
      if (handle && handle.ownerDocument.activeElement === handle) refocus.current = state.value
      setPointer({ value: state.value, phase: 'release' })
    }
  }
  const latest = useRef(actions)
  useLayoutEffect(() => {
    latest.current = actions
  })

  const rtl = () =>
    !!root.current &&
    root.current.ownerDocument.defaultView!.getComputedStyle(root.current).direction === 'rtl'
  const target = grab?.to ?? pointerTarget
  const draggedValue = grab?.value ?? (pointer?.phase === 'drag' ? pointer.value : null)
  const context: RootContext = {
    instructionsId,
    disabled,
    controlSize,
    motion,
    motionOff,
    parts,
    handleLabel,
    order,
    items: byValue,
    grabbed: grab?.value ?? null,
    dragging: pointer?.value ?? null,
    target,
    full(container) {
      if (!draggedValue || container !== target || roomFor(container, draggedValue)) return null
      const from = grab?.from ?? containerOf(committed, draggedValue)!
      return fullText!(
        describe(
          draggedValue,
          from,
          container,
          moveToContainer(committed, draggedValue, container, Infinity)
        )
      )
    },
    registerItem: useCallback((item, kind, node) => {
      const entry = itemNodes.current.get(item) ?? {}
      if (node) Object.assign(entry, { [kind]: node })
      else delete entry[kind]
      if (entry.slot || entry.item || entry.handle) itemNodes.current.set(item, entry)
      else itemNodes.current.delete(item)
    }, []),
    registerContainer: useCallback((container, kind, node) => {
      const entry = containerNodes.current.get(container) ?? {}
      if (node) Object.assign(entry, { [kind]: node })
      else delete entry[kind]
      if (entry.box || entry.list) containerNodes.current.set(container, entry)
      else containerNodes.current.delete(container)
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
        if (activate) {
          event.preventDefault()
          if (grab) actions.placeBefore(item)
          else actions.pickUp(item)
        } else if (grab && event.key === 'Escape') {
          event.preventDefault()
          actions.cancel()
        }
        return
      }
      const index = order[grab.to]!.indexOf(item)
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
      if (step) {
        event.preventDefault()
        const next = containers[containerIndex(grab.to) + (rtl() ? -step : step)]
        if (next) actions.move(next, order[next]!.filter(other => other !== item).length)
        return
      }
      const within =
        event.key === 'ArrowUp'
          ? index - 1
          : event.key === 'ArrowDown'
            ? index + 1
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? Infinity
                : undefined
      if (within !== undefined) {
        event.preventDefault()
        actions.move(grab.to, within)
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
    click(item) {
      if (drag.current || dragClick.current || keyActivated.current || disabled) return
      // Tapping the held item drops it; screen readers in browse mode click without detail.
      if (grab?.value === item) return actions.drop(true)
      if (!grab) return actions.pickUp(item)
      // Tapping or activating another item's handle places the held one before it.
      actions.placeBefore(item)
    },
    blur(item) {
      const handle = itemNodes.current.get(item)?.handle
      if (grab?.value !== item || !handle) return
      // A move can blur the handle while its node is placed again; only a real departure drops.
      handle.ownerDocument.defaultView!.setTimeout(() => {
        const current = latest.current
        if (current.grab?.value !== item) return
        const active = handle.ownerDocument.activeElement
        const node = itemNodes.current.get(item)?.handle
        if (active === handle || active === node) return
        // Focus on another handle of this board, as browse-mode activation moves it, keeps the hold.
        const other = active?.closest('[data-slot~="drag-and-drop-handle"]')
        if (other && root.current?.contains(other)) return
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
      const from = containerOf(committed, item)!
      const session = capturePointer(handle, event.pointerId, {
        move(next) {
          const state = drag.current
          if (!state) return
          state.x = next.clientX
          state.y = next.clientY
          if (
            state.started ||
            Math.hypot(state.x - state.startX, state.y - state.startY) < DRAG_THRESHOLD
          )
            return
          state.started = true
          const rect = itemNodes.current.get(item)?.slot?.getBoundingClientRect()
          state.slot = { left: rect?.left ?? 0, top: rect?.top ?? 0 }
          setPointer({ value: item, phase: 'drag' })
          session.frames()
        },
        frame(elapsed) {
          const state = drag.current
          if (!state) return
          const over = state.target ? containerNodes.current.get(state.target)?.list : undefined
          const scroller = scrollerOf(over ?? root.current ?? handle)
          const slot = itemNodes.current.get(state.value)?.slot
          if (scroller && slot) autoscroll(scroller, state.y, slot.offsetHeight, elapsed)
          latest.current.track()
        },
        release: commit => latest.current.finishPointer(commit),
        escape(next) {
          if (!drag.current?.started) return
          next.preventDefault()
          latest.current.finishPointer(false)
        }
      })
      drag.current = {
        value: item,
        from,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        slot: { left: 0, top: 0 },
        target: from,
        index: committed[from]!.indexOf(item),
        started: false,
        cleanup: session.cleanup
      }
    },
    place(container, event) {
      if (!grab || drag.current || disabled) return
      const target = event.target as Element
      if (target.closest('[data-slot~="drag-and-drop-handle"]')) return
      const node = target.closest('[data-slot~="drag-and-drop-item"]')
      const item = node
        ? [...itemNodes.current].find(([, entry]) => entry.item === node)?.[0]
        : undefined
      if (item === grab.value) return
      if (item) actions.placeBefore(item)
      else actions.placeAt(container, Infinity)
    }
  }

  // Keep focus on the moved handle: placing its node again can drop focus to the body.
  useLayoutEffect(() => {
    const item = refocus.current
    if (!item) return
    refocus.current = null
    const { slot, handle } = itemNodes.current.get(item) ?? {}
    if (!handle) return
    slot?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    if (handle.ownerDocument.activeElement !== handle) handle.focus({ preventScroll: true })
  })

  // Announce a drop from the value the app kept: a declined drop reads as cancelled.
  useLayoutEffect(() => {
    const note = settled.current
    if (!note) return
    settled.current = null
    const to = containerOf(committed, note.item)
    if (!to) return
    const index = committed[to]!.indexOf(note.item)
    if (to !== note.from || index !== note.index)
      announce(dropText(describe(note.item, note.from, to, committed)))
    else if (note.requested) announce(cancelText(describe(note.item, to, to, committed)))
  })

  // Glide the released item from where the pointer left it into its place.
  useLayoutEffect(() => {
    if (pointer?.phase !== 'release') return
    const item = itemNodes.current.get(pointer.value)?.item
    const done = () => setPointer(current => (current === pointer ? null : current))
    if (!item) return done()
    return glideHome(item, releaseFrom.current, RELEASE, motion === 'off' || motionOff, done)
  }, [pointer, motion, motionOff])

  // Glide a keyboard move into another container from where the item was.
  useLayoutEffect(() => {
    const note = keyGlide.current
    if (!note) return
    keyGlide.current = null
    const item = itemNodes.current.get(note.item)?.item
    stopKeyGlide.current?.()
    stopKeyGlide.current = item
      ? glideHome(item, note, RELEASE, motion === 'off' || motionOff, () => {
          stopKeyGlide.current = undefined
        })
      : undefined
  })

  // Disabling mid-move ends the move.
  useEffect(() => {
    if (disabled) latest.current.finishPointer(false)
  }, [disabled])

  useEffect(
    () => () => {
      drag.current?.cleanup()
      drag.current = null
      stopKeyGlide.current?.()
    },
    []
  )

  const serialized = JSON.stringify(committed)
  const bridgeRef = useArrayFormBridge({
    values: [serialized],
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
      data-slot="drag-and-drop-root"
      className="contents"
    >
      <div
        {...props}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- A fieldset would add form semantics; the group only names the board.
        role="group"
        aria-labelledby={labelledBy}
        aria-disabled={disabled || undefined}
        ref={host}
        data-slot={joinIds('drag-and-drop', props['data-slot'])}
        data-dragging={pointer?.phase === 'drag' ? '' : undefined}
        data-grabbing={grab ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        className={cn(
          '@container/drag-and-drop [contain-intrinsic-inline-size:20rem] box-border w-full min-w-0',
          'data-dragging:cursor-grabbing data-dragging:[&_*]:cursor-grabbing',
          // Handles inside a disabled host keep full opacity so the host dims once.
          'data-disabled:opacity-[var(--rad-drag-and-drop-disabled-opacity,var(--rad-state-disabled-opacity,0.5))] data-disabled:[--_rad-disabled-opacity:1] forced-colors:data-disabled:opacity-100 forced-colors:data-disabled:[&_[data-slot~=drag-and-drop-item]]:border-[GrayText] forced-colors:data-disabled:[&_[data-slot~=drag-and-drop-item]]:text-[GrayText]',
          className
        )}
      >
        <div
          data-slot="drag-and-drop-containers"
          className={cn(
            'grid min-w-0 grid-cols-1',
            pickLayoutClass('DragAndDrop', spacingGapClasses, 'gap', gap),
            COLUMNS[Math.min(4, containers.length)]
          )}
        >
          <Context.Provider value={context}>{containerElements}</Context.Provider>
        </div>
      </div>
      <span
        id={instructionsId}
        hidden
      >
        {instructionsText}
      </span>
      <span
        ref={status}
        data-slot="drag-and-drop-status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <input
        ref={bridgeRef}
        type="text"
        className="sr-only"
        data-slot="drag-and-drop-native"
        data-form-name={name}
        form={form}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        defaultValue={JSON.stringify([serialized])}
      />
      {name ? (
        <input
          data-slot="drag-and-drop-value"
          type="hidden"
          name={name}
          form={form}
          disabled={disabled}
          value={serialized}
        />
      ) : null}
    </div>
  )
}

/** Valid elements among the children, with fragments opened. */
function flatten(children: ReactNode): ReactElement[] {
  return Children.toArray(children).flatMap(child =>
    !isValidElement(child)
      ? []
      : child.type === Fragment
        ? flatten((child.props as { children?: ReactNode }).children)
        : [child]
  )
}

function copy(value: DragAndDropValue): DragAndDropValue {
  const next: DragAndDropValue = {}
  for (const [key, items] of Object.entries(value)) if (Array.isArray(items)) next[key] = [...items]
  return next
}

const boxClass = [
  'box-border flex min-w-0 flex-col gap-[var(--rad-spacing-tight,0.5rem)] p-[var(--rad-drag-and-drop-container-padding,0.75rem)]',
  'rounded-[var(--rad-drag-and-drop-container-radius,var(--rad-surface-radius,0.75rem))] [corner-shape:var(--rad-surface-corner-shape,round)]',
  '[border-width:var(--rad-drag-and-drop-container-border-width,var(--rad-control-border-width,1px))] [border-style:solid] [border-color:var(--rad-drag-and-drop-container-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
  'bg-[var(--rad-drag-and-drop-container-background,var(--rad-color-neutral,oklch(0.955_0.004_286)))] [color:var(--rad-color-foreground,oklch(0.21_0.006_286))]',
  'transition-[border-color,box-shadow] duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none',
  // While an item is held, every container takes a tap.
  'data-droppable:cursor-pointer data-droppable:[border-style:dashed]',
  'data-target:[border-style:solid] data-target:[border-color:var(--rad-drag-and-drop-target-border-color,var(--rad-color-focus,oklch(0.55_0.13_255)))] data-target:[box-shadow:0_0_0_1px_var(--rad-drag-and-drop-target-border-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'data-full:[border-color:var(--rad-drag-and-drop-full-border-color,var(--rad-color-danger,oklch(0.577_0.245_27)))] data-full:[box-shadow:0_0_0_1px_var(--rad-drag-and-drop-full-border-color,var(--rad-color-danger,oklch(0.577_0.245_27)))]',
  'forced-colors:border-[CanvasText] forced-colors:data-target:border-[Highlight] forced-colors:data-full:border-[Mark] forced-colors:data-full:[border-style:double]'
].join(' ')
const labelClass =
  'min-w-0 break-words font-[family-name:var(--rad-typography-roles-ui-label-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-label-size,0.875rem)] leading-[var(--rad-typography-roles-ui-label-line-height,1.43)] font-[number:var(--rad-drag-and-drop-label-weight,var(--rad-typography-roles-ui-label-weight,600))]'
const listClass = [
  'relative m-0 box-border flex min-h-[var(--rad-drag-and-drop-list-min-height,2.75rem)] w-full flex-1 min-w-0 list-none flex-col gap-[var(--rad-spacing-tight,0.5rem)] p-0',
  "after:pointer-events-none after:absolute after:inset-x-0 after:top-[var(--_rad-drag-and-drop-drop,0px)] after:hidden after:h-[var(--rad-drag-and-drop-marker-width,2px)] after:-translate-y-1/2 after:rounded-full after:bg-[var(--rad-drag-and-drop-marker-color,var(--rad-color-focus,oklch(0.55_0.13_255)))] after:content-[''] data-drop:after:block forced-colors:after:bg-[Highlight]"
].join(' ')

/** One named container: its label, then its items in a list. */
export function DragAndDropContainer({
  value,
  label,
  textValue: _textValue,
  capacity: _capacity,
  className,
  ref,
  ...props
}: DragAndDropContainerProps) {
  const root = useContext(Context)
  if (!root) throw new TypeError('DragAndDropContainer must be inside a DragAndDrop.')
  const labelId = useId()
  const { registerContainer } = root
  const boxRef = useCallback(
    (node: HTMLDivElement | null) => registerContainer(value, 'box', node),
    [registerContainer, value]
  )
  const listRef = useCallback(
    (node: HTMLUListElement | null) => registerContainer(value, 'list', node),
    [registerContainer, value]
  )
  const composed = useComposedRefs(boxRef, ref)
  const { ref: layoutRef } = useTransitionHost(
    'layout',
    listRef,
    root.motion === 'off' || root.motionOff
  )
  const items = root.order[value] ?? []
  const full = root.full(value)
  return (
    // Taps place a held item; keyboard users move it from its handle instead.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      {...props}
      ref={composed}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- A fieldset would add form semantics; the group only names the container.
      role="group"
      aria-labelledby={labelId}
      data-slot={joinIds('drag-and-drop-container', props['data-slot'])}
      data-droppable={root.grabbed ? '' : undefined}
      data-target={root.target === value ? '' : undefined}
      data-full={full ? '' : undefined}
      className={cn(boxClass, className)}
      // A held item stays focused on its handle while a tap places it.
      onMouseDown={event => {
        props.onMouseDown?.(event)
        if (!root.grabbed || event.defaultPrevented) return
        // Controls inside items keep their own focus; elsewhere the held handle keeps it.
        const control = (event.target as Element).closest(
          'input,textarea,select,a[href],[contenteditable],button:not([data-slot~=drag-and-drop-handle])'
        )
        if (!control) event.preventDefault()
      }}
      onClick={event => {
        props.onClick?.(event)
        if (!event.defaultPrevented) root.place(value, event)
      }}
    >
      <div
        id={labelId}
        data-slot="drag-and-drop-container-label"
        className={cn(labelClass, root.parts?.label?.className)}
        style={root.parts?.label?.style}
      >
        {label}
      </div>
      <ul
        ref={layoutRef}
        data-slot="drag-and-drop-list"
        className={cn(listClass, root.parts?.list?.className)}
        style={root.parts?.list?.style}
      >
        {items.map(item => {
          const element = root.items.get(item)
          return element ? (
            <DragAndDropItem
              key={item}
              {...element.props}
            />
          ) : null
        })}
      </ul>
      {full ? (
        <p
          data-slot="drag-and-drop-full"
          aria-hidden="true"
          className="m-0 min-w-0 break-words text-[length:var(--rad-typography-roles-ui-caption-size,0.75rem)] [color:var(--rad-drag-and-drop-full-color,color-mix(in_oklab,var(--rad-color-danger,oklch(0.577_0.245_27))_79%,var(--rad-color-foreground,oklch(0.21_0.006_286))))] forced-colors:[color:CanvasText]"
        >
          {full}
        </p>
      ) : null}
    </div>
  )
}

const itemClass = [
  'relative box-border flex min-w-0 items-center gap-[var(--rad-drag-and-drop-item-gap,0.5rem)] py-[0.25rem] ps-[0.25rem] pe-[var(--rad-drag-and-drop-item-padding,0.75rem)] text-start',
  'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
  'rounded-[var(--rad-drag-and-drop-item-radius,var(--rad-control-radius,0.5rem))] [corner-shape:var(--rad-control-corner-shape,round)]',
  '[border-width:var(--rad-control-border-width,1px)] [border-style:solid] [border-color:var(--rad-drag-and-drop-item-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
  'bg-[var(--rad-drag-and-drop-item-background,var(--rad-color-surface,oklch(1_0_0)))] [color:var(--rad-color-foreground,oklch(0.21_0.006_286))]',
  'transition-[box-shadow,border-color] duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none',
  'data-grabbed:[border-color:var(--rad-drag-and-drop-target-border-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'data-dragging:z-[1] data-dragging:pointer-events-none data-dragging:[box-shadow:var(--rad-drag-and-drop-dragging-shadow,var(--rad-surface-overlay-shadow,0_12px_32px_-12px_rgb(0_0_0/0.35)))]',
  'data-grabbed:[box-shadow:var(--rad-drag-and-drop-dragging-shadow,var(--rad-surface-overlay-shadow,0_12px_32px_-12px_rgb(0_0_0/0.35)))]',
  'forced-colors:border-[CanvasText] forced-colors:data-grabbed:border-[Highlight] forced-colors:data-dragging:border-[Highlight]'
].join(' ')
const handleClass =
  'shrink-0 cursor-grab touch-none select-none [-webkit-touch-callout:none] disabled:cursor-not-allowed [color:var(--rad-drag-and-drop-handle-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]'

/** Text of plain string children, for naming a handle before the item renders. */
function plainText(children: ReactNode): string {
  return Children.toArray(children)
    .filter(child => typeof child === 'string' || typeof child === 'number')
    .join('')
    .trim()
}

/**
 * One movable item. Declare it as a direct child of `DragAndDrop`; the value decides which
 * container renders it. Its layout slot and motion part wrap the visible item so springs never
 * touch it.
 */
export function DragAndDropItem({
  value,
  textValue,
  className,
  children,
  ref,
  ...props
}: DragAndDropItemProps) {
  const root = useContext(Context)
  if (!root) throw new TypeError('DragAndDropItem must be inside a DragAndDrop.')
  const contentId = useId()
  const { registerItem } = root
  const slotRef = useCallback(
    (node: HTMLLIElement | null) => registerItem(value, 'slot', node),
    [registerItem, value]
  )
  const itemRef = useCallback(
    (node: HTMLDivElement | null) => registerItem(value, 'item', node),
    [registerItem, value]
  )
  const handleRef = useCallback(
    (node: HTMLButtonElement | null) => registerItem(value, 'handle', node),
    [registerItem, value]
  )
  const composed = useComposedRefs(itemRef, ref)
  const grabbed = root.grabbed === value
  const dragging = root.dragging === value
  return (
    <li
      ref={slotRef}
      data-slot="drag-and-drop-slot"
      // The dragged item follows the pointer on its own, so it leaves the layout springs.
      data-rad-layout-slot={dragging ? undefined : ''}
      className="m-0 min-w-0 list-none p-0 [scroll-margin-block:var(--rad-spacing-tight,0.5rem)]"
    >
      <div
        data-rad-layout-part=""
        data-slot="drag-and-drop-part"
        className="min-w-0"
      >
        <div
          {...props}
          ref={composed}
          data-slot={joinIds('drag-and-drop-item', props['data-slot'])}
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
            controlSize={root.controlSize}
            motion={root.motion}
            disabled={root.disabled}
            data-slot="drag-and-drop-handle"
            aria-labelledby={root.handleLabel ? undefined : contentId}
            aria-label={
              root.handleLabel?.(textValue?.trim() || plainText(children) || value) ?? undefined
            }
            aria-describedby={root.instructionsId}
            aria-pressed={grabbed}
            className={cn(handleClass, root.parts?.handle?.className)}
            style={root.parts?.handle?.style}
            onKeyDown={event => root.keyDown(value, event)}
            onKeyUp={root.keyUp}
            onClick={() => root.click(value)}
            onBlur={() => root.blur(value)}
            onPointerDown={event => root.pointerDown(value, event)}
          >
            <GripIcon />
          </Button>
          <div
            id={contentId}
            data-slot="drag-and-drop-item-content"
            className={cn('min-w-0 flex-1 break-words', root.parts?.content?.className)}
            style={root.parts?.content?.style}
          >
            {children}
          </div>
        </div>
      </div>
    </li>
  )
}
