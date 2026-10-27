import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './Collapsible.js'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from './Dialog.js'
import { useEffect, useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button.js'
import { MotionProvider, useSpringStyle, useSpringDrag } from './motion/react.js'

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
