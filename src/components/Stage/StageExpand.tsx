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

// Collapsed, the native dialog has no box and its children lay out as parts of the Stage root.
// Open, it is the Stage frame in the top layer: it inherits the root's frame styles and its parts
// query its own width.
const stageExpandedVariants = cva(
  [
    '[&:not([open])]:contents',
    'open:@container/stage open:box-border open:grid open:content-start open:overflow-auto open:overscroll-contain',
    scrollbarClass,
    'open:[gap:inherit] open:[padding:inherit] open:[border:inherit] open:[background:inherit] open:[color:inherit] open:[corner-shape:inherit]',
    'open:[box-shadow:var(--rad-surface-overlay-shadow,0_24px_64px_-16px_rgb(0_0_0/0.3))]',
    'backdrop:[background:var(--rad-dialog-backdrop,var(--rad-surface-backdrop,rgb(0_0_0/0.45)))]',
    'forced-colors:backdrop:[background:CanvasText]'
  ],
  {
    variants: {
      expandTo: {
        dialog: [
          'open:m-auto open:[border-radius:inherit]',
          'open:max-h-[calc(100dvh-2rem)] open:w-[min(calc(100%-2rem),var(--rad-stage-expanded-width,48rem))] open:max-w-none'
        ],
        panel: [
          'open:my-0 open:h-dvh open:max-h-none open:rounded-none open:inset-y-0',
          'open:w-[min(100%,var(--rad-stage-expanded-width,32rem))] open:max-w-none'
        ]
      },
      side: { start: 'open:ms-0 open:me-auto', end: 'open:ms-auto open:me-0' }
    }
  }
)

/** Button that expands and collapses its Stage; render it inside StageActions. */
export type StageExpandProps = Omit<
  WithoutToggle<ButtonProps>,
  'aria-label' | 'aria-labelledby' | 'aria-expanded' | 'aria-controls'
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

  // StageTitle renders on the server without client state, so the view finds it after each commit.
  useEffect(() => {
    const node = dialogRef.current
    const title = Array.from(
      node?.querySelectorAll<HTMLElement>('[data-slot~="stage-title"]') ?? []
    ).find(candidate => candidate.closest('[data-slot~="stage-expanded"]') === node)
    if (!node || !title) return
    if (!title.id) title.id = titleId
    node.setAttribute('aria-labelledby', title.id)
  })

  useEffect(() => {
    const node = dialogRef.current,
      root = rootRef.current
    if (!node || !root || generation < 0 || node.open === isOpen) return
    const active = node.ownerDocument.activeElement
    if (isOpen) {
      // Keep the Stage's place in the page while its parts move to the top layer.
      root.style.setProperty('--_stage-collapsed-size', `${root.getBoundingClientRect().height}px`)
      node.showModal()
    } else {
      node.close()
      root.style.removeProperty('--_stage-collapsed-size')
    }
    restoreFocus(node, active)
  }, [isOpen, generation])

  return (
    <div
      {...host}
      ref={rootRefs}
      className={cn('min-h-[var(--_stage-collapsed-size,auto)]', host.className)}
      data-state={isOpen ? 'open' : 'closed'}
    >
      <StageContext.Provider value={{ open: isOpen, setOpen }}>
        {/* Backdrop clicks are pointer hit tests on the dialog element. Escape uses the cancel event. */}
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <dialog
          ref={hostRef}
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
            rootRef.current?.style.removeProperty('--_stage-collapsed-size')
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
      data-slot={joinIds('button stage-expand', props['data-slot'])}
      data-state={stage.open ? 'open' : 'closed'}
      onClick={composeAction(onClick, () => stage.setOpen(!stage.open))}
    />
  )
}
