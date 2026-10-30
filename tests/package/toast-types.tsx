import { createElement as h, createRef } from 'react'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  useToast,
  type ToastProps,
  type ToastState,
  type ToastActionProps,
  type ToastCloseProps
} from '@cognitap/radiant'
h(
  ToastProvider,
  { duration: 0 },
  h(
    ToastViewport,
    { hotkey: false, ref: createRef<HTMLElement>() },
    h(
      Toast,
      {
        defaultOpen: true,
        tone: 'accent',
        ref: createRef<HTMLDivElement>(),
        style: { '--rad-toast-padding': '1rem' }
      },
      h(ToastTitle, { level: 3 }, 'Saved'),
      h(ToastDescription, null, 'Your draft is safe.'),
      h(
        ToastAction,
        { altText: 'Undo this save.', render: props => <button {...props} /> },
        'Undo'
      ),
      h(ToastClose, null, 'Dismiss')
    )
  )
)
export function Probe() {
  const state: ToastState | null = useToast()
  return state?.visible ? 'visible' : null
}
// @ts-expect-error Toast state has one owner.
const mixed: ToastProps = { open: true, defaultOpen: false }
// @ts-expect-error Visibility is owned by Toast.
const hidden: ToastProps = { hidden: false }
// @ts-expect-error Reachable actions need announcement context.
const action: ToastActionProps = { children: 'Undo' }
// @ts-expect-error An action is not a toggle.
const pressedAction: ToastActionProps = { altText: 'Undo this save.', pressed: true }
// @ts-expect-error Close is not a toggle.
const pressedClose: ToastCloseProps = { defaultPressed: true }
void [mixed, hidden, action, pressedAction, pressedClose]
