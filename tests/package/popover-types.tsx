import { createElement as h, createRef } from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverPortal,
  usePopover,
  defineTheme,
  type PopoverProps,
  type PopoverState,
  type PopoverContentProps,
  type PopoverRenderProps,
  type PopoverTriggerProps,
  type PopoverCloseProps,
  type PopoverPortalProps,
  type PopoverSide,
  type PopoverAlign
} from '@cognitap/radiant'

const render = (props: PopoverRenderProps) => <button {...props} />
const root: PopoverProps = { open: false, onOpenChange: next => void next }
const side: PopoverSide = 'left'
const align: PopoverAlign = 'end'
const content: PopoverContentProps = {
  ref: createRef<HTMLDivElement>(),
  initialFocusRef: createRef<HTMLInputElement>(),
  side,
  align,
  sideOffset: 12,
  collisionPadding: 16,
  motion: 'off',
  role: 'dialog',
  'aria-label': 'Delivery',
  style: { '--rad-popover-width': '24rem' }
}
const trigger: PopoverTriggerProps = {
  render,
  ref: createRef<HTMLButtonElement>(),
  tone: 'neutral',
  variant: 'outline'
}
const close: PopoverCloseProps = { render, pending: true, onClick: event => event.preventDefault() }
const portal: PopoverPortalProps = { children: h(PopoverContent, content, h(PopoverClose, close)) }
h(Popover, root, h(PopoverTrigger, trigger, 'Details'), h(PopoverPortal, portal))
export function StateReader() {
  const state: PopoverState | null = usePopover()
  return state?.open ? 'Open' : null
}
defineTheme({
  id: 'popover',
  name: 'Popover',
  components: {
    popover: { width: '24rem', shadow: 'none', backdropFilter: 'blur(12px)', focusWidth: '3px' }
  }
})

// @ts-expect-error Popover has one open-state owner.
const mixed: PopoverProps = { open: false, defaultOpen: true }
// @ts-expect-error The state root has no DOM host.
const styled: PopoverProps = { className: 'p-4' }
// @ts-expect-error Popover is nonmodal.
const modal: PopoverProps = { modal: true }
// @ts-expect-error Placement sides are a closed set.
const invalidSide: PopoverContentProps = { side: 'above' }
// @ts-expect-error Content owns the native top-layer policy.
const nativePolicy: PopoverContentProps = { popover: 'auto' }
// @ts-expect-error Root relationships own the content ID.
const id: PopoverContentProps = { id: 'other' }
// @ts-expect-error The content host is a div, not a dialog.
const wrongRef: PopoverContentProps = { ref: createRef<HTMLDialogElement>() }
// @ts-expect-error Button render must return one element.
const invalidRender: PopoverTriggerProps = { render: () => 'text' }
// @ts-expect-error A disclosure trigger is not a toggle.
const toggle: PopoverTriggerProps = { defaultPressed: true }
// @ts-expect-error A disclosure trigger owns aria-expanded, not aria-pressed.
const ariaPressed: PopoverTriggerProps = { 'aria-pressed': true }
// @ts-expect-error Popover overrides are closed.
defineTheme({ id: 'bad', name: 'Bad', components: { popover: { arrowSize: '1rem' } } })
void [
  mixed,
  styled,
  modal,
  invalidSide,
  nativePolicy,
  id,
  wrongRef,
  invalidRender,
  toggle,
  ariaPressed
]

// @ts-expect-error An action inside a popover is not a toggle.
export const pressedPopoverClose = <PopoverClose defaultPressed />
