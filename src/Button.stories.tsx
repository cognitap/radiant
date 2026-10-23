import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import {
  Button,
  buttonTheme,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant
} from './Button'

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
          'A native button with variant, size, radius, icon-only, full-width, and pending settings.'
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

const designSystems: { name: string; style: CSSProperties; surface?: string }[] = [
  { name: 'Radiant default', style: {} },
  {
    name: 'Soft squircle',
    style: {
      '--color-primary': 'oklch(0.6 0.21 258)',
      '--color-secondary': 'oklch(0.95 0.04 258)',
      '--color-secondary-foreground': 'oklch(0.45 0.2 258)',
      '--color-destructive': 'oklch(0.6 0.22 25)',
      ...buttonTheme({
        height: '2.75rem',
        padding: '1.125rem',
        radius: '1rem',
        radiusPressed: '0.375rem',
        cornerShape: 'squircle',
        fontWeight: 590,
        shadow: '0 1px 1px rgb(0 0 0 / 0.12)',
        glow: '55%',
        glowHover: '70%',
        aurora: 0,
        highlight: 0.22,
        pressScale: 0.96,
        pressDuration: '90ms',
        pressEase: 'var(--ease-snap)',
        releaseDuration: '520ms',
        releaseEase: 'var(--ease-spring)'
      })
    } as CSSProperties
  },
  {
    name: 'Expressive',
    style: {
      '--color-primary': 'oklch(0.52 0.24 290)',
      '--color-secondary': 'oklch(0.91 0.06 290)',
      '--color-secondary-foreground': 'oklch(0.32 0.15 290)',
      '--color-destructive': 'oklch(0.56 0.22 25)',
      '--color-border': 'oklch(0.8 0.06 290)',
      '--color-foreground': 'oklch(0.32 0.15 290)',
      ...buttonTheme({
        height: '3rem',
        padding: '1.5rem',
        radius: '1.5rem',
        radiusPressed: '0.75rem',
        cornerShape: 'round',
        sheen: 0,
        aurora: 0,
        glow: '0%',
        glowHover: '0%',
        hoverLift: '0px',
        fontWeight: 600,
        letterSpacing: '0',
        shadow: '0 0 #0000',
        highlight: 0,
        pressScale: 0.98,
        pressDuration: '450ms',
        pressEase: 'var(--ease-spring)',
        releaseDuration: '450ms',
        releaseEase: 'var(--ease-spring)'
      })
    } as CSSProperties
  },
  {
    name: 'Glass',
    surface:
      'radial-gradient(40% 80% at 15% 30%, oklch(0.78 0.16 230), transparent 70%), radial-gradient(45% 90% at 55% 80%, oklch(0.74 0.2 330), transparent 70%), radial-gradient(40% 80% at 90% 20%, oklch(0.85 0.14 90), transparent 70%), oklch(0.93 0.03 280)',
    style: {
      '--color-primary': 'oklch(0.55 0.22 265 / 0.78)',
      '--color-secondary': 'rgb(255 255 255 / 0.28)',
      '--color-secondary-foreground': 'oklch(0.2 0.02 280)',
      '--color-destructive': 'oklch(0.6 0.22 25 / 0.8)',
      '--color-background': 'rgb(255 255 255 / 0.12)',
      '--color-border': 'rgb(255 255 255 / 0.6)',
      ...buttonTheme({
        height: '2.75rem',
        padding: '1.25rem',
        radius: '1.375rem',
        fontWeight: 590,
        shadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.35), 0 10px 30px -10px rgb(30 20 60 / 0.35)',
        highlight: 0.9,
        backdrop: 'blur(18px) saturate(190%)',
        aurora: 0,
        glow: '0%',
        glowHover: '0%',
        pressScale: 0.94,
        pressDuration: '120ms',
        releaseDuration: '600ms',
        releaseEase: 'var(--ease-spring)'
      })
    } as CSSProperties
  }
]

export const DesignSystems: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {designSystems.map(system => (
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
