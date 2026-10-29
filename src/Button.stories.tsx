import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor, within } from 'storybook/test'
import { ButtonPlayground, SaveChanges } from '../.storybook/examples/ButtonExamples.js'
import { MotionProvider } from './motion/react.js'
import {
  Button,
  Link,
  type ButtonProps,
  type ButtonRenderProps,
  type ButtonVariant,
  type Tone,
  type ThemeStyle
} from './index.js'

const variants: ButtonVariant[] = ['solid', 'soft', 'outline', 'ghost']
const tones: Tone[] = ['accent', 'neutral', 'warning', 'danger']

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Continue', disabled: false, onClick: fn() },
  render: args => (
    <MotionProvider>
      <Button {...args} />
    </MotionProvider>
  ),
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'inline-radio', options: variants },
    tone: { control: 'inline-radio', options: tones },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    iconOnly: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
    pending: { control: 'boolean' },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    render: { control: false }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native button, defaulting to type="button". Choose variant, tone and controlSize independently. pending blocks activation, marks aria-busy and keeps focus and the accessible name; disabled uses native behavior. MotionProvider from @cognitap/radiant/motion/react enables theme-driven press springs; motion="off" stops spatial feedback and system reduced motion always wins. className, style and ref target the button. render forwards fully resolved props/ref/children to one custom button host. Dialog actions share this interface. Start with Default, then try Playground and Save Changes.'
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

export const Playground: Story = {
  args: { children: 'Launch workspace', variant: 'solid', tone: 'accent', controlSize: 'large' },
  parameters: {
    docs: {
      description: {
        story:
          'Explore press/release feedback with Controls and the global Theme/Mode toolbar. The local motion switch compares the same action without spatial motion; the system reduced-motion preference is respected automatically.'
      }
    }
  },
  render: args => <ButtonPlayground {...args} />
}

export const SaveChangesExample: Story = {
  name: 'Save changes',
  parameters: {
    docs: {
      description: {
        story:
          'A native form submits through Button. The simulated async request shows pending, success and recoverable failure. Discard confirmation uses default Dialog actions with the same API and springs. Copy the [example source](https://github.com/cognitap/radiant/blob/main/.storybook/examples/ButtonExamples.tsx) and replace the simulated request with your persistence call.'
      }
    }
  },
  render: args => <SaveChanges {...args} />
}

function ConsumerButton({ children, ...props }: ButtonRenderProps) {
  return <button {...props}>{children}</button>
}

function ButtonComposition(args: ButtonProps) {
  const id = useId()
  const [activations, setActivations] = useState({ next: 0, close: 0 })

  return (
    <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '32rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <Button
          {...args}
          variant="outline"
          tone="neutral"
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
          'An explicit native button adapter forwards resolved props/ref/children; local Button variables change this action without replacing the selected global theme. Caller utilities can replace matching default classes on the Tailwind route.'
      }
    }
  },
  render: args => {
    const local: ThemeStyle = { '--rad-button-radius': '999px', '--rad-button-padding': '2rem' }
    return (
      <Button
        {...args}
        style={local}
        render={props => <ConsumerButton {...props} />}
      />
    )
  }
}

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Each treatment accepts every tone. Button and Link share the same action presentation; Link keeps anchor navigation.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const view = canvasElement.ownerDocument.defaultView!
    for (const variant of variants) {
      for (const tone of tones) {
        const name = `${variant} ${tone}`
        const button = canvas.getByRole('button', { name })
        const link = canvas.getByRole('link', { name })
        await expect(button).toHaveAttribute('data-variant', variant)
        await expect(button).toHaveAttribute('data-tone', tone)
        await expect(button).toHaveAttribute('data-control-size', 'medium')
        await waitFor(async () => {
          const action = view.getComputedStyle(button)
          const navigation = view.getComputedStyle(link)
          const properties = ['color', 'min-height', 'font-family', 'font-size']
          // A parked pointer can hover one host. State-dependent paints are
          // comparable only when both hosts are in the same interaction state.
          if ([':hover', ':active'].every(state => button.matches(state) === link.matches(state))) {
            properties.push('background-color', 'border-radius', 'box-shadow')
          }
          for (const property of properties) {
            await expect(action.getPropertyValue(property)).toBe(
              navigation.getPropertyValue(property)
            )
          }
          await expect(action.color).not.toBe('rgba(0, 0, 0, 0)')
          if (variant === 'solid' || variant === 'soft') {
            await expect(action.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
            await expect(action.color).not.toBe(action.backgroundColor)
          }
        })
      }
    }
  },
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {variants.map(variant => (
        <div
          key={variant}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}
        >
          {tones.map(tone => (
            <div
              key={tone}
              style={{ display: 'grid', gap: '0.5rem' }}
            >
              <Button
                {...args}
                variant={variant}
                tone={tone}
                controlSize="medium"
              >
                {variant} {tone}
              </Button>
              <Link
                href="#action-destination"
                variant={variant}
                tone={tone}
              >
                {variant} {tone}
              </Link>
            </div>
          ))}
        </div>
      ))}
      <p id="action-destination">Action links navigate here.</p>
    </div>
  )
}

export const Sizes: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const heights = []
    for (const controlSize of ['small', 'medium', 'large'] as const) {
      const button = canvas.getByRole('button', { name: controlSize })
      const link = canvas.getByRole('link', { name: controlSize })
      await expect(button).toHaveAttribute('data-control-size', controlSize)
      heights.push(button.getBoundingClientRect().height)
      await expect(button.getBoundingClientRect().height).toBe(link.getBoundingClientRect().height)
    }
    await expect(heights[0]).toBeLessThan(heights[1]!)
    await expect(heights[1]).toBeLessThan(heights[2]!)
  },
  render: args => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'start', gap: '1rem' }}>
      {(['small', 'medium', 'large'] as const).map(controlSize => (
        <div
          key={controlSize}
          style={{ display: 'grid', gap: '0.5rem' }}
        >
          <Button
            {...args}
            controlSize={controlSize}
          >
            {controlSize}
          </Button>
          <Link
            href="#size-destination"
            variant="solid"
            controlSize={controlSize}
          >
            {controlSize}
          </Link>
        </div>
      ))}
      <span id="size-destination">Size link destination.</span>
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
