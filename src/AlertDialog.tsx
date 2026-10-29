'use client'

import { useCallback } from 'react'
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
  type DialogContentProps,
  type DialogTitleProps,
  type DialogDescriptionProps,
  type DialogTriggerProps,
  type DialogRenderProps
} from './Dialog.js'
import { joinIds } from './internal/ids.js'
import { useComposedRefs } from './react/useComposedRefs.js'

/** Always modal. Backdrop clicks never dismiss an urgent decision. */
export type AlertDialogProps = DialogProps & { modal?: never; closeOnBackdrop?: never }
export type AlertDialogState = DialogState
export type AlertDialogRenderProps = DialogRenderProps
export type AlertDialogTriggerProps = DialogTriggerProps
export type AlertDialogContentProps = Omit<DialogContentProps, 'role' | 'aria-modal'>
export type AlertDialogTitleProps = DialogTitleProps
export type AlertDialogDescriptionProps = DialogDescriptionProps
export type AlertDialogActionProps = DialogTriggerProps
export type AlertDialogCancelProps = DialogTriggerProps

export function useAlertDialog(): AlertDialogState | null {
  const state = useDialog()
  const family = useDialogFamily()
  return family === 'alert-dialog' ? state : null
}

function useAlertDialogContext() {
  const state = useAlertDialog()
  if (!state) throw new Error('AlertDialog parts must render inside AlertDialog.')
  return state
}

export function AlertDialog(props: AlertDialogProps) {
  return (
    <DialogRoot
      {...props}
      family="alert-dialog"
      modal
      closeOnBackdrop={false}
    />
  )
}

export function AlertDialogTrigger(props: AlertDialogTriggerProps) {
  useAlertDialogContext()
  return <DialogTrigger {...props} />
}

export function AlertDialogContent(props: AlertDialogContentProps) {
  useAlertDialogContext()
  return <DialogContent {...props} />
}

export function AlertDialogTitle(props: AlertDialogTitleProps) {
  useAlertDialogContext()
  return <DialogTitle {...props} />
}

export function AlertDialogDescription(props: AlertDialogDescriptionProps) {
  useAlertDialogContext()
  return <DialogDescription {...props} />
}

/** Runs the caller's action, then requests close unless the action prevents default. */
export function AlertDialogAction(props: AlertDialogActionProps) {
  useAlertDialogContext()
  return (
    <DialogClose
      {...props}
      data-slot={joinIds('alert-dialog-action', props['data-slot'])}
    />
  )
}

/** Focuses the safe choice on every native open, including when it follows the action. */
export function AlertDialogCancel({ autoFocus = true, ref, ...props }: AlertDialogCancelProps) {
  useAlertDialogContext()
  const autofocusRef = useCallback(
    (node: HTMLButtonElement | null) => {
      // React's autoFocus focuses on mount; the native dialog also needs the attribute on reopen.
      if (node) node.autofocus = autoFocus
    },
    [autoFocus]
  )
  const hostRef = useComposedRefs(autofocusRef, ref)
  return (
    <DialogClose
      {...props}
      ref={hostRef}
      // Cancel is the safe initial target inside a native modal decision.
      // oxlint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      data-slot={joinIds('alert-dialog-cancel', props['data-slot'])}
    />
  )
}
