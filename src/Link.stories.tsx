import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Link } from './index.js'

function LinkActions() {
  const id = useId()
  const [clicks, setClicks] = useState(0)
  const destinationClass =
    'target:[outline:var(--rad-focus-width)_var(--rad-focus-style)_var(--rad-color-focus)] target:[outline-offset:var(--rad-focus-offset)]'

  return (
    <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '38rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <Link
          href={`#${id}-start`}
          variant="button"
        >
          Get started
        </Link>
        <Button
          onClick={() => setClicks(count => count + 1)}
          type="button"
        >
          Real button
        </Button>
        <Link
          href={`#${id}-deletion`}
          variant="button"
          tone="destructive"
          size="small"
        >
          Review deletion
        </Link>
      </div>
      <output style={{ margin: 0 }}>
        Button activated {clicks} {clicks === 1 ? 'time' : 'times'}.
      </output>
      <section
        aria-label="Getting started"
        className={destinationClass}
        id={`${id}-start`}
        tabIndex={-1}
      >
        Getting started: choose a theme and explore the components.
      </section>
      <section
        aria-label="Deletion options"
        className={destinationClass}
        id={`${id}-deletion`}
        tabIndex={-1}
      >
        Deletion options: review the consequences before confirming an action.
      </section>
    </div>
  )
}

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
  parameters: {
    docs: {
      description: {
        story:
          'Button-styled links share Button hover, pressed, and focus feedback. They remain native anchors: click or Enter navigates to a visible destination below. The native Button updates a counter.'
      }
    }
  },
  render: () => <LinkActions />
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
