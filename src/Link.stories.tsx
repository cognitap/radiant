import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Link } from './Link'
import { radiantTheme, themes } from './themes/index.js'

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
          'A native anchor for navigation. Inline, subtle, and button-styled forms, themed by the shared variables.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--themes') ? (
        <Story />
      ) : (
        <div style={radiantTheme}>
          <Story />
        </div>
      )
  ]
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

export const Subtle: Story = {
  args: { variant: 'subtle', children: 'Settings', href: '/settings' }
}

export const AsButton: Story = {
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

export const External: Story = {
  args: { href: 'https://example.com', external: true, children: 'Example (external)' }
}

export const RouterAdapter: Story = {
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

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {themes.map(theme => (
        <div
          key={theme.name}
          style={{
            ...theme.style,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.5rem',
            borderRadius: '1.25rem',
            background: theme.surface ?? 'oklch(0.985 0.003 250)'
          }}
        >
          <span style={{ width: '8rem', font: '500 0.8125rem system-ui', opacity: 0.7 }}>
            {theme.name}
          </span>
          <Link href="/guide">Guide</Link>
          <Link
            href="/settings"
            variant="subtle"
          >
            Settings
          </Link>
          <Link
            href="/start"
            variant="button"
            size="small"
          >
            Get started
          </Link>
        </div>
      ))}
    </div>
  )
}
