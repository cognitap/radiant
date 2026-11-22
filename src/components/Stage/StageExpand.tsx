'use client'

import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import { Button, type ButtonProps } from '../Button/Button.js'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { composeAction } from '../../internal/events.js'
import { joinIds } from '../../internal/ids.js'
import type { WithoutToggle } from '../../internal/types.js'
import { useTransitionHost } from '../../motion/host.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { scrollbarClass } from '../shared/scrollbarStyles.js'

// Collapsed, the native dialog has no box and its children lay out as parts of the Stage root;
// the color reset undoes the platform dialog color, the one inherited value it sets. Open, it is
// the Stage frame in the top layer, styled from the root's computed frame, and its parts query
// its own width.
const stageExpandedVariants = cva(
  [
    '[color:inherit] [&:not([open])]:contents',
    'open:@container/stage open:box-border open:grid open:content-start open:overflow-auto open:overscroll-contain',
    scrollbarClass,
    'open:[padding:var(--_stage-frame-padding)] open:[gap:var(--_stage-frame-gap)] open:[border-width:var(--_stage-frame-border-width)] open:[border-style:var(--_stage-frame-border-style)] open:[border-color:var(--_stage-frame-border-color)]',
    'open:[background-color:var(--_stage-frame-background-color)] open:[background-image:var(--_stage-frame-background-image)] open:[color:var(--_stage-frame-color,inherit)] open:[corner-shape:var(--_stage-frame-corner-shape)]',
    'open:[box-shadow:var(--rad-surface-overlay-shadow,0_24px_64px_-16px_rgb(0_0_0/0.3))]',
    'backdrop:[background:var(--rad-dialog-backdrop,var(--rad-surface-backdrop,rgb(0_0_0/0.45)))]',
    'forced-colors:backdrop:[background:CanvasText]'
  ],
  {
    variants: {
      expandTo: {
        dialog: [
          'open:m-auto open:[border-radius:var(--_stage-frame-radius)]',
          'open:max-h-[calc(100dvh-2rem)] open:w-[min(calc(100%-2rem),var(--rad-stage-expanded-width,48rem))] open:max-w-none'
        ],
        panel: [
          'open:my-0 open:h-dvh open:max-h-none open:inset-y-0',
          'open:w-[min(100%,var(--rad-stage-panel-width,32rem))] open:max-w-none'
        ]
      },
      side: { start: 'open:ms-0 open:me-auto', end: 'open:ms-auto open:me-0' }
    }
  }
)

/** Button that expands and collapses its Stage; render it inside StageActions. */
export type StageExpandProps = Omit<
  WithoutToggle<ButtonProps>,
  'aria-label' | 'aria-labelledby' | 'aria-expanded' | 'aria-controls' | 'aria-haspopup'
> & {
  /** Accessible name while collapsed. */
  expandLabel: string
  /** Accessible name while expanded. */
  collapseLabel: string
}

const StageContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)

/** Private: Stage renders this host when `expandTo` is set. */
export function ExpandableStage({
  host: { ref, ...host },
  expandTo,
  side,
  open,
  defaultOpen,
  onOpenChange,
  children
}: {
  host: Omit<ComponentProps<'div'>, 'style'> & { style?: ThemeStyle }
  expandTo: 'dialog' | 'panel'
  side: 'start' | 'end'
  open: boolean | undefined
  defaultOpen: boolean | undefined
  onOpenChange: ((open: boolean) => void) | undefined
  children: ReactNode
}) {
  const titleId = useId()
  const {
    value: isOpen,
    request: setOpen,
    controlled
  } = useControllableState({
    name: 'Stage',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })
  const rootRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const transition = useTransitionHost<HTMLDialogElement>('dialog', undefined, false)
  const hostRef = useComposedRefs(dialogRef, transition.ref)
  const rootRefs = useComposedRefs(rootRef, ref)
  // The element that had focus before the browser closed the view on Escape.
  const focused = useRef<Element | null>(null)
  const unmounting = useRef(false)
  // Bumps after the browser closes a view whose controlled `open` value is still true.
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    unmounting.current = false
    const node = dialogRef.current
    return () => {
      unmounting.current = true
      if (node?.open) node.close()
    }
  }, [])

  // `generation` re-runs the sync after the browser closes a view the owner keeps open.
  useEffect(() => {
    const node = dialogRef.current,
      root = rootRef.current
    if (!node || !root || node.open === isOpen) return
    const active = node.ownerDocument.activeElement
    if (isOpen) {
      expand(root, node, titleId)
      node.showModal()
    } else {
      node.close()
      collapse(root, node)
    }
    restoreFocus(node, active)
  }, [isOpen, generation, titleId])

  return (
    <div
      {...host}
      ref={rootRefs}
      className={cn(host.className, 'data-[state=open]:min-h-[var(--_stage-collapsed-size,auto)]!')}
      data-state={isOpen ? 'open' : 'closed'}
    >
      <StageContext.Provider value={{ open: isOpen, setOpen }}>
        {/* Collapsed, the closed dialog wraps ordinary page content: generic keeps it out of the
            accessibility tree as a dialog. Opening drops the role and names the view. */}
        {/* Backdrop clicks are pointer hit tests on the dialog element. Escape uses the cancel event. */}
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <dialog
          ref={hostRef}
          role={isOpen ? undefined : 'generic'}
          className={stageExpandedVariants({
            expandTo,
            side: expandTo === 'panel' ? side : undefined
          })}
          data-slot="stage-expanded"
          data-state={isOpen ? 'open' : 'closed'}
          onCancel={event => {
            if (event.target !== event.currentTarget) return
            focused.current = event.currentTarget.ownerDocument.activeElement
          }}
          onClick={event => {
            if (isBackdropClick(event)) setOpen(false)
          }}
          onClose={event => {
            if (event.target !== event.currentTarget) return
            const node = event.currentTarget
            if (unmounting.current || !isOpen || node.open) return
            if (rootRef.current) collapse(rootRef.current, node)
            restoreFocus(node, focused.current)
            focused.current = null
            setOpen(false)
            if (controlled) setGeneration(current => current + 1)
          }}
        >
          {children}
        </dialog>
      </StageContext.Provider>
    </div>
  )
}

// The open view takes the Stage root's computed frame through custom properties, which the exit
// copy carries outside the Stage.
const sides = (style: CSSStyleDeclaration, name: (side: string) => string) =>
  ['top', 'right', 'bottom', 'left'].map(side => style.getPropertyValue(name(side))).join(' ')
function frame(style: CSSStyleDeclaration): Record<string, string> {
  return {
    padding: sides(style, side => `padding-${side}`),
    gap: `${style.rowGap} ${style.columnGap}`,
    'border-width': sides(style, side => `border-${side}-width`),
    'border-style': sides(style, side => `border-${side}-style`),
    'border-color': sides(style, side => `border-${side}-color`),
    'background-color': style.backgroundColor,
    'background-image': style.backgroundImage,
    color: style.color,
    'corner-shape': style.getPropertyValue('corner-shape') || 'round',
    radius: ['top-left', 'top-right', 'bottom-right', 'bottom-left']
      .map(corner => style.getPropertyValue(`border-${corner}-radius`))
      .join(' ')
  }
}

function expand(root: HTMLElement, node: HTMLDialogElement, titleId: string) {
  // Keep the Stage's place in the page while its parts move to the top layer.
  root.style.setProperty('--_stage-collapsed-size', `${root.offsetHeight}px`)
  for (const [key, value] of Object.entries(frame(getComputedStyle(root))))
    node.style.setProperty(`--_stage-frame-${key}`, value)
  // StageTitle renders without client state, so the view finds it each time it opens.
  const title = Array.from(node.querySelectorAll<HTMLElement>('[data-slot~="stage-title"]')).find(
    candidate => candidate.closest('[data-slot~="stage-expanded"]') === node
  )
  if (!title) return
  if (!title.id) title.id = titleId
  node.setAttribute('aria-labelledby', title.id)
}

function collapse(root: HTMLElement, node: HTMLDialogElement) {
  root.style.removeProperty('--_stage-collapsed-size')
  for (const property of Array.from(node.style))
    if (property.startsWith('--_stage-frame-')) node.style.removeProperty(property)
  node.removeAttribute('aria-labelledby')
}

// Opening and closing a modal dialog moves focus; the element that had it keeps it.
function restoreFocus(node: HTMLDialogElement, active: Element | null) {
  if (active instanceof HTMLElement && active.isConnected && node.contains(active)) {
    active.focus({ preventScroll: true })
  }
}

function isBackdropClick(event: MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return false
  const box = event.currentTarget.getBoundingClientRect()
  if (box.width === 0 && box.height === 0) return false
  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  )
}

export function StageExpand({ expandLabel, collapseLabel, onClick, ...props }: StageExpandProps) {
  const stage = useContext(StageContext)
  if (!stage) throw new Error('StageExpand must render inside a Stage with expandTo.')
  const label = stage.open ? collapseLabel : expandLabel
  requireAccessibleName('StageExpand', { 'aria-label': label })
  return (
    <Button
      {...props}
      aria-label={label}
      aria-haspopup="dialog"
      data-slot={joinIds('button stage-expand', props['data-slot'])}
      data-state={stage.open ? 'open' : 'closed'}
      onClick={composeAction(onClick, () => stage.setOpen(!stage.open))}
    />
  )
}
