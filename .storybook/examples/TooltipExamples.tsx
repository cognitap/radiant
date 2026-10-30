import { useState } from 'react'
import {
  Switch,
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  type TooltipProps,
  type TooltipContentProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'

export type TooltipExampleProps = Pick<TooltipProps, 'openDelay' | 'closeDelay'> &
  Pick<
    TooltipContentProps,
    'side' | 'align' | 'sideOffset' | 'collisionPadding' | 'motion' | 'className' | 'style'
  > & { defaultOpen?: boolean }

export function TooltipExample({
  defaultOpen,
  openDelay,
  closeDelay,
  ...content
}: TooltipExampleProps) {
  return (
    <MotionProvider>
      <Tooltip
        defaultOpen={defaultOpen}
        openDelay={openDelay}
        closeDelay={closeDelay}
      >
        <TooltipTrigger variant="outline">Export report</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent {...content}>Download the report as a CSV file.</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </MotionProvider>
  )
}

export function TooltipIconButtonExample() {
  const [pinned, setPinned] = useState(false)
  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger
          iconOnly
          variant="outline"
          tone="neutral"
          aria-label="Copy link"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
            <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
          </svg>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Anyone in your workspace can open the link.</TooltipContent>
        </TooltipPortal>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          iconOnly
          variant="outline"
          tone="neutral"
          aria-label="Pin report"
          pressed={pinned}
          onPressedChange={setPinned}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 17v5M9 3h6l-1 7 4 4H6l4-4z" />
          </svg>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Pinned reports stay at the top of the list.</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </div>
  )
}

export function TooltipOpenDelayExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <Tooltip>
        <TooltipTrigger variant="outline">Default delay</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Opens 500 ms after the pointer arrives.</TooltipContent>
        </TooltipPortal>
      </Tooltip>
      <Tooltip
        openDelay={0}
        closeDelay={0}
      >
        <TooltipTrigger variant="outline">Instant</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Opens and closes with the pointer.</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </div>
  )
}

export function TooltipControlledExample() {
  const [open, setOpen] = useState(false)
  return (
    <div className="grid justify-items-start gap-4">
      <Switch
        label="Show hint"
        checked={open}
        onChange={event => setOpen(event.currentTarget.checked)}
      />
      <Tooltip
        open={open}
        onOpenChange={setOpen}
      >
        <TooltipTrigger variant="outline">Schedule report</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="right">Reports send at 9:00 in your time zone.</TooltipContent>
        </TooltipPortal>
      </Tooltip>
      <output>The tooltip is {open ? 'open' : 'closed'}.</output>
    </div>
  )
}
