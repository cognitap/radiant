import { createElement as h, createRef } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  useAlertDialog,
  type AlertDialogProps,
  type AlertDialogContentProps,
  type AlertDialogState,
  type AlertDialogRenderProps,
  type AlertDialogActionProps,
  type AlertDialogCancelProps,
  type AlertDialogTriggerProps,
  type AlertDialogTitleProps,
  type AlertDialogDescriptionProps
} from '@cognitap/radiant'

const render = (props: AlertDialogRenderProps) => <button {...props} />
const root: AlertDialogProps = { open: false, onOpenChange: () => {}, closeOnEscape: false }
const content: AlertDialogContentProps = {
  ref: createRef<HTMLDialogElement>(),
  motion: 'off',
  style: { '--rad-dialog-width': '24rem' }
}
const trigger: AlertDialogTriggerProps = { render, ref: createRef<HTMLButtonElement>() }
const action: AlertDialogActionProps = {
  render,
  tone: 'danger',
  pending: true,
  onClick: e => e.preventDefault()
}
const cancel: AlertDialogCancelProps = { render, autoFocus: false }
const title: AlertDialogTitleProps = { ref: createRef<HTMLHeadingElement>() }
const description: AlertDialogDescriptionProps = { ref: createRef<HTMLParagraphElement>() }
h(
  AlertDialog,
  root,
  h(AlertDialogTrigger, trigger),
  h(
    AlertDialogContent,
    content,
    h(AlertDialogTitle, title, 'Delete?'),
    h(AlertDialogDescription, description, 'This cannot be undone.'),
    h(AlertDialogAction, action, 'Delete'),
    h(AlertDialogCancel, cancel, 'Keep')
  )
)
export function StateReader() {
  const state: AlertDialogState | null = useAlertDialog()
  return state?.open ? 'Open' : null
}

// @ts-expect-error AlertDialog has one open-state owner.
const mixed: AlertDialogProps = { open: false, defaultOpen: true }
// @ts-expect-error AlertDialog always uses native modal behavior.
const nonmodal: AlertDialogProps = { modal: false }
// @ts-expect-error AlertDialog cannot dismiss a decision from its backdrop.
const backdrop: AlertDialogProps = { closeOnBackdrop: true }
// @ts-expect-error The state root has no DOM host.
const styledRoot: AlertDialogProps = { className: 'p-4' }
// @ts-expect-error Content state is owned by the root.
const nativeOpen: AlertDialogContentProps = { open: true }
// @ts-expect-error AlertDialog protects its role.
const role: AlertDialogContentProps = { role: 'dialog' }
// @ts-expect-error Modal semantics cannot be overridden.
const ariaModal: AlertDialogContentProps = { 'aria-modal': false }
// @ts-expect-error Content refs target the native dialog.
const wrongRef: AlertDialogContentProps = { ref: createRef<HTMLDivElement>() }
// @ts-expect-error Actions share Button's closed presentation vocabulary.
const wrongVariant: AlertDialogActionProps = { variant: 'link' }
void [mixed, nonmodal, backdrop, styledRoot, nativeOpen, role, ariaModal, wrongRef, wrongVariant]

// @ts-expect-error A trigger that opens a dialog is not a toggle.
export const pressedAlertTrigger: AlertDialogTriggerProps = { defaultPressed: true }
// @ts-expect-error Dialog actions are not toggles.
export const pressedAlertAction: AlertDialogActionProps = { pressed: true }
// @ts-expect-error Dialog actions are not toggles.
export const pressedAlertCancel: AlertDialogCancelProps = { 'aria-pressed': true }
