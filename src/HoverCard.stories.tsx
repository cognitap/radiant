import { useId, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within, waitFor } from 'storybook/test'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  HoverCardPortal,
  Avatar,
  Badge,
  Link,
  Button,
  Checkbox,
  type HoverCardProps,
  type HoverCardContentProps,
  type HoverCardRenderProps
} from './index.js'
import { MotionProvider } from './motion/react.js'
type Options = Pick<HoverCardProps, 'openDelay' | 'closeDelay' | 'defaultOpen'> &
  Pick<
    HoverCardContentProps,
    'side' | 'align' | 'sideOffset' | 'collisionPadding' | 'motion' | 'className' | 'style'
  > & { dir?: 'ltr' | 'rtl' }
const layout = {
  display: 'grid',
  gap: '1rem',
  width: 'min(30rem,calc(100vw - 2rem))',
  maxWidth: '100%'
}
const meta = {
  title: 'Components/HoverCard',
  component: Contributor,
  args: {
    openDelay: 500,
    closeDelay: 150,
    defaultOpen: false,
    side: 'bottom',
    align: 'start',
    sideOffset: 8,
    collisionPadding: 8,
    motion: 'inherit',
    dir: 'ltr'
  },
  argTypes: {
    openDelay: { control: { type: 'number', min: 0 } },
    closeDelay: { control: { type: 'number', min: 0 } },
    defaultOpen: { control: 'boolean', name: 'Initially open' },
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    sideOffset: { control: { type: 'number', min: 0 } },
    collisionPadding: { control: { type: 'number', min: 0 } },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] }
  },
  render: args => (
    <MotionProvider>
      <Contributor {...args} />
    </MotionProvider>
  )
} satisfies Meta<Options>
export default meta
type Story = StoryObj<typeof meta>
async function settledPreview(canvasElement: HTMLElement) {
  await waitFor(
    () => {
      const content = canvasElement.querySelector<HTMLElement>('[data-slot~="hover-card-content"]')
      expect(content).not.toBeNull()
      expect(content!.matches(':popover-open')).toBe(true)
      expect(Number(getComputedStyle(content!).opacity)).toBe(1)
    },
    { timeout: 3000 }
  )
}
function Contributor({ openDelay, closeDelay, defaultOpen, dir, ...surface }: Options) {
  const id = useId()
  return (
    <article
      style={layout}
      dir={dir}
    >
      <p>
        Reviewed by{' '}
        <HoverCard
          defaultOpen={defaultOpen}
          openDelay={openDelay}
          closeDelay={closeDelay}
        >
          <HoverCardTrigger href={`#${id}-profile`}>Lee Chen</HoverCardTrigger>
          <HoverCardPortal>
            <HoverCardContent {...surface}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <Avatar
                  alt=""
                  fallback="LC"
                />
                <h3 style={{ margin: 0 }}>Lee Chen</h3>
              </div>
              <p style={{ margin: 0 }}>
                Design systems engineer helping teams build calmer interfaces.
              </p>
              <Link href={`#${id}-profile`}>Read full profile</Link>
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
        .
      </p>
      <section
        id={`${id}-profile`}
        tabIndex={-1}
      >
        <h3>Contributor profile</h3>
        <p>
          Lee maintains interaction patterns, reviews keyboard flows and writes practical guides for
          the design team.
        </p>
      </section>
    </article>
  )
}
export const Default: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement),
      trigger = canvas.getByRole('link', { name: 'Lee Chen' })
    trigger.focus()
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
    await waitFor(() =>
      expect(canvas.getByRole('link', { name: 'Read full profile' })).toBeVisible()
    )
    await userEvent.keyboard('{Escape}')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  }
}
function Project({ openDelay, closeDelay, defaultOpen, dir, ...surface }: Options) {
  const id = useId(),
    [open, setOpen] = useState(defaultOpen ?? false),
    [pinned, setPinned] = useState(false)
  return (
    <div
      style={layout}
      dir={dir}
    >
      <Checkbox
        label="Keep project preview open"
        checked={pinned}
        onChange={event => {
          setPinned(event.target.checked)
          setOpen(event.target.checked)
        }}
      />
      <p>
        Next milestone:{' '}
        <HoverCard
          open={open}
          onOpenChange={next => {
            if (!pinned) setOpen(next)
          }}
          openDelay={openDelay}
          closeDelay={closeDelay}
        >
          <HoverCardTrigger href={`#${id}-project`}>Website refresh</HoverCardTrigger>
          <HoverCardPortal>
            <HoverCardContent {...surface}>
              <h3 style={{ margin: 0 }}>Website refresh</h3>
              <Badge
                tone="accent"
                className="w-fit"
              >
                In progress
              </Badge>
              <p style={{ margin: 0 }}>
                Navigation and search are ready. Content review is the remaining milestone.
              </p>
              <Link href={`#${id}-project`}>Open project details</Link>
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
      </p>
      <section
        id={`${id}-project`}
        tabIndex={-1}
      >
        <h3>Project details</h3>
        <p>Owner: Product team. Next review: Friday.</p>
      </section>
    </div>
  )
}
export const ReviewingProjectProgress: Story = {
  render: args => (
    <MotionProvider>
      <Project {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Keep project preview open' }))
    await expect(canvas.getByRole('link', { name: 'Website refresh' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    await settledPreview(canvasElement)
  }
}
function RouterAnchor(props: HoverCardRenderProps) {
  return <a {...props}>{props.children}</a>
}
function Resource({ openDelay, closeDelay, defaultOpen, dir, ...surface }: Options) {
  const ref = useRef<HTMLAnchorElement>(null),
    [message, setMessage] = useState('No navigation requested.'),
    [confirm, setConfirm] = useState(true)
  return (
    <div
      style={layout}
      dir={dir}
    >
      <Checkbox
        label="Confirm external navigation"
        checked={confirm}
        onChange={event => setConfirm(event.target.checked)}
      />
      <Button
        variant="ghost"
        onClick={() => ref.current?.focus()}
      >
        Focus resource link
      </Button>
      <output aria-live="polite">{message}</output>
      <p>
        Reference:{' '}
        <HoverCard
          defaultOpen={defaultOpen}
          openDelay={openDelay}
          closeDelay={closeDelay}
        >
          <HoverCardTrigger
            href="https://www.w3.org/WAI/"
            external
            ref={ref}
            render={props => <RouterAnchor {...props} />}
            onClick={event => {
              if (confirm) {
                event.preventDefault()
                setMessage('External resource is ready. Disable confirmation to open it.')
              } else setMessage('Opening accessibility resources.')
            }}
          >
            Accessibility resources
          </HoverCardTrigger>
          <HoverCardPortal>
            <HoverCardContent {...surface}>
              <h3 style={{ margin: 0 }}>Web Accessibility Initiative</h3>
              <p style={{ margin: 0 }}>Guides and standards for building accessible experiences.</p>
              <p style={{ margin: 0 }}>Opens w3.org in a new tab.</p>
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
      </p>
    </div>
  )
}
export const OpeningReferenceMaterial: Story = {
  render: args => (
    <MotionProvider>
      <Resource {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('link', { name: 'Accessibility resources' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('External resource is ready.')
  }
}
function Related({ openDelay, closeDelay, defaultOpen, dir, ...surface }: Options) {
  const id = useId()
  return (
    <div
      style={layout}
      dir={dir}
    >
      <h3>Continue reading</h3>
      <ul>
        <li>
          <HoverCard
            defaultOpen={defaultOpen}
            openDelay={openDelay}
            closeDelay={closeDelay}
          >
            <HoverCardTrigger href={`#${id}-focus`}>Designing focus flows</HoverCardTrigger>
            <HoverCardPortal>
              <HoverCardContent
                {...surface}
                style={{ '--rad-hover-card-width': '18rem', ...surface.style }}
              >
                <h3 style={{ margin: 0 }}>Designing focus flows</h3>
                <p style={{ margin: 0 }}>
                  A short guide to predictable keyboard paths across related actions.
                </p>
                <Link href={`#${id}-focus`}>Read the guide</Link>
              </HoverCardContent>
            </HoverCardPortal>
          </HoverCard>
        </li>
        <li>
          <Link href={`#${id}-forms`}>Grouping forms</Link>
        </li>
      </ul>
      <section
        id={`${id}-focus`}
        tabIndex={-1}
      >
        <h3>Designing focus flows</h3>
        <p>Start with native controls, group related actions and keep focus visible.</p>
      </section>
      <section
        id={`${id}-forms`}
        tabIndex={-1}
      >
        <h3>Grouping forms</h3>
        <p>Give related fields a clear shared name.</p>
      </section>
    </div>
  )
}
export const ExploringRelatedReading: Story = {
  args: { openDelay: 200, closeDelay: 200, defaultOpen: true },
  render: args => (
    <MotionProvider>
      <Related {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('link', { name: 'Designing focus flows' })
    if (trigger.getAttribute('aria-expanded') !== 'true') trigger.focus()
    await settledPreview(canvasElement)
  }
}
