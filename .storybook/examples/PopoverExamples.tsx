/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG shapes take ARIA roles, and popover content takes its caller-chosen dialog role. */
import { useRef, useState } from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverPortal,
  usePopover,
  Field,
  Input,
  Button,
  Checkbox,
  type PopoverContentProps
} from '../../src/index.js'

export function PopoverExample({
  defaultOpen = false,
  ...content
}: Pick<
  PopoverContentProps,
  'side' | 'align' | 'sideOffset' | 'collisionPadding' | 'motion' | 'style' | 'className'
> & {
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

export function PinnablePopover() {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  return (
    <div className="grid gap-4">
      <output className="m-0">Price breakdown is {open ? 'open' : 'closed'}.</output>
      <Popover
        open={open}
        onOpenChange={next => {
          if (next || !pinned) setOpen(next)
        }}
      >
        <PopoverTrigger
          variant="outline"
          tone="neutral"
        >
          Price breakdown
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="dialog"
            aria-label="Price breakdown"
          >
            <p className="m-0">Subtotal 42.00, delivery 4.50, total 46.50.</p>
            <Checkbox
              label="Keep open while I compare"
              checked={pinned}
              onChange={event => setPinned(event.currentTarget.checked)}
            />
            <Button
              variant="outline"
              tone="neutral"
              onClick={() => {
                setPinned(false)
                setOpen(false)
              }}
            >
              Done
            </Button>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </div>
  )
}

const regions = [
  { id: 'north', label: 'North depot', d: 'M8 8h120v72H8z', stock: 'Stock: 1,240 parcels.' },
  { id: 'east', label: 'East depot', d: 'M136 8h96v152h-96z', stock: 'Stock: 860 parcels.' },
  { id: 'south', label: 'South depot', d: 'M8 88h120v72H8z', stock: 'Stock: 310 parcels.' }
]

function DepotMap({
  activeId,
  onActive,
  setAnchor
}: {
  activeId?: string
  onActive: (id?: string) => void
  setAnchor: (node: SVGPathElement | null) => void
}) {
  // Without a trigger, each region owns its button role, expanded state and keyboard activation.
  const popover = usePopover()
  const toggle = (id: string) => onActive(id === activeId ? undefined : id)
  return (
    <svg
      viewBox="0 0 240 168"
      className="block w-full max-w-80"
      role="group"
      aria-label="Depots"
    >
      {regions.map(item => (
        <path
          key={item.id}
          ref={item.id === activeId ? setAnchor : undefined}
          d={item.d}
          role="button"
          tabIndex={0}
          aria-label={item.label}
          aria-expanded={item.id === activeId}
          aria-controls={popover?.contentId}
          className="cursor-pointer fill-[var(--rad-color-neutral)] stroke-[var(--rad-color-border)] hover:fill-[var(--rad-color-accent)] aria-expanded:fill-[var(--rad-color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--rad-color-focus)]"
          onClick={() => toggle(item.id)}
          onKeyDown={event => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            toggle(item.id)
          }}
        />
      ))}
    </svg>
  )
}

export function SvgAnchorPopover({ defaultRegion }: { defaultRegion?: string }) {
  const [activeId, setActiveId] = useState(defaultRegion)
  // The ref follows the active region, so the anchor is always the shape on screen.
  const [anchor, setAnchor] = useState<SVGPathElement | null>(null)
  const region = regions.find(item => item.id === activeId)
  return (
    <div className="grid gap-2">
      <Popover
        open={!!region}
        onOpenChange={next => {
          if (!next) setActiveId(undefined)
        }}
        anchor={anchor}
      >
        <DepotMap
          activeId={activeId}
          onActive={setActiveId}
          setAnchor={setAnchor}
        />
        <PopoverPortal>
          <PopoverContent
            side="right"
            align="center"
            role="dialog"
            aria-label={region?.label}
          >
            <p className="m-0 font-semibold">{region?.label}</p>
            <p className="m-0">{region?.stock}</p>
            <PopoverClose
              variant="outline"
              tone="neutral"
            >
              Close
            </PopoverClose>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </div>
  )
}

export function RectAnchorPopover({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [pan, setPan] = useState(0)
  const plot = useRef<HTMLDivElement>(null)
  // The marker is drawn on a canvas-like surface, so the anchor is a measured rect.
  const point = { x: 120 + pan, y: 64 }
  return (
    <div className="grid gap-3">
      <div
        ref={plot}
        className="relative h-32 w-full max-w-80 overflow-hidden rounded-md border border-[var(--rad-color-border)]"
      >
        <span
          aria-hidden
          className="absolute size-3 -translate-1/2 rounded-full bg-[var(--rad-color-accent)]"
          style={{ left: point.x, top: point.y }}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          tone="neutral"
          onClick={() => setPan(value => value - 40)}
        >
          Pan left
        </Button>
        <Button
          variant="outline"
          tone="neutral"
          onClick={() => setPan(value => value + 40)}
        >
          Pan right
        </Button>
        <Button onClick={() => setOpen(true)}>Show reading</Button>
      </div>
      <Popover
        open={open}
        onOpenChange={setOpen}
        anchor={() => {
          const box = plot.current?.getBoundingClientRect()
          return {
            x: (box?.left ?? 0) + point.x,
            y: (box?.top ?? 0) + point.y,
            width: 0,
            height: 0
          }
        }}
      >
        <PopoverPortal>
          <PopoverContent
            side="top"
            align="center"
            role="dialog"
            aria-label="Reading"
          >
            <p className="m-0">Peak load: 82 parcels an hour.</p>
            <PopoverClose
              variant="outline"
              tone="neutral"
            >
              Close
            </PopoverClose>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </div>
  )
}
