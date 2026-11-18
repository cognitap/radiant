'use client'

import { useLayoutEffect, useRef, type ComponentProps, type RefObject } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import { positionSelect } from '../../internal/select.js'
import { observeAnchorLocale, syncPopupLocale } from '../../internal/popupLocale.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useTransitionHost } from '../../motion/host.js'
import type { ControlSize } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { controlMetrics } from '../shared/controlStyles.js'
import { selectContentClass } from './selectStyles.js'

type SelectPopupState = {
  open: boolean
  trigger: HTMLButtonElement | null
  content: RefObject<HTMLDivElement | null>
  restoreFocus: RefObject<boolean>
  value?: string | null
  collection?: readonly unknown[]
  close(restore?: boolean): void
  focusInitial(node: HTMLDivElement): void
}

/** Shared Select top layer. The owner defines its roles, selection and keyboard model. */
export type SelectContentProps = Omit<ComponentProps<'div'>, 'style' | 'popover'> & {
  style?: ThemeStyle
  position?: 'item-aligned' | 'popper'
  sideOffset?: number
  collisionPadding?: number
  motion?: 'inherit' | 'off'
  'data-slot'?: string
}
export function SelectPopup({
  state: select,
  controlSize,
  children,
  position = 'item-aligned',
  sideOffset = 4,
  collisionPadding = 8,
  motion = 'inherit',
  className,
  ref,
  ...props
}: SelectContentProps & { state: SelectPopupState; controlSize: ControlSize }) {
  const { lang, dir } = props
  const mergedRef = useComposedRefs(select.content, ref)
  const {
    ref: transitionRef,
    active: motionActive,
    off: motionOff
  } = useTransitionHost('popup', mergedRef, motion === 'off')
  const latest = useRef(select)
  useLayoutEffect(() => {
    latest.current = select
  })
  const wasOpen = useRef(false)
  useLayoutEffect(() => {
    const state = latest.current
    const node = state.content.current
    const trigger = state.trigger
    if (!node || !trigger) return
    const doc = trigger.ownerDocument
    const win = doc.defaultView!
    if (!state.open) {
      if (
        wasOpen.current &&
        latest.current.restoreFocus.current &&
        node.contains(doc.activeElement)
      )
        trigger.focus({ preventScroll: true })
      if (node.matches(':popover-open')) node.hidePopover()
      wasOpen.current = false
      return
    }
    const seedWidth = () => {
      const available =
        (win.visualViewport?.width ?? win.innerWidth) - 2 * Math.max(0, collisionPadding)
      const width = `${Math.min(trigger.getBoundingClientRect().width, Math.max(0, available))}px`
      if (node.style.getPropertyValue('--_rad-select-width') !== width)
        node.style.setProperty('--_rad-select-width', width)
    }
    // Top-layer auto layout is viewport-sized. Establish the anchor width before it can paint.
    seedWidth()
    syncPopupLocale(trigger, node, { lang, dir })
    node.showPopover()
    const place = () => {
      if (!node.isConnected || !node.matches(':popover-open')) return
      const rtl = syncPopupLocale(trigger, node, { lang, dir })
      seedWidth()
      const viewport = win.visualViewport
      const selected =
        position === 'item-aligned'
          ? Array.from(node.querySelectorAll<HTMLElement>('[data-slot~="select-item"]')).find(
              item => item.dataset.value === latest.current.value
            )
          : undefined
      const rect = trigger.getBoundingClientRect()
      const computed = win.getComputedStyle(node)
      const viewportNode = node.querySelector<HTMLElement>('[data-slot~="select-viewport"]')
      const naturalHeight = viewportNode
        ? viewportNode.scrollHeight +
          parseFloat(computed.paddingTop) +
          parseFloat(computed.paddingBottom)
        : node.scrollHeight
      const next = positionSelect({
        trigger: rect,
        width: node.getBoundingClientRect().width,
        height:
          naturalHeight +
          parseFloat(computed.borderTopWidth) +
          parseFloat(computed.borderBottomWidth),
        selectedOffset: selected ? selected.offsetTop + selected.offsetHeight / 2 : 24,
        viewport: {
          top: viewport?.offsetTop ?? 0,
          left: viewport?.offsetLeft ?? 0,
          width: viewport?.width ?? win.innerWidth,
          height: viewport?.height ?? win.innerHeight
        },
        padding: Math.max(0, collisionPadding),
        offset: sideOffset,
        aligned: position === 'item-aligned',
        rtl
      })
      for (const [key, value] of Object.entries({
        top: next.top,
        left: next.left,
        width: next.width,
        'max-height': next.maxHeight
      }))
        if (node.style.getPropertyValue(`--_rad-select-${key}`) !== `${value}px`)
          node.style.setProperty(`--_rad-select-${key}`, `${value}px`)
    }
    place()
    const active = doc.activeElement as HTMLElement | null
    if (
      !wasOpen.current ||
      active === doc.body ||
      active?.getAttribute('aria-disabled') === 'true'
    ) {
      state.focusInitial(node)
    }
    wasOpen.current = true
    const outside = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof win.Node) || node.contains(target) || trigger.contains(target)) return
      latest.current.close(false)
    }
    const focusOut = (event: FocusEvent) => {
      const target = event.target
      if (target === doc.body || target === doc.documentElement) return
      if (target instanceof win.Node && !node.contains(target) && !trigger.contains(target))
        latest.current.close(false)
    }
    const scroll = (event: Event) => {
      if (!(event.target instanceof win.Node) || !node.contains(event.target)) place()
    }
    let frame = 0
    const schedule = () => {
      if (!frame)
        frame = win.requestAnimationFrame(() => {
          frame = 0
          place()
        })
    }
    const observer = new win.ResizeObserver(schedule)
    const mutations = new win.MutationObserver(schedule)
    mutations.observe(node, { childList: true, subtree: true, characterData: true })
    observeAnchorLocale(mutations, trigger)
    observer.observe(trigger)
    observer.observe(node)
    doc.addEventListener('pointerdown', outside, true)
    doc.addEventListener('focusin', focusOut)
    doc.addEventListener('scroll', scroll, true)
    win.addEventListener('resize', place)
    win.visualViewport?.addEventListener('resize', place)
    win.visualViewport?.addEventListener('scroll', place)
    return () => {
      observer.disconnect()
      mutations.disconnect()
      win.cancelAnimationFrame(frame)
      doc.removeEventListener('pointerdown', outside, true)
      doc.removeEventListener('focusin', focusOut)
      doc.removeEventListener('scroll', scroll, true)
      win.removeEventListener('resize', place)
      win.visualViewport?.removeEventListener('resize', place)
      win.visualViewport?.removeEventListener('scroll', place)
    }
  }, [
    select.open,
    select.trigger,
    select.collection,
    position,
    sideOffset,
    collisionPadding,
    lang,
    dir
  ])
  useLayoutEffect(() => {
    const node = select.content.current
    const trigger = select.trigger
    return () => {
      if (node?.contains(node.ownerDocument.activeElement) && trigger?.isConnected)
        trigger.focus({ preventScroll: true })
    }
  }, [select.content, select.trigger])
  return (
    <div
      {...props}
      ref={transitionRef}
      popover="manual"
      className={cn(
        selectContentClass,
        controlMetrics({ controlSize }),
        motionActive &&
          !motionOff &&
          'opacity-[var(--_rad-popup-enter,0)] motion-reduce:opacity-100',
        className
      )}
      data-slot={joinIds('select-content', props['data-slot'])}
      data-state={select.open ? 'open' : 'closed'}
      data-motion={motion}
      data-position={position}
    >
      {children}
    </div>
  )
}
