import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button, Link, type ButtonProps, type ButtonVariant, type ThemeStyle } from './index.js'

const variants: ButtonVariant[] = [
  'primary',
  'secondary',
  'warning',
  'destructive',
  'outline',
  'ghost'
]

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Continue', disabled: false, onClick: fn() },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'inline-radio', options: variants },
    size: { control: 'inline-radio', options: ['small', 'default', 'large'] },
    radius: { control: 'inline-radio', options: ['none', 'small', 'default', 'large', 'full'] },
    iconOnly: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
    pending: { control: 'boolean' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native `<button>` with type="button" by default. variant, size and radius are visual props; disabled is native and pending suppresses activation while retaining focus. className, style and ref target the button; data-slot="button" identifies it. The inner label and pending mark preserve its accessible name.'
      }
    }
  }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

const close = (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path
      d="M4 4l8 8M12 4l-8 8"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
)
const arrow = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
)

export const Default: Story = {}

function ButtonComposition(args: ButtonProps) {
  const id = useId()
  const [activations, setActivations] = useState({ next: 0, close: 0 })

  return (
    <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '32rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <Button
          {...args}
          variant="outline"
          onClick={event => {
            args.onClick?.(event)
            setActivations(counts => ({ ...counts, next: counts.next + 1 }))
          }}
        >
          Next {arrow}
        </Button>
        <Button
          {...args}
          iconOnly
          aria-label="Close"
          onClick={event => {
            args.onClick?.(event)
            setActivations(counts => ({ ...counts, close: counts.close + 1 }))
          }}
        >
          {close}
        </Button>
        <Link href={`#${id}-guide`}>Read the guide</Link>
      </div>
      <output>
        Next activated {activations.next} {activations.next === 1 ? 'time' : 'times'}. Close
        activated {activations.close} {activations.close === 1 ? 'time' : 'times'}.
      </output>
      <section
        id={`${id}-guide`}
        tabIndex={-1}
        className="target:[outline:var(--rad-focus-width)_var(--rad-focus-style)_var(--rad-color-focus)] target:[outline-offset:var(--rad-focus-offset)]"
      >
        Guide: combine native buttons for actions with links for navigation.
      </section>
    </div>
  )
}

export const States: Story = {
  render: args => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
      <Button
        {...args}
        disabled
      >
        Unavailable
      </Button>
      <Button
        {...args}
        pending
      >
        Saving
      </Button>
    </div>
  )
}

export const Composition: Story = {
  render: args => <ButtonComposition {...args} />
}

export const Customisation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Local Button variables change this action without replacing the selected global theme. Caller utilities can replace matching default classes on the Tailwind route.'
      }
    }
  },
  render: args => {
    const local: ThemeStyle = { '--rad-button-radius': '999px', '--rad-button-padding': '2rem' }
    return (
      <Button
        {...args}
        style={local}
      />
    )
  }
}

export const Variants: Story = {
  render: args => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
      {variants.map(variant => (
        <Button
          {...args}
          key={variant}
          variant={variant}
        >
          {variant}
        </Button>
      ))}
    </div>
  )
}

export const FullWidth: Story = {
  args: { fullWidth: true },
  render: args => (
    <div style={{ width: 'min(24rem, calc(100vw - 2rem))', maxWidth: '100%' }}>
      <Button {...args} />
    </div>
  )
}

export const LongLabel: Story = {
  args: {
    children: 'Save the current draft and continue to the next step',
    style: { width: '9rem' }
  }
}
