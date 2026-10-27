import { useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button.js'
import { MotionProvider, useSpringStyle } from './motion/react.js'

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
