import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Link, type LinkProps } from './index.js'

import { LinkPlayground, RouterAnchor } from '../.storybook/examples/LinkExamples.js'

const destinationClass =
  'target:[outline:var(--rad-focus-width)_var(--rad-focus-style)_var(--rad-color-focus)] target:[outline-offset:var(--rad-focus-offset)]'

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
  const [route, setRoute] = useState<string | null>(null)

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
              ? props => (
                  <RouterAnchor
                    {...props}
                    navigate={setRoute}
                  />
                )
              : undefined)
          }
        />
        {continuation}
      </p>
      {router ? <output>{route ? 'Guide opened.' : 'Guide not opened yet.'}</output> : null}
      <section
        id={`${id}-destination`}
        tabIndex={-1}
        className={destinationClass}
      >
        {destination}
      </section>
    </div>
  )
}

function LinksInText() {
  const id = useId()
  return (
    <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '38rem' }}>
      <p style={{ margin: 0, lineHeight: 1.6 }}>
        Every component follows the <Link href={`#${id}-guide`}>shared conventions</Link>, so a{' '}
        <Link
          href={`#${id}-guide`}
          tone="neutral"
        >
          neutral link
        </Link>{' '}
        reads like the text around it.
      </p>
      <p style={{ margin: 0, lineHeight: 1.6 }}>
        Your trial ends in three days.{' '}
        <Link
          href={`#${id}-billing`}
          tone="warning"
        >
          Choose a plan
        </Link>{' '}
        or{' '}
        <Link
          href={`#${id}-billing`}
          tone="danger"
        >
          delete the workspace
        </Link>
        .
      </p>
      <nav aria-label="Footer">
        <ul style={{ display: 'flex', gap: '1rem', margin: 0, padding: 0, listStyle: 'none' }}>
          {(
            [
              ['accent', 'Docs'],
              ['neutral', 'About'],
              ['warning', 'Status'],
              ['danger', 'Report abuse']
            ] as const
          ).map(([tone, label]) => (
            <li key={tone}>
              <Link
                href={`#${id}-guide`}
                variant="subtle"
                tone={tone}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <section
        aria-label="Guide"
        className={destinationClass}
        id={`${id}-guide`}
        tabIndex={-1}
      >
        Guide: conventions every component shares.
      </section>
      <section
        aria-label="Billing"
        className={destinationClass}
        id={`${id}-billing`}
        tabIndex={-1}
      >
        Billing: plans and workspace deletion.
      </section>
    </div>
  )
}

function LinkActions() {
  const id = useId()
  const [clicks, setClicks] = useState(0)

  return (
    <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '38rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        {(['solid', 'soft', 'outline', 'ghost'] as const).map(variant => (
          <Link
            key={variant}
            href={`#${id}-start`}
            variant={variant}
          >
            Get started ({variant})
          </Link>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
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
        >
          Review deletion
        </Link>
        <Link
          href={`#${id}-deletion`}
          variant="outline"
          tone="neutral"
        >
          Read the policy
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

function LinkSizeComparison() {
  const id = useId()
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {(['small', 'medium', 'large'] as const).map(controlSize => (
        <div
          key={controlSize}
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <Link
            href={`#${id}`}
            variant="solid"
            controlSize={controlSize}
          >
            Open {controlSize}
          </Link>
          <Button
            type="button"
            variant="outline"
            controlSize={controlSize}
          >
            Save {controlSize}
          </Button>
        </div>
      ))}
      <span id={id}>Size link destination.</span>
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
          'A native anchor for navigation. inline/subtle inherit text size; solid/soft/outline/ghost share Button presentation through variant, tone and controlSize. Link stays server-renderable. For theme-driven press springs, import MotionProvider and MotionLink from @cognitap/radiant/motion/react; inline/subtle never compress, motion="off" disables spatial feedback and reduced motion always wins. Enter navigates; Space scrolls. className, style and ref target the anchor. render forwards resolved props/ref/children to one native or router anchor; modified clicks, targets and downloads retain browser behavior. Use Button for actions or pending/disabled states.'
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

export const InlineInText: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'inline links underline inside prose and inherit its text size. subtle links stay plain until hover, which suits footers and lists. tone colors either treatment.'
      }
    }
  },
  render: () => <LinksInText />
}

export const ToExternalSite: Story = {
  args: { href: 'https://example.com', external: true, children: 'Example (opens in a new tab)' },
  parameters: {
    docs: {
      description: {
        story:
          'external defaults target to _blank and rel to noopener noreferrer. Explicit target or rel values win. Say in the link text that it opens a new tab.'
      }
    }
  },
  render: args => (
    <p style={{ margin: 0, lineHeight: 1.6 }}>
      Radiant renders a native anchor. Read more on <Link {...args} />.
    </p>
  )
}

export const WithRouter: Story = {
  args: { children: 'Open the routed guide' },
  parameters: {
    docs: {
      description: {
        story:
          'A consumer-owned router forwards the resolved anchor props and ref. It calls onClick once before routing; cancellation, modified clicks, target and download keep their native meanings. Use your framework router in the same render callback.'
      }
    }
  },
  render: args => (
    <LinkDestination
      args={args}
      introduction="Rendered by an application router: "
      destination="Router destination: the application adapter forwards href, children, and native anchor props."
      router
    />
  )
}

export const StyledAsButton: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'solid, soft, outline and ghost share Button presentation through variant, tone and controlSize. They stay native anchors: click or Enter navigates, Space scrolls. Use Button for actions and pending or disabled states.'
      }
    }
  },
  render: () => <LinkActions />
}

export const WithPressMotion: Story = {
  args: {
    children: 'Explore the launchpad',
    variant: 'solid',
    tone: 'accent',
    controlSize: 'large'
  },
  parameters: {
    docs: {
      description: {
        story:
          'MotionLink from @cognitap/radiant/motion/react adds theme-driven press springs to action-shaped links. inline and subtle never compress. motion="off" turns off spatial feedback, and system reduced motion always wins.'
      }
    }
  },
  render: args => <LinkPlayground {...args} />
}

export const SharedControlSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => <LinkSizeComparison />
}
