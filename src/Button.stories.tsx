import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor, within } from 'storybook/test'
import { Button, type ButtonRadius, type ButtonSize, type ButtonVariant } from './Button'
import { ThemeScope } from './ThemeScope.js'
import { radiant, themes } from './themes/index.js'

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
          'A native action with shared Radiant styles, theme presets, and local component overrides.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--design-systems') ? (
        <Story />
      ) : (
        <ThemeScope theme={radiant}>
          <Story />
        </ThemeScope>
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
    <ThemeScope
      style={{
        '--rad-color-accent': '#1d4ed8',
        '--rad-color-accent-foreground': '#fff'
      }}
    >
      <Button {...args} />
    </ThemeScope>
  )
}

export const DesignSystems: Story = {
  play: async ({ canvasElement }) => {
    const palettes = {
      primary: ['accent', 'accent-foreground'],
      secondary: ['neutral', 'neutral-foreground'],
      destructive: ['danger', 'danger-foreground'],
      outline: ['surface', 'foreground'],
      ghost: [null, 'foreground']
    } as const
    const document = canvasElement.ownerDocument
    const view = document.defaultView!
    function normalize(property: 'color' | 'background', value: string) {
      const probe = document.createElement('span')
      probe.hidden = true
      probe.style[property] = value
      document.body.append(probe)
      try {
        const styles = view.getComputedStyle(probe)
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          backgroundImage: styles.backgroundImage
        }
      } finally {
        probe.remove()
      }
    }
    for (const theme of themes) {
      const row = within(canvasElement).getByTestId(`theme-${theme.id}`)
      // Check the real canvas as well as component colors: valid dark colors on
      // a stale light canvas still make ghost actions and hard shadows disappear.
      await waitFor(async () => {
        const styles = view.getComputedStyle(row)
        const canvas = styles.getPropertyValue('--rad-surface-canvas').trim()
        await expect(view.CSS.supports('background', canvas)).toBe(true)
        const expected = normalize('background', canvas)
        await expect(styles.backgroundColor).toBe(expected.backgroundColor)
        await expect(styles.backgroundImage).toBe(expected.backgroundImage)
      })
      for (const variant of Object.keys(palettes) as Array<keyof typeof palettes>) {
        const button = within(row).getByRole('button', { name: new RegExp(`^${variant}$`, 'i') })
        await waitFor(async () => {
          const styles = view.getComputedStyle(button)
          const [backgroundRole, foregroundRole] = palettes[variant]
          const background = backgroundRole
            ? styles.getPropertyValue(`--rad-color-${backgroundRole}`).trim()
            : 'transparent'
          const foreground = styles.getPropertyValue(`--rad-color-${foregroundRole}`).trim()
          // Missing mode flags concatenate light and dark colors into invalid CSS.
          await expect(view.CSS.supports('color', background)).toBe(true)
          await expect(view.CSS.supports('color', foreground)).toBe(true)
          await expect(styles.color).toBe(normalize('color', foreground).color)
          if (!button.matches(':hover, :active')) {
            await expect(styles.backgroundColor).toBe(normalize('color', background).color)
          }
          if (theme.id === 'sharp-3d') {
            const border = normalize('color', styles.getPropertyValue('--rad-color-border')).color
            await expect(styles.borderTopColor).toBe(border)
            await expect(styles.boxShadow).toContain('4px 4px 0px')
          }
        })
      }
    }
  },
  render: args => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {themes.map(system => (
        <ThemeScope
          key={system.id}
          theme={system}
          data-testid={`theme-${system.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.5rem',
            borderRadius: '1.25rem'
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
        </ThemeScope>
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
