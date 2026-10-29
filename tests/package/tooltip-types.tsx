import { createElement as h, createRef } from 'react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
  useTooltip,
  type TooltipProps,
  type TooltipContentProps,
  type TooltipRenderProps,
  type TooltipState
} from '@cognitap/radiant'
h(
  Tooltip,
  { openDelay: 300 },
  h(TooltipTrigger, { render: (props: TooltipRenderProps) => <button {...props} /> }, 'Export'),
  h(
    TooltipPortal,
    null,
    h(
      TooltipContent,
      {
        ref: createRef<HTMLSpanElement>(),
        side: 'top',
        style: { '--rad-tooltip-max-width': '12rem' }
      },
      'CSV format'
    )
  )
)
export function Probe() {
  const state: TooltipState | null = useTooltip()
  return state?.open ? 'open' : null
}
// @ts-expect-error Tooltip has one state owner.
const mixed: TooltipProps = { open: false, defaultOpen: true }
// @ts-expect-error Tooltip owns its role.
const role: TooltipContentProps = { role: 'dialog' }
// @ts-expect-error Tooltip content does not receive focus.
const tab: TooltipContentProps = { tabIndex: 0 }
void [mixed, role, tab]
