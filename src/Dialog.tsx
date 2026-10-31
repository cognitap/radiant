'use client'

import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { cva } from 'class-variance-authority'
import { Button, type ButtonProps, type ButtonRenderProps } from './Button.js'
import { callerOwnsPress } from './motion/pressPolicy.js'
import { useTransitionHost } from './motion/host.js'
import { cn } from './cn.js'
import { composeAction } from './internal/events.js'
import { joinIds } from './internal/ids.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useControllableState } from './react/useControllableState.js'
import type { StateOwner } from './react/useNativeOwner.js'
import type { WithoutToggle } from './internal/types.js'
import type { ThemeStyle } from './themes/defineTheme.js'

const colorMotionClass =
  'transition-colors duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none'

const dialogVariants = cva([
  colorMotionClass,
  'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] font-[number:var(--rad-typography-roles-ui-body-weight,400)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
  'box-border text-start antialiased',
  '[&:not([open])]:hidden',
  'open:m-auto open:grid open:overflow-auto open:overscroll-contain',
  'open:max-h-[min(40rem,calc(100dvh-2rem))]',
  'open:w-[min(calc(100%-2rem),var(--rad-dialog-width,32rem))]',
  'open:gap-[var(--rad-dialog-gap,var(--rad-surface-gap,1rem))]',
  'open:p-[var(--rad-dialog-padding,var(--rad-surface-padding,1.5rem))]',
  'rounded-[var(--rad-dialog-radius,var(--rad-surface-radius,0.75rem))]',
  '[corner-shape:var(--rad-dialog-corner-shape,var(--rad-surface-corner-shape,round))]',
  '[border-width:var(--rad-dialog-border-width,var(--rad-surface-border-width,1px))]',
  '[border-style:var(--rad-dialog-border-style,var(--rad-surface-border-style,solid))]',
  '[border-color:var(--rad-dialog-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
  'bg-[var(--rad-dialog-background,var(--rad-surface-overlay-background,var(--rad-color-surface,oklch(1_0_0))))]',
  '[backdrop-filter:var(--rad-dialog-backdrop-filter,var(--rad-surface-backdrop-filter,none))]',
  '[color:var(--rad-dialog-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
  '[box-shadow:var(--rad-dialog-shadow,var(--rad-surface-overlay-shadow,0_24px_64px_-16px_rgb(0_0_0/0.3)))]',
  'backdrop:[background:var(--rad-dialog-backdrop,var(--rad-surface-backdrop,rgb(0_0_0/0.45)))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--rad-dialog-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'focus-visible:[outline-width:var(--rad-dialog-focus-width,var(--rad-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--rad-dialog-focus-offset,var(--rad-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--rad-dialog-focus-style,var(--rad-focus-style,solid))]',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
  'forced-colors:backdrop:[background:CanvasText]'
])

const dialogTitleVariants = cva([
  colorMotionClass,
  'm-0 min-w-0 break-words',
  'font-[family-name:var(--rad-typography-roles-ui-title-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-title-letter-spacing,-0.015em)]',
  'text-[length:var(--rad-dialog-title-size,var(--rad-typography-roles-ui-title-size,1.125rem))] leading-[var(--rad-typography-roles-ui-title-line-height,1.3)]',
  'font-[number:var(--rad-dialog-title-weight,var(--rad-typography-roles-ui-title-weight,600))]',
  'forced-colors:text-[CanvasText]'
])

const dialogDescriptionVariants = cva([
  colorMotionClass,
  'm-0 min-w-0 break-words',
  '[color:var(--rad-dialog-description-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
  'font-[family-name:var(--rad-typography-roles-ui-supporting-family,system-ui,sans-serif)] font-[number:var(--rad-typography-roles-ui-supporting-weight,400)] tracking-[var(--rad-typography-roles-ui-supporting-letter-spacing,0em)]',
  'text-[length:var(--rad-dialog-description-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))] leading-[var(--rad-typography-roles-ui-supporting-line-height,1.5)]',
  'forced-colors:text-[CanvasText]'
])

export type DialogProps = StateOwner<'open', boolean> & {
  /** A change request. The controlled owner may decline it; prop syncs do not notify. */
  onOpenChange?: (open: boolean) => void
  /** `true` calls `showModal()`. `false` calls `show()` and leaves the rest of the page active. */
  modal?: boolean
  /** Modal only. A backdrop click is a click on the dialog whose point lies outside its border box. */
  closeOnBackdrop?: boolean
  /** Modal only. The browser closes a modal dialog on Escape unless the cancel event is cancelled. */
  closeOnEscape?: boolean
  children?: ReactNode
}

export type DialogState = {
  open: boolean
  setOpen: (open: boolean) => void
  contentId: string
  titleId: string
  descriptionId: string
  modal: boolean
  closeOnBackdrop: boolean
  closeOnEscape: boolean
  controlled: boolean
}

export type DialogRenderProps = ButtonRenderProps

/** Button props/render/ref contract, with protected dialog relationships and no toggle state. */
export type DialogTriggerProps = WithoutToggle<ButtonProps>

export type DialogContentProps = Omit<ComponentProps<'dialog'>, 'open' | 'style'> & {
  style?: ThemeStyle
  /** Opt-in MotionProvider presentation; native close and focus never wait for an exit. */
  motion?: 'inherit' | 'off'
}

export type DialogTitleProps = Omit<ComponentProps<'h2'>, 'style'> & { style?: ThemeStyle }

export type DialogDescriptionProps = Omit<ComponentProps<'p'>, 'style'> & { style?: ThemeStyle }

export type DialogCloseProps = DialogTriggerProps

const DialogContext = createContext<DialogState | null>(null)
const DialogFamilyContext = createContext<'dialog' | 'alert-dialog' | 'drawer' | 'command'>(
  'dialog'
)

/** Private composition seam for specialized Dialog families; not exported from the package. */
export function useDialogFamily() {
  return useContext(DialogFamilyContext)
}

export function useDialog(): DialogState | null {
  return useContext(DialogContext)
}

function useDialogContext() {
  const dialog = useDialog()
  if (!dialog) throw new Error('Dialog parts must render inside Dialog.')
  return dialog
}

export function Dialog(props: DialogProps) {
  return (
    <DialogRoot
      {...props}
      family={undefined}
    />
  )
}

/** Private shared owner: composed families keep the same native lifecycle. */
export function DialogRoot({
  open,
  defaultOpen,
  onOpenChange,
  modal = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
  family = 'dialog'
}: DialogProps & { family?: 'dialog' | 'alert-dialog' | 'drawer' | 'command' }) {
  const contentId = useId()
  const titleId = useId()
  const descriptionId = useId()
  const {
    value: isOpen,
    request: setOpen,
    controlled
  } = useControllableState({
    name: 'Dialog',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })

  return (
    <DialogFamilyContext.Provider value={family}>
      <DialogContext.Provider
        value={{
          open: isOpen,
          setOpen,
          contentId,
          titleId,
          descriptionId,
          modal,
          closeOnBackdrop,
          closeOnEscape,
          controlled
        }}
      >
        {children}
      </DialogContext.Provider>
    </DialogFamilyContext.Provider>
  )
}

function DialogAction({ action, ...props }: DialogTriggerProps & { action: 'open' | 'close' }) {
  const dialog = useDialogContext()
  const family = useDialogFamily()
  const slot = action === 'open' ? 'button dialog-trigger' : 'button dialog-close'
  const buttonProps: ButtonProps = {
    ...props,
    pressed: undefined,
    defaultPressed: undefined,
    onPressedChange: undefined,
    'aria-pressed': undefined,
    ...(action === 'open'
      ? {
          'aria-haspopup': 'dialog',
          'aria-expanded': dialog.open,
          'aria-controls': dialog.contentId
        }
      : {}),
    'data-slot': joinIds(
      slot,
      family !== 'dialog' ? `${family}-${action === 'open' ? 'trigger' : 'close'}` : undefined,
      props['data-slot']
    ),
    onClick: composeAction(props.onClick, () => dialog.setOpen(action === 'open'))
  }
  return <Button {...buttonProps} />
}

export function DialogTrigger(props: DialogTriggerProps) {
  return (
    <DialogAction
      {...props}
      action="open"
    />
  )
}

export function DialogContent({
  motion = 'inherit',
  className,
  onClick,
  onCancel,
  onClose,
  ref,
  ...props
}: DialogContentProps) {
  const dialog = useDialogContext()
  const family = useDialogFamily()
  const nodeRef = useRef<HTMLDialogElement>(null)
  const transition = useTransitionHost<HTMLDialogElement>(
    'dialog',
    ref,
    motion === 'off' || callerOwnsPress(props.style, className)
  )
  const hostRef = useComposedRefs(nodeRef, transition.active ? transition.ref : ref)
  const unmounting = useRef(false)
  const previousModal = useRef(dialog.modal)
  // Bumps after the browser closes a dialog whose controlled `open` value is still true.
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    unmounting.current = false
    const node = nodeRef.current
    return () => {
      unmounting.current = true
      if (node) closeDialog(node)
    }
  }, [])

  useEffect(() => {
    const node = nodeRef.current
    if (!node || generation < 0) return
    if (previousModal.current !== dialog.modal) {
      // The platform cannot change an already-open dialog's modal mode in place.
      closeDialog(node)
      previousModal.current = dialog.modal
    }
    if (dialog.open) {
      if (!dialogIsOpen(node)) openDialog(node, dialog.modal)
      return
    }
    if (dialogIsOpen(node)) closeDialog(node)
  }, [dialog.modal, dialog.open, generation])

  return (
    // Backdrop clicks are pointer hit tests on the dialog element. Escape uses the cancel event.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      {...props}
      open={undefined}
      ref={hostRef}
      role={family === 'alert-dialog' ? 'alertdialog' : props.role}
      aria-modal={family === 'alert-dialog' ? true : props['aria-modal']}
      aria-describedby={joinIds(dialog.descriptionId, props['aria-describedby'])}
      aria-labelledby={props['aria-label'] ? props['aria-labelledby'] : dialog.titleId}
      className={cn(dialogVariants(), className)}
      data-slot={family === 'dialog' ? 'dialog' : `dialog ${family}`}
      data-state={dialog.open ? 'open' : 'closed'}
      id={dialog.contentId}
      onCancel={event => {
        // cancel and close bubble, so a nested dialog must not dismiss its parent.
        if (event.target !== event.currentTarget) return
        onCancel?.(event)
        if (!dialog.closeOnEscape) event.preventDefault()
      }}
      onClick={composeAction(onClick, event => {
        if (!dialog.modal || !dialog.closeOnBackdrop) return
        if (!isBackdropClick(event)) return
        dialog.setOpen(false)
      })}
      onClose={event => {
        if (event.target !== event.currentTarget) return
        onClose?.(event)
        // close() queues its event. StrictMode cleanup or a consumer can reopen
        // this same native dialog before that event arrives.
        if (unmounting.current || !dialog.open || dialogIsOpen(event.currentTarget)) return
        dialog.setOpen(false)
        if (dialog.controlled) setGeneration(current => current + 1)
      }}
    />
  )
}

export function DialogTitle({ className, children, ...props }: DialogTitleProps) {
  const dialog = useDialogContext()
  const family = useDialogFamily()
  return (
    <h2
      {...props}
      className={cn(dialogTitleVariants(), className)}
      data-slot={family === 'dialog' ? 'dialog-title' : `dialog-title ${family}-title`}
      id={dialog.titleId}
    >
      {children}
    </h2>
  )
}

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  const dialog = useDialogContext()
  const family = useDialogFamily()
  return (
    <p
      {...props}
      className={cn(dialogDescriptionVariants(), className)}
      data-slot={
        family === 'dialog' ? 'dialog-description' : `dialog-description ${family}-description`
      }
      id={dialog.descriptionId}
    />
  )
}

export function DialogClose(props: DialogCloseProps) {
  return (
    <DialogAction
      {...props}
      action="close"
    />
  )
}

function dialogIsOpen(node: HTMLDialogElement) {
  return node.hasAttribute('open')
}

function openDialog(node: HTMLDialogElement, modal: boolean) {
  if (dialogIsOpen(node)) return
  if (modal && typeof node.showModal === 'function') {
    node.showModal()
    return
  }
  if (!modal && typeof node.show === 'function') {
    node.show()
    return
  }
  // Without dialog methods, the attribute still marks it open.
  node.setAttribute('open', '')
}

function closeDialog(node: HTMLDialogElement) {
  if (!dialogIsOpen(node)) return
  if (typeof node.close === 'function') {
    node.close()
    return
  }
  node.removeAttribute('open')
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
