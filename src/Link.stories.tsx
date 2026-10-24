import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Link, type LinkProps } from './index.js'

function LinkDestination({
  args,
  introduction,
  continuation,
  destination,
  router = false
}: {
  args: LinkProps
  introduction?: string
  continuation?: string
  destination: string
  router?: boolean
}) {
  const id = useId()

  return (
    <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '24rem' }}>
      <p style={{ margin: 0, lineHeight: 1.6 }}>
        {introduction}
        <Link
          {...args}
          href={args.href ?? `#${id}-destination`}
          render={
            args.render ??
            (router
              ? ({ children, ...props }) => (
                  <a
                    data-router-link=""
                    {...props}
                  >
                    {children}
                  </a>
                )
              : undefined)
          }
        />
        {continuation}
      </p>
      <section
        id={`${id}-destination`}
        tabIndex={-1}
        className="target:[outline:var(--rad-focus-width)_var(--rad-focus-style)_var(--rad-color-focus)] target:[outline-offset:var(--rad-focus-offset)]"
      >
        {destination}
      </section>
    </div>
  )
}

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
          variant="solid"
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
          variant="solid"
          tone="danger"
          controlSize="small"
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
    variant: 'inline'
  },
  argTypes: {
    children: { control: 'text' },
    href: { control: 'text' },
    variant: {
      control: 'inline-radio',
      options: ['inline', 'subtle', 'solid', 'soft', 'outline', 'ghost']
    },
    tone: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'warning', 'danger']
    },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    external: { control: 'boolean' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native `<a>` for navigation, with inline/subtle decoration or solid/soft/outline/ghost action treatment. tone selects palette; controlSize selects action dimensions; Link has no invented disabled or pending state. className, style and ref target the anchor (data-slot="link"). render receives anchor props for a consumer-owned router adapter.'
      }
    }
  }
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => (
    <LinkDestination
      args={args}
      introduction="Radiant keeps routers outside the core. "
      continuation=" to see how navigation composes with your stack."
      destination="Guide: anchors keep native navigation and can be adapted by your application router."
    />
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
  args: { children: 'Routed docs' },
  render: args => (
    <LinkDestination
      args={args}
      introduction="Rendered by an application router: "
      destination="Router destination: the application adapter forwards href, children, and native anchor props."
      router
    />
  )
}

export const Subtle: Story = {
  args: { variant: 'subtle', children: 'Settings' },
  render: args => (
    <LinkDestination
      args={args}
      destination="Settings: choose a theme and color mode from the Storybook toolbar."
    />
  )
}

export const External: Story = {
  args: { href: 'https://example.com', external: true, children: 'Example (external)' }
}

export const Tones: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {(['accent', 'neutral', 'warning', 'danger'] as const).map(tone => (
        <p
          key={tone}
          style={{ margin: 0 }}
        >
          <Link
            {...args}
            href="#tone-destination"
            tone={tone}
          >
            {tone} inline
          </Link>
          {' · '}
          <Link
            {...args}
            href="#tone-destination"
            variant="subtle"
            tone={tone}
          >
            {tone} subtle
          </Link>
        </p>
      ))}
      <span id="tone-destination">Tone link destination.</span>
    </div>
  )
}
