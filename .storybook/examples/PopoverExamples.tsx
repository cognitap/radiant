import { useRef, useState } from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverPortal,
  Field,
  Input,
  Button,
  type PopoverContentProps
} from '../../src/index.js'

export function PopoverExample({
  defaultOpen = false,
  ...content
}: Pick<PopoverContentProps, 'side' | 'align' | 'sideOffset' | 'style' | 'className'> & {
  defaultOpen?: boolean
}) {
  return (
    <Popover defaultOpen={defaultOpen}>
      <PopoverTrigger
        variant="outline"
        tone="neutral"
      >
        Delivery details
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent {...content}>
          <p className="m-0 font-semibold">Standard delivery</p>
          <p className="m-0">
            Your order arrives in three to five working days. Tracking is included.
          </p>
          <PopoverClose
            variant="outline"
            tone="neutral"
          >
            Got it
          </PopoverClose>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
}

export function DeliveryTimePopover() {
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState('09:00')
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="grid gap-4">
      <output className="m-0">Daily report delivery: {time}.</output>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger variant="outline">Change delivery time</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            // A native popover stays nonmodal; its owner supplies dialog semantics.
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="dialog"
            aria-label="Report delivery time"
            initialFocusRef={input}
          >
            <p className="m-0 font-semibold">Report delivery time</p>
            <form
              className="grid gap-4"
              onSubmit={event => {
                event.preventDefault()
                setTime(String(new FormData(event.currentTarget).get('time')))
                setOpen(false)
              }}
            >
              <Field label="Time">
                <Input
                  ref={input}
                  name="time"
                  type="time"
                  defaultValue={time}
                  required
                />
              </Field>
              <div className="flex flex-wrap justify-end gap-3">
                <PopoverClose
                  variant="outline"
                  tone="neutral"
                >
                  Cancel
                </PopoverClose>
                <Button type="submit">Save time</Button>
              </div>
            </form>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </div>
  )
}
