'use client'

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- A non-modal dialog uses the native Popover top layer. */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject
} from 'react'
import { cn } from 'cn'
import { composeAction } from '../../internal/events.js'
import { joinIds } from '../../internal/ids.js'
import type { PartStyle } from '../../presentation.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { StateOwner } from '../../react/useNativeOwner.js'
import { Button } from '../Button/Button.js'
import {
  Popover,
  PopoverContentRoot,
  usePopoverContext,
  type PopoverAlign,
  type PopoverSide,
  type PopoverTriggerProps
} from '../Popover/Popover.js'

export type TourStep = {
  /** A CSS selector within this Tour. */
  target: string
  title: string
  description?: ReactNode
  side?: PopoverSide
  align?: PopoverAlign
}

export type TourProps = Omit<ComponentProps<'div'>, 'style'> &
  StateOwner<'open', boolean> & {
    steps: readonly TourStep[]
    onOpenChange?: (open: boolean) => void
    backLabel?: string
    nextLabel?: string
    skipLabel?: string
    doneLabel?: string
    formatProgress?: (step: number, total: number) => string
    motion?: 'inherit' | 'off'
    style?: PartStyle['style']
    parts?: { popup?: PartStyle }
    'data-slot'?: string
  }
export type TourTriggerProps = PopoverTriggerProps

const TourContext = createContext<{
  open: boolean
  launch: (opener: HTMLElement) => void
} | null>(null)

type ReadyStep = { index: number; node: HTMLElement }

export function Tour({
  steps,
  open,
  defaultOpen,
  onOpenChange,
  backLabel = 'Back',
  nextLabel = 'Next',
  skipLabel = 'Skip tour',
  doneLabel = 'Done',
  formatProgress = (step, total) => `Step ${step} of ${total}`,
  motion,
  parts,
  className,
  children,
  ref,
  ...props
}: TourProps) {
  const state = useControllableState({
    name: 'Tour',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })
  const host = useRef<HTMLDivElement>(null)
  const hostRef = useComposedRefs(host, ref)
  const opener = useRef<HTMLElement | null>(null)
  const [requested, setRequested] = useState(0)
  const [ready, setReady] = useState<ReadyStep[] | null>(null)
  const notifiedEmpty = useRef(false)
  const isOpen = state.value
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen)
    if (isOpen) {
      setReady(null)
      setRequested(0)
    }
  }

  useLayoutEffect(() => {
    if (!isOpen) {
      opener.current = null
      notifiedEmpty.current = false
      return
    }
    const root = host.current!
    const doc = root.ownerDocument
    const win = doc.defaultView!
    if (!opener.current && doc.activeElement instanceof win.HTMLElement) {
      opener.current = doc.activeElement
    }
    let frame = 0
    const refresh = () => {
      frame = 0
      const matches = steps.flatMap(({ target }, index) => {
        let node: Element | null
        try {
          node = root.querySelector(target)
        } catch {
          return []
        }
        return node instanceof win.HTMLElement &&
          node.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true })
          ? [{ index, node }]
          : []
      })
      setReady(current =>
        current?.length === matches.length &&
        current.every(
          (entry, index) =>
            entry.index === matches[index].index && entry.node === matches[index].node
        )
          ? current
          : matches
      )
    }
    const schedule = () => {
      if (!frame) frame = win.requestAnimationFrame(refresh)
    }
    const observer = new win.MutationObserver(schedule)
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'style', 'hidden', 'open', 'data-state']
    })
    root.addEventListener('toggle', schedule, true)
    win.addEventListener('resize', schedule)
    schedule()
    return () => {
      observer.disconnect()
      root.removeEventListener('toggle', schedule, true)
      win.removeEventListener('resize', schedule)
      win.cancelAnimationFrame(frame)
    }
  }, [isOpen, steps])

  const firstAvailable = ready?.findIndex(item => item.index >= requested) ?? -1
  const position = firstAvailable === -1 ? (ready?.length ?? 0) - 1 : firstAvailable
  const current = ready?.[position]
  const step = current && steps[current.index]
  const empty = ready?.length === 0
  useLayoutEffect(() => {
    if (isOpen && empty && !notifiedEmpty.current) {
      notifiedEmpty.current = true
      state.request(false)
    } else if (!empty) notifiedEmpty.current = false
  })

  return (
    <TourContext.Provider
      value={{
        open: isOpen && !!step,
        launch: node => {
          if (isOpen) return
          opener.current = node
          state.request(true)
        }
      }}
    >
      <Popover
        open={isOpen && !!step}
        onOpenChange={state.request}
      >
        <div
          {...props}
          ref={hostRef}
          data-slot={joinIds('tour', props['data-slot'])}
          className={cn(
            'min-w-0 [&_[data-rad-tour-target]]:[outline:2px_solid_var(--rad-color-focus)] [&_[data-rad-tour-target]]:outline-offset-4 forced-colors:[&_[data-rad-tour-target]]:outline-[Highlight]',
            className
          )}
        >
          {children}
          <TourSurface
            anchor={isOpen && step ? current.node : null}
            step={step}
            stepIndex={current?.index}
            opener={opener}
            motion={motion}
            part={parts?.popup}
          >
            {step && (
              <>
                <p
                  data-slot="tour-progress"
                  className="text-xs [color:var(--rad-color-muted-foreground)]"
                >
                  {formatProgress(position + 1, ready!.length)}
                </p>
                <p className="text-sm font-semibold">{step.title}</p>
                {step.description && <div className="text-sm">{step.description}</div>}
                <div
                  className="flex flex-wrap gap-2"
                  data-slot="tour-actions"
                >
                  <Button
                    controlSize="small"
                    variant="ghost"
                    onClick={() => state.request(false)}
                  >
                    {skipLabel}
                  </Button>
                  {position > 0 && (
                    <Button
                      controlSize="small"
                      variant="outline"
                      onClick={() => setRequested(ready![position - 1].index)}
                    >
                      {backLabel}
                    </Button>
                  )}
                  <Button
                    controlSize="small"
                    onClick={() => {
                      const next = ready![position + 1]
                      if (next) setRequested(next.index)
                      else state.request(false)
                    }}
                  >
                    {position === ready!.length - 1 ? doneLabel : nextLabel}
                  </Button>
                </div>
              </>
            )}
          </TourSurface>
        </div>
      </Popover>
    </TourContext.Provider>
  )
}

function TourSurface({
  anchor,
  step,
  stepIndex,
  opener,
  motion,
  part,
  children
}: {
  anchor: HTMLElement | null
  step?: TourStep
  stepIndex?: number
  opener: RefObject<HTMLElement | null>
  motion?: TourProps['motion']
  part?: PartStyle
  children: ReactNode
}) {
  const { setTrigger } = usePopoverContext()
  const popup = useRef<HTMLDivElement>(null)
  const description = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    setTrigger(anchor)
    if (!anchor) return
    anchor.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
    anchor.setAttribute('data-rad-tour-target', '')
    return () => anchor.removeAttribute('data-rad-tour-target')
  }, [anchor, setTrigger])
  useLayoutEffect(() => {
    if (anchor && popup.current?.matches(':popover-open')) {
      description.current?.focus({ preventScroll: true })
    }
  }, [anchor, stepIndex])

  return (
    <PopoverContentRoot
      ref={popup}
      data-slot="tour-popup"
      role="dialog"
      aria-label={step?.title}
      side={step?.side}
      align={step?.align}
      motion={motion}
      initialFocusRef={description}
      returnFocusRef={opener}
      className={cn('w-max max-w-[min(19rem,var(--_rad-popover-max-width))]', part?.className)}
      style={part?.style}
    >
      <div
        ref={description}
        tabIndex={-1}
        className="grid gap-2 focus:outline-none"
      >
        {children}
      </div>
    </PopoverContentRoot>
  )
}

export function TourTrigger({ onClick, ...props }: TourTriggerProps) {
  const tour = useContext(TourContext)
  const { contentId } = usePopoverContext()
  if (!tour) throw new Error('TourTrigger must render inside Tour.')
  return (
    <Button
      {...props}
      type="button"
      pressed={undefined}
      defaultPressed={undefined}
      onPressedChange={undefined}
      aria-pressed={undefined}
      popoverTarget={undefined}
      popoverTargetAction={undefined}
      data-slot={joinIds('tour-trigger', props['data-slot'])}
      aria-controls={contentId}
      aria-expanded={tour.open}
      aria-haspopup="dialog"
      onClick={composeAction(onClick, event => tour.launch(event.currentTarget))}
    />
  )
}
