'use client'

import { createContext, useContext, useId } from 'react'
import { Button, type ButtonProps } from './Button.js'
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  useDialog,
  useDialogFamily,
  type DialogProps,
  type DialogState,
  type DialogTriggerProps,
  type DialogRenderProps,
  type DialogContentProps,
  type DialogTitleProps,
  type DialogDescriptionProps
} from './Dialog.js'
import { cn } from './cn.js'
import { composeAction } from './internal/events.js'
import { requireAccessibleName } from './internal/accessibleName.js'
import { joinIds } from './internal/ids.js'
import { drawerPoints, type DrawerSide } from './internal/drawer.js'
import { useControllableState } from './react/useControllableState.js'
import { useDrawerHost } from './motion/host.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type { DrawerSide } from './internal/drawer.js'
export type DrawerProps = DialogProps &
  (
    | { snapPoint: number; defaultSnapPoint?: never }
    | { snapPoint?: undefined; defaultSnapPoint?: number }
  ) & {
    /** Distinct visible fractions of Content's maximum size, in (0, 1]. Zero is dismissal. */
    snapPoints?: readonly number[]
    onSnapPointChange?: (point: number) => void
  }
export type DrawerState = DialogState & {
  snapPoint: number
  snapPoints: readonly number[]
  setSnapPoint(point: number): void
  snapControlled: boolean
}
export type DrawerTriggerProps = DialogTriggerProps
export type DrawerRenderProps = DialogRenderProps
export type DrawerCloseProps = DialogTriggerProps
export type DrawerTitleProps = DialogTitleProps
export type DrawerDescriptionProps = DialogDescriptionProps
export type DrawerContentProps = DialogContentProps & {
  side?: DrawerSide
  /** The native scrolling area inside the actual dialog. */
  parts?: { viewport?: { className?: string; style?: ThemeStyle } }
}
export type DrawerHandleProps = Omit<
  ButtonProps,
  | 'children'
  | 'pressed'
  | 'defaultPressed'
  | 'onPressedChange'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-pressed'
> & {
  'aria-label': string
}
type SnapState = Pick<DrawerState, 'snapPoint' | 'snapPoints' | 'setSnapPoint' | 'snapControlled'>
const SnapContext = createContext<SnapState | null>(null)
const defaults = [0.5, 1] as const

export function useDrawer(): DrawerState | null {
  const dialog = useDialog(),
    snap = useContext(SnapContext),
    family = useDialogFamily()
  return family === 'drawer' && dialog && snap ? { ...dialog, ...snap } : null
}
function useDrawerContext() {
  const state = useDrawer()
  if (!state) throw new Error('Drawer parts must render inside Drawer.')
  return state
}
export function Drawer({
  snapPoints = defaults,
  snapPoint,
  defaultSnapPoint,
  onSnapPointChange,
  ...props
}: DrawerProps) {
  const points = drawerPoints(snapPoints)
  const owner = useControllableState({
    name: 'Drawer snapPoint',
    value: snapPoint,
    defaultValue: defaultSnapPoint,
    initialValue: points.at(-1)!,
    onChange: onSnapPointChange
  })
  if (!points.includes(owner.value))
    throw new TypeError('Drawer snapPoint must be one of its snapPoints.')
  const setSnapPoint = (point: number) => {
    if (!points.includes(point))
      throw new TypeError('Drawer snapPoint must be one of its snapPoints.')
    owner.request(point)
  }
  return (
    <SnapContext.Provider
      value={{
        snapPoint: owner.value,
        snapPoints: points,
        setSnapPoint,
        snapControlled: owner.controlled
      }}
    >
      <DialogRoot
        {...props}
        family="drawer"
      />
    </SnapContext.Provider>
  )
}
export function DrawerTrigger(props: DrawerTriggerProps) {
  useDrawerContext()
  return <DialogTrigger {...props} />
}
export function DrawerClose(props: DrawerCloseProps) {
  useDrawerContext()
  return <DialogClose {...props} />
}
export function DrawerTitle(props: DrawerTitleProps) {
  useDrawerContext()
  return <DialogTitle {...props} />
}
export function DrawerDescription(props: DrawerDescriptionProps) {
  useDrawerContext()
  return <DialogDescription {...props} />
}

const surface = [
  'open:fixed open:m-0 open:block open:overflow-hidden open:p-0 open:gap-0 open:max-h-none open:max-w-none rounded-none',
  'open:inset-auto open:top-0 open:right-0 open:h-dvh open:w-[min(var(--rad-drawer-size,24rem),100dvw)]',
  'data-[physical-side=left]:open:left-0 data-[physical-side=left]:open:right-auto',
  'data-[physical-side=top]:open:left-0 data-[physical-side=top]:open:right-auto data-[physical-side=top]:open:w-dvw data-[physical-side=top]:open:h-[min(var(--rad-drawer-size,24rem),100dvh)]',
  'data-[physical-side=bottom]:open:left-0 data-[physical-side=bottom]:open:top-auto data-[physical-side=bottom]:open:bottom-0 data-[physical-side=bottom]:open:w-dvw data-[physical-side=bottom]:open:h-[min(var(--rad-drawer-size,24rem),100dvh)]',
  '[translate:var(--_rad-drawer-shift,0%)_0]',
  'data-[physical-side=top]:[translate:0_var(--_rad-drawer-shift,0%)] data-[physical-side=bottom]:[translate:0_var(--_rad-drawer-shift,0%)]'
]
const viewport = [
  'absolute inset-y-0 left-0 grid content-start box-border min-w-0 min-h-0 overflow-auto overscroll-contain max-w-full max-h-full',
  'w-[var(--_rad-drawer-visible,100%)]',
  'in-[[data-physical-side=left]]:left-auto in-[[data-physical-side=left]]:right-0',
  'in-[[data-physical-side=top]]:inset-x-0 in-[[data-physical-side=top]]:top-auto in-[[data-physical-side=top]]:bottom-0 in-[[data-physical-side=top]]:w-full in-[[data-physical-side=top]]:h-[var(--_rad-drawer-visible,100%)]',
  'in-[[data-physical-side=bottom]]:inset-x-0 in-[[data-physical-side=bottom]]:bottom-auto in-[[data-physical-side=bottom]]:top-0 in-[[data-physical-side=bottom]]:w-full in-[[data-physical-side=bottom]]:h-[var(--_rad-drawer-visible,100%)]',
  'gap-[var(--rad-dialog-gap,var(--rad-surface-gap,1rem))] p-[var(--rad-dialog-padding,var(--rad-surface-padding,1.5rem))]'
]
export function DrawerContent({
  side = 'end',
  motion = 'inherit',
  parts,
  ref,
  className,
  children,
  ...props
}: DrawerContentProps) {
  const state = useDrawerContext()
  const host = useDrawerHost(ref, {
    side,
    snapPoint: state.snapPoint,
    snapPoints: state.snapPoints,
    motion,
    request: state.setSnapPoint,
    dismiss: () => state.setOpen(false)
  })
  return (
    <DialogContent
      {...props}
      ref={host}
      motion="off"
      className={cn(surface, className)}
      data-side={side}
      data-physical-side={undefined}
      data-dragging={undefined}
    >
      <div
        data-slot="drawer-viewport"
        className={cn(viewport, parts?.viewport?.className)}
        style={parts?.viewport?.style}
      >
        {children}
      </div>
    </DialogContent>
  )
}
/** A real Button: Enter/Space cycles sizes; arrows, Home and End choose a size. */
export function DrawerHandle({ className, onClick, onKeyDown, ...props }: DrawerHandleProps) {
  const state = useDrawerContext(),
    descriptionId = useId()
  const points = state.snapPoints
  requireAccessibleName('DrawerHandle', { 'aria-label': props['aria-label'] })
  const choose = (direction: -1 | 1 | 'first' | 'last') => {
    const target =
      direction === 'first'
        ? points[0]
        : direction === 'last'
          ? points.at(-1)!
          : direction === 1
            ? (points.find(point => point > state.snapPoint) ?? points.at(-1)!)
            : ([...points].reverse().find(point => point < state.snapPoint) ?? 0)
    if (target === 0) state.setOpen(false)
    else state.setSnapPoint(target)
  }
  return (
    <>
      <Button
        {...props}
        type="button"
        motion="off"
        pressed={undefined}
        defaultPressed={undefined}
        onPressedChange={undefined}
        aria-pressed={undefined}
        aria-labelledby={undefined}
        variant={props.variant ?? 'ghost'}
        tone={props.tone ?? 'neutral'}
        className={cn(
          'touch-none select-none justify-self-center cursor-grab active:cursor-grabbing',
          className
        )}
        data-slot={joinIds('drawer-handle', props['data-slot'])}
        aria-describedby={joinIds(descriptionId, props['aria-describedby'])}
        onClick={composeAction(onClick, () =>
          state.setSnapPoint(points.find(point => point > state.snapPoint) ?? points[0])
        )}
        onKeyDown={composeAction(onKeyDown, event => {
          if (
            props.disabled ||
            props.pending ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          )
            return
          const side = event.currentTarget.closest('dialog')?.getAttribute('data-physical-side')
          const increase =
            side === 'top'
              ? 'ArrowDown'
              : side === 'bottom'
                ? 'ArrowUp'
                : side === 'left'
                  ? 'ArrowRight'
                  : 'ArrowLeft'
          const decrease =
            side === 'top'
              ? 'ArrowUp'
              : side === 'bottom'
                ? 'ArrowDown'
                : side === 'left'
                  ? 'ArrowLeft'
                  : 'ArrowRight'
          if (!['Home', 'End', increase, decrease].includes(event.key)) return
          event.preventDefault()
          choose(
            event.key === 'Home'
              ? 'first'
              : event.key === 'End'
                ? 'last'
                : event.key === increase
                  ? 1
                  : -1
          )
        })}
      >
        <span aria-hidden="true">⠿</span>
      </Button>
      <span
        id={descriptionId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {`${Math.round(state.snapPoint * 100)}%`}
      </span>
    </>
  )
}
