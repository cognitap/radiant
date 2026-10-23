import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button, type ButtonRadius, type ButtonSize, type ButtonVariant } from './Button'
import { radiantTheme, themes } from './themes'

const variants: ButtonVariant[] = [
  'primary',
  'secondary',
  'warning',
  'destructive',
  'outline',
  'ghost'
]
const sizes: ButtonSize[] = ['small', 'default', 'large']
const radii: ButtonRadius[] = ['none', 'small', 'default', 'large', 'full']

const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Continue',
    disabled: false,
    onClick: fn()
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'inline-radio', options: variants },
    size: { control: 'inline-radio', options: sizes },
    radius: { control: 'inline-radio', options: radii },
    iconOnly: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
    pending: { control: 'boolean' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A headless native button. It ships unstyled; a theme of CSS variables gives it a look.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--design-systems') ? (
        <Story />
      ) : (
        <div style={radiantTheme}>
          <Story />
        </div>
      )
  ]
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

export const Gallery: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {sizes.map(size => (
        <div
          key={size}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}
        >
          {variants.map(variant => (
            <Button
              {...args}
              key={variant}
              variant={variant}
              size={size}
            >
              {variant}
            </Button>
          ))}
          <Button
            {...args}
            size={size}
            iconOnly
            aria-label="Close"
          >
            {close}
          </Button>
          <Button
            {...args}
            size={size}
            variant="outline"
          >
            Next {arrow}
          </Button>
        </div>
      ))}
    </div>
  )
}

export const Radii: Story = {
  render: args => (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      {radii.map(radius => (
        <Button
          {...args}
          key={radius}
          radius={radius}
        >
          {radius}
        </Button>
      ))}
    </div>
  )
}

export const FullWidth: Story = {
  args: { fullWidth: true }
}

export const Disabled: Story = {
  args: { disabled: true }
}

export const Pending: Story = {
  args: { pending: true }
}

export const CustomClasses: Story = {
  args: { className: 'rounded-full px-8 hover:bg-red-500' }
}

export const IconOnly: Story = {
  args: { 'aria-label': 'Close', iconOnly: true, children: close }
}

export const ThemedSubtree: Story = {
  render: args => (
    <div
      style={
        {
          '--color-primary': '#1d4ed8',
          '--color-primary-foreground': '#fff'
        } as CSSProperties
      }
    >
      <Button {...args} />
    </div>
  )
}

export const DesignSystems: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {themes.map(system => (
        <div
          key={system.name}
          style={{
            ...system.style,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.5rem',
            borderRadius: '1.25rem',
            background: system.surface ?? 'oklch(0.985 0.003 250)'
          }}
        >
          <span style={{ width: '8rem', font: '500 0.8125rem system-ui', opacity: 0.7 }}>
            {system.name}
          </span>
          {(['primary', 'secondary', 'destructive', 'outline', 'ghost'] as const).map(variant => (
            <Button
              {...args}
              key={variant}
              variant={variant}
            >
              {variant}
            </Button>
          ))}
        </div>
      ))}
    </div>
  )
}

export const LongLabel: Story = {
  args: {
    children: 'Save the current draft and continue to the next step',
    style: { width: '9rem' }
  }
}
