import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Link } from './index.js'

const meta = {
  title: 'Components/Link',
  component: Link,
  args: {
    children: 'Read the guide',
    href: '/guide',
    variant: 'inline'
  },
  argTypes: {
    children: { control: 'text' },
    href: { control: 'text' },
    variant: { control: 'inline-radio', options: ['inline', 'subtle', 'button'] },
    tone: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'warning', 'destructive', 'outline', 'ghost']
    },
    external: { control: 'boolean' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native `<a>` for navigation, with inline, subtle and button variants. Button styling uses tone, size and radius; Link has no invented disabled or pending state. className, style and ref target the anchor (data-slot="link"). render receives anchor props for a consumer-owned router adapter.'
      }
    }
  }
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => (
    <p style={{ maxWidth: '24rem', lineHeight: 1.6 }}>
      Radiant keeps routers outside the core. Read the <Link {...args} /> to see how navigation
      composes with your stack.
    </p>
  )
}

export const Composition: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <Link
        href="/start"
        variant="button"
      >
        Get started
      </Link>
      <Button type="button">Real button</Button>
      <Link
        href="/delete"
        variant="button"
        tone="destructive"
        size="small"
      >
        Delete space
      </Link>
    </div>
  )
}

export const Customisation: Story = {
  render: () => (
    <p style={{ lineHeight: 1.6 }}>
      Rendered by an application router:{' '}
      <Link
        href="/docs"
        render={({ children, ...props }) => (
          <a
            data-router-link=""
            {...props}
          >
            {children}
          </a>
        )}
      >
        Routed docs
      </Link>
    </p>
  )
}

export const Subtle: Story = {
  args: { variant: 'subtle', children: 'Settings', href: '/settings' }
}

export const External: Story = {
  args: { href: 'https://example.com', external: true, children: 'Example (external)' }
}
