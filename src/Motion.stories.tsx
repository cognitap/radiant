import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './Collapsible.js'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from './Dialog.js'
import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button.js'
import { Card, CardTitle, CardDescription } from './Card.js'
import { bindSpringStyle } from './motion/index.js'
import {
  MotionProvider,
  useSpringStyle,
  useSpringDrag,
  useSpringFollow,
  useSpringLayout
} from './motion/react.js'

function RuntimeBinding() {
  const ref = useRef<HTMLButtonElement>(null)
  const spring = useSpringStyle(ref, 'scale', 1, 'press', 1)
  return (
    <Button
      ref={ref}
      className="transition-colors"
      style={{ transform: 'rotate(-3deg)', '--rad-button-press-scale': '1' }}
      onPointerDown={event => {
        if (!event.defaultPrevented) spring.to(0.96)
      }}
      onPointerUp={() => spring.to(1)}
      onPointerCancel={() => spring.to(1)}
      onPointerLeave={() => spring.to(1)}
      onBlur={() => spring.to(1)}
      onKeyDown={event => {
        if (!event.repeat && [' ', 'Enter'].includes(event.key) && !event.defaultPrevented)
          spring.to(0.96)
      }}
      onKeyUp={() => spring.to(1)}
    >
      Native Button with runtime binding
    </Button>
  )
}
const meta = {
  title: 'System/Motion',
  component: RuntimeBinding,
  parameters: {
    docs: {
      description: {
        component:
          'Opt-in runtime binding reference. Native activation remains with Button; built-in Button spring policy is DEV-173. The theme supplies physics and live reduced motion suppresses the presentation.'
      }
    }
  }
} satisfies Meta<typeof RuntimeBinding>
export default meta
export const Runtime: StoryObj<typeof meta> = {}

export const ButtonPress: StoryObj<typeof meta> = {
  render: () => (
    <MotionProvider>
      <Button>Press and quickly press again</Button>
      <Button motion="off">Motion off</Button>
    </MotionProvider>
  )
}

export const Transitions: StoryObj<typeof meta> = {
  render: () => (
    <MotionProvider>
      <Collapsible>
        <CollapsibleTrigger>Interrupt this disclosure</CollapsibleTrigger>
        <CollapsibleContent>
          <p>Open, close and reopen before the height settles.</p>
        </CollapsibleContent>
      </Collapsible>
      <Dialog>
        <DialogTrigger>Open spring dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Native modal</DialogTitle>
          <p>Escape restores focus immediately. The inert visual exit can finish independently.</p>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>
    </MotionProvider>
  )
}

function DragProof() {
  const ref = useRef<HTMLButtonElement>(null)
  const output = useRef<HTMLOutputElement>(null)
  const drag = useSpringDrag(ref, 0, { min: 0, max: 160, snapPoints: [0, 80, 160] })
  useEffect(
    () =>
      drag.subscribe(value => {
        if (output.current) output.current.value = `${value.toFixed(1)}px`
      }),
    [drag]
  )
  return (
    <div className="grid gap-4">
      <div className="relative h-20 w-64 rounded-lg bg-neutral-200">
        <Button
          ref={ref}
          className="transition-colors"
          style={{ transform: 'rotate(-2deg)' }}
          aria-describedby="drag-help"
        >
          Drag me
        </Button>
      </div>
      <p id="drag-help">
        Drag sideways or focus the handle and use arrows, Home and End. Escape cancels a drag.
        Vertical touch scrolling remains available.
      </p>
      <div>
        <Button onClick={() => drag.step('first')}>Start</Button>
        <Button onClick={() => drag.to(80)}>Middle</Button>
        <Button onClick={() => drag.step('last')}>End</Button>
      </div>
      <label>
        Target position
        <input
          type="range"
          min={0}
          max={160}
          defaultValue={0}
          onChange={event => drag.to(Number(event.currentTarget.value))}
        />
      </label>
      <output
        ref={output}
        aria-live="off"
      >
        0px
      </output>
    </div>
  )
}
export const DragSnap: StoryObj<typeof meta> = { render: () => <DragProof /> }

function FollowProof() {
  const [target, setTarget] = useState(80)
  const [running, setRunning] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const output = useRef<HTMLOutputElement>(null)
  const spring = useSpringFollow(target)
  useEffect(() => {
    if (!ref.current) return
    return bindSpringStyle(ref.current, spring, 'translateX')
  }, [spring])
  useEffect(
    () =>
      spring.subscribe(value => {
        if (output.current) output.current.value = `${value.toFixed(1)}px`
      }),
    [spring]
  )
  useEffect(() => {
    if (!running) return
    let frame: number
    const start = performance.now()
    const tick = (now: number) => {
      setTarget(80 + Math.sin((now - start) / 400) * 70)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running])
  return (
    <div className="grid gap-4">
      <div
        className="relative h-20 w-64 rounded-lg bg-neutral-200"
        onPointerMove={event => {
          if (!running)
            setTarget(
              Math.max(
                0,
                Math.min(160, event.clientX - event.currentTarget.getBoundingClientRect().left)
              )
            )
        }}
      >
        <div
          aria-hidden="true"
          className="absolute size-8 rounded-full border-2 border-neutral-700"
          style={{ translate: `${target}px 0` }}
        />
        <div
          ref={ref}
          aria-hidden="true"
          className="absolute top-10 size-8 rounded-full bg-neutral-700"
        />
      </div>
      <label>
        Following target
        <input
          type="range"
          min={0}
          max={160}
          value={target}
          onChange={event => {
            setRunning(false)
            setTarget(Number(event.currentTarget.value))
          }}
        />
      </label>
      <Button onClick={() => setRunning(value => !value)}>
        {running ? 'Pause moving target' : 'Start moving target'}
      </Button>
      <Button
        onClick={() => {
          setRunning(false)
          setTarget(80)
        }}
      >
        Reset target
      </Button>
      <p>
        Move across the track, use the slider, or start the moving target. The filled marker follows
        the outlined destination. Reduced motion follows immediately.
      </p>
      <output
        ref={output}
        aria-live="off"
      >
        80px
      </output>
    </div>
  )
}
export const FollowingValues: StoryObj<typeof meta> = { render: () => <FollowProof /> }

function LayoutProof() {
  const root = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState(['Alpha', 'Beta', 'Gamma'])
  const [wide, setWide] = useState(false)
  const [expanded, setExpanded] = useState(false)
  useSpringLayout(root)
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setItems(values => [...values.slice(1), values[0]!])}>
          Reorder cards
        </Button>
        <Button onClick={() => setWide(value => !value)}>Change layout width</Button>
        <Button onClick={() => setExpanded(value => !value)}>Change card content</Button>
      </div>
      <div className="max-h-96 overflow-auto border border-neutral-400 p-2">
        <div
          ref={root}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
            width: wide ? 460 : 300,
            maxWidth: '100%'
          }}
        >
          {items.map(item => (
            <div
              key={item}
              data-rad-layout-slot=""
              style={{ display: 'flow-root' }}
            >
              <Card
                data-rad-layout-part=""
                className="p-4"
              >
                <CardTitle level={3}>{item}</CardTitle>
                <CardDescription>
                  {expanded
                    ? 'Content can change while these cards move. Text reflows at the animated width; borders and children are never scaled.'
                    : 'Real content, natural layout.'}
                </CardDescription>
                <Button
                  controlSize="small"
                  aria-label={`Toggle details for ${item}`}
                  onClick={() => setExpanded(value => !value)}
                >
                  Details
                </Button>
              </Card>
            </div>
          ))}
        </div>
      </div>
      <p>
        Interrupt repeatedly using any control. Slot identity follows the keyed DOM. Native buttons
        and focus stay with the actual content; reduced motion applies layout immediately.
      </p>
    </div>
  )
}
export const LayoutResizeReorder: StoryObj<typeof meta> = { render: () => <LayoutProof /> }
