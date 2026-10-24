'use client'

import type { ComponentProps, CSSProperties, MouseEvent, ReactNode, Ref } from 'react'
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'

const dialogVariants = cva([
  'box-border text-start antialiased',
  '[&:not([open])]:hidden',
  'open:m-auto open:grid open:overflow-auto open:overscroll-contain',
  'open:max-h-[min(40rem,calc(100dvh-2rem))]',
  'open:w-[min(calc(100%-2rem),var(--dialog-width,32rem))]',
  'open:gap-[var(--dialog-gap,1rem)]',
  'open:p-[var(--dialog-padding,1.5rem)]',
  'rounded-[var(--dialog-radius,var(--button-radius,0.75rem))]',
  '[corner-shape:var(--dialog-corner-shape,var(--button-corner-shape,unset))]',
  '[border-width:var(--dialog-border-width,1px)]',
  '[border-style:var(--dialog-border-style,solid)]',
  '[border-color:var(--dialog-border-color,var(--color-border))]',
  'bg-[var(--dialog-background,var(--color-background))]',
  '[color:var(--dialog-color,var(--color-foreground))]',
  '[box-shadow:var(--dialog-shadow,0_24px_80px_-24px_rgb(0_0_0/0.45))]',
  'backdrop:bg-[var(--dialog-backdrop,oklch(0.21_0.006_286/0.4))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--dialog-focus-color,var(--color-focus))]',
  'focus-visible:[outline-width:var(--dialog-focus-width,2px)]',
  'focus-visible:[outline-offset:var(--dialog-focus-offset,2px)]',
  'focus-visible:[outline-style:var(--dialog-focus-style,solid)]',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
  'forced-colors:backdrop:bg-[CanvasText]'
])

const dialogTitleVariants = cva([
  'm-0 min-w-0 break-words leading-snug',
  '[font-size:var(--dialog-title-size,1.125rem)]',
  '[font-weight:var(--dialog-title-weight,550)]',
  'forced-colors:text-[CanvasText]'
])

const dialogDescriptionVariants = cva([
  'm-0 min-w-0 break-words leading-snug',
  '[color:var(--dialog-description-color,color-mix(in_oklch,var(--color-foreground),transparent_35%))]',
  '[font-size:var(--dialog-description-size,0.8125rem)]',
  'forced-colors:text-[CanvasText]'
])

const dialogActionVariants = cva([
  'inline-flex cursor-pointer items-center justify-center',
  'min-h-[var(--button-height,2.5rem)] px-[var(--button-padding,0.75rem)]',
  '[font-size:var(--button-font-size,0.875rem)] [font-weight:var(--button-font-weight,550)]',
  'rounded-[var(--dialog-radius,var(--button-radius,var(--radius-control)))]',
  '[corner-shape:var(--dialog-corner-shape,var(--button-corner-shape,unset))]',
  '[border-width:var(--button-border-width,1px)]',
  '[border-style:var(--button-border-style,solid)]',
  '[border-color:var(--button-border-color,var(--color-border))]',
  'bg-[var(--color-background)] [color:var(--color-foreground)]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--dialog-focus-color,var(--color-focus))]',
  'focus-visible:[outline-width:var(--dialog-focus-width,2px)]',
  'focus-visible:[outline-offset:var(--dialog-focus-offset,2px)]',
  'focus-visible:[outline-style:var(--dialog-focus-style,solid)]',
  'forced-colors:border-[ButtonText] forced-colors:text-[ButtonText]'
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

export type DialogTriggerProps = Omit<ComponentProps<'button'>, 'children'> & {
  children?: ReactNode
  render?: (props: DialogRenderProps) => ReactNode
}

export type DialogContentProps = Omit<ComponentProps<'dialog'>, 'open'>

export type DialogTitleProps = ComponentProps<'h2'>

export type DialogDescriptionProps = ComponentProps<'p'>

export type DialogCloseProps = Omit<ComponentProps<'button'>, 'children'> & {
  children?: ReactNode
  render?: (props: DialogRenderProps) => ReactNode
}

export type DialogTheme = {
  width?: string
  padding?: string
  gap?: string
  radius?: string
  cornerShape?: string
  background?: string
  color?: string
  borderWidth?: string
  borderStyle?: string
  borderColor?: string
  shadow?: string
  backdrop?: string
  titleSize?: string
  titleWeight?: string | number
  descriptionColor?: string
  descriptionSize?: string
  focusColor?: string
  focusWidth?: string
  focusOffset?: string
  focusStyle?: string
}

const dialogThemeVariables: Record<keyof DialogTheme, string> = {
  width: '--dialog-width',
  padding: '--dialog-padding',
  gap: '--dialog-gap',
  radius: '--dialog-radius',
  cornerShape: '--dialog-corner-shape',
  background: '--dialog-background',
  color: '--dialog-color',
  borderWidth: '--dialog-border-width',
  borderStyle: '--dialog-border-style',
  borderColor: '--dialog-border-color',
  shadow: '--dialog-shadow',
  backdrop: '--dialog-backdrop',
  titleSize: '--dialog-title-size',
  titleWeight: '--dialog-title-weight',
  descriptionColor: '--dialog-description-color',
  descriptionSize: '--dialog-description-size',
  focusColor: '--dialog-focus-color',
  focusWidth: '--dialog-focus-width',
  focusOffset: '--dialog-focus-offset',
  focusStyle: '--dialog-focus-style'
}

const DialogContext = createContext<DialogState | null>(null)

export function dialogTheme(theme: DialogTheme): CSSProperties {
  const style: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) {
      style[dialogThemeVariables[key as keyof DialogTheme]] = value
    }
  }
  return style as CSSProperties
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

export function DialogTrigger({ render, className, children, ...props }: DialogTriggerProps) {
  const dialog = useDialogContext()
  const buttonProps: DialogRenderProps = {
    ...props,
    type: props.type ?? 'button',
    'aria-haspopup': 'dialog',
    'aria-expanded': dialog.open,
    'aria-controls': dialog.contentId,
    className: render ? className : cn(dialogActionVariants(), className),
    'data-slot': 'dialog-trigger',
    onClick: event => {
      props.onClick?.(event)
      if (!event.defaultPrevented) dialog.setOpen(true)
    },
    children
  }
  if (render) return render(buttonProps)
  return <button {...buttonProps} />
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

export function DialogClose({ render, className, children, ...props }: DialogCloseProps) {
  const dialog = useDialogContext()
  const buttonProps: DialogRenderProps = {
    ...props,
    type: props.type ?? 'button',
    className: render ? className : cn(dialogActionVariants(), className),
    'data-slot': 'dialog-close',
    onClick: event => {
      props.onClick?.(event)
      if (!event.defaultPrevented) dialog.setOpen(false)
    },
    children
  }
  if (render) return render(buttonProps)
  return <button {...buttonProps} />
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
