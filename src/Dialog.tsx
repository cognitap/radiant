'use client'

import type { ComponentProps, CSSProperties, MouseEvent, ReactNode, Ref } from 'react'
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { cva } from 'class-variance-authority'
import { Button, type ButtonProps } from './Button.js'
import { cn } from './cn.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'

const dialogVariants = cva([
  '[font-family:var(--rad-typography-family,system-ui,sans-serif)] [letter-spacing:var(--rad-typography-letter-spacing,-0.011em)] [font-size:var(--rad-typography-body-size,0.875rem)] [font-weight:var(--rad-typography-body-weight,400)]',
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
  'bg-[var(--rad-dialog-background,var(--rad-color-surface,oklch(1_0_0)))]',
  '[backdrop-filter:var(--rad-dialog-backdrop-filter,none)]',
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
  'm-0 min-w-0 break-words leading-snug',
  '[font-size:var(--rad-dialog-title-size,var(--rad-typography-heading-size,1.125rem))]',
  '[font-weight:var(--rad-dialog-title-weight,var(--rad-typography-heading-weight,600))]',
  'forced-colors:text-[CanvasText]'
])

const dialogDescriptionVariants = cva([
  'm-0 min-w-0 break-words leading-snug',
  '[color:var(--rad-dialog-description-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
  '[font-size:var(--rad-dialog-description-size,var(--rad-typography-small-size,0.8125rem))]',
  'forced-colors:text-[CanvasText]'
])

export type DialogProps = {
  open?: boolean
  defaultOpen?: boolean
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

export type DialogRenderProps = ComponentProps<'button'> & {
  'data-slot'?: string
}

export type DialogTriggerProps = ButtonProps & {
  /** Explicit native replacement; Button presentation options configure the default host. */
  render?: (props: DialogRenderProps) => ReactNode
}

export type DialogContentProps = Omit<ComponentProps<'dialog'>, 'open'>

export type DialogTitleProps = ComponentProps<'h2'>

export type DialogDescriptionProps = ComponentProps<'p'>

export type DialogCloseProps = DialogTriggerProps

export type DialogTheme = NonNullable<ThemeComponentOverrides['dialog']>

const DialogContext = createContext<DialogState | null>(null)

export function dialogTheme(theme: DialogTheme): CSSProperties {
  return flattenComponents({ dialog: theme }) as CSSProperties
}

export function useDialog(): DialogState | null {
  return useContext(DialogContext)
}

function useDialogContext() {
  const dialog = useDialog()
  if (!dialog) throw new Error('Dialog parts must render inside Dialog.')
  return dialog
}

export function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  children
}: DialogProps) {
  const contentId = useId()
  const titleId = useId()
  const descriptionId = useId()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const controlled = open !== undefined
  const isOpen = controlled ? open : uncontrolledOpen
  const setOpen = (next: boolean) => {
    onOpenChange?.(next)
    if (!controlled) setUncontrolledOpen(next)
  }

  return (
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
  )
}

function DialogAction({
  action,
  render,
  variant,
  size,
  radius,
  iconOnly,
  fullWidth,
  pending,
  ...props
}: DialogTriggerProps & { action: 'open' | 'close' }) {
  const dialog = useDialogContext()
  const buttonProps: DialogRenderProps = {
    ...props,
    type: props.type ?? 'button',
    ...(action === 'open'
      ? {
          'aria-haspopup': 'dialog',
          'aria-expanded': dialog.open,
          'aria-controls': dialog.contentId
        }
      : {}),
    'aria-busy': pending || props['aria-busy'],
    'data-slot': action === 'open' ? 'button dialog-trigger' : 'button dialog-close',
    onClick: event => {
      if (pending || event.currentTarget.matches(':disabled')) {
        event.preventDefault()
        return
      }
      props.onClick?.(event)
      if (!event.defaultPrevented) dialog.setOpen(action === 'open')
    }
  }
  if (render) return render(buttonProps)
  return (
    <Button
      {...buttonProps}
      variant={variant}
      size={size}
      radius={radius}
      iconOnly={iconOnly}
      fullWidth={fullWidth}
      pending={pending}
    />
  )
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
  className,
  onClick,
  onCancel,
  onClose,
  ref,
  ...props
}: DialogContentProps) {
  const dialog = useDialogContext()
  const nodeRef = useRef<HTMLDialogElement>(null)
  const unmounting = useRef(false)
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
      ref={node => {
        nodeRef.current = node
        assignRef(ref, node)
      }}
      aria-describedby={props['aria-describedby'] ?? dialog.descriptionId}
      aria-labelledby={props['aria-label'] ? props['aria-labelledby'] : dialog.titleId}
      className={cn(dialogVariants(), className)}
      data-slot="dialog"
      id={dialog.contentId}
      onCancel={event => {
        // cancel and close bubble, so a nested dialog must not dismiss its parent.
        if (event.target !== event.currentTarget) return
        onCancel?.(event)
        if (!dialog.closeOnEscape) event.preventDefault()
      }}
      onClick={event => {
        onClick?.(event)
        if (event.defaultPrevented || !dialog.modal || !dialog.closeOnBackdrop) return
        if (!isBackdropClick(event)) return
        dialog.setOpen(false)
      }}
      onClose={event => {
        if (event.target !== event.currentTarget) return
        onClose?.(event)
        if (unmounting.current || !dialog.open) return
        dialog.setOpen(false)
        if (dialog.controlled) setGeneration(current => current + 1)
      }}
    />
  )
}

export function DialogTitle({ className, children, ...props }: DialogTitleProps) {
  const dialog = useDialogContext()
  return (
    <h2
      {...props}
      className={cn(dialogTitleVariants(), className)}
      data-slot="dialog-title"
      id={dialog.titleId}
    >
      {children}
    </h2>
  )
}

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  const dialog = useDialogContext()
  return (
    <p
      {...props}
      className={cn(dialogDescriptionVariants(), className)}
      data-slot="dialog-description"
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

function assignRef(ref: Ref<HTMLDialogElement> | undefined, node: HTMLDialogElement | null) {
  if (typeof ref === 'function') {
    ref(node)
    return
  }
  if (ref) ref.current = node
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
  // jsdom does not implement the dialog methods. The attribute still marks it open.
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
