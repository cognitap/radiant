'use client'
import { useRef, type RefObject } from 'react'
import { cn } from 'cn'
import { CalendarRoot } from '../Calendar/Calendar.js'
import { PopoverTrigger, PopoverContentRoot } from '../Popover/Popover.js'
import { inlineActionClass } from '../shared/actionStyles.js'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import type { ControlSize } from '../../presentation.js'
import type { ComponentProps } from 'react'

export function DateCalendarTrigger({
  label,
  disabled,
  controlSize
}: {
  label: string
  disabled?: boolean
  controlSize?: ControlSize
}) {
  requireAccessibleName('Calendar trigger', { 'aria-label': label })
  return (
    <PopoverTrigger
      type="button"
      variant="ghost"
      tone="neutral"
      iconOnly
      controlSize={controlSize}
      disabled={disabled}
      aria-label={label}
      aria-haspopup="dialog"
      data-slot="date-picker-trigger"
      className={cn(inlineActionClass, 'ms-1')}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </svg>
    </PopoverTrigger>
  )
}

export function DateCalendarPopup({
  returnFocusRef,
  ...props
}: ComponentProps<typeof CalendarRoot> & { returnFocusRef: RefObject<HTMLInputElement | null> }) {
  const dayButton = useRef<HTMLButtonElement>(null)
  return (
    <PopoverContentRoot
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Popover owns the nonmodal top-layer surface.
      role="dialog"
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      initialFocusRef={dayButton}
      returnFocusRef={returnFocusRef}
      align="end"
      className="w-fit p-0"
    >
      <CalendarRoot
        {...props}
        className="border-0"
        ref={node => {
          dayButton.current =
            node?.querySelector<HTMLButtonElement>('[data-slot~="calendar-day"][tabindex="0"]') ??
            null
        }}
      />
    </PopoverContentRoot>
  )
}
