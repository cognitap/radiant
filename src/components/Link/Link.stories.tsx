import { useId } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link, type LinkProps } from '../../index.js'

function LinkToNotes(args: LinkProps) {
  const id = useId()
  const link = (
    <Link
      {...args}
      href={`#${id}`}
      target="_self"
    />
  )

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {args.variant === 'inline' || args.variant === 'subtle' ? (
        <p style={{ margin: 0 }}>Start with the {link}.</p>
      ) : (
        <div>{link}</div>
      )}
      <section
        aria-label="Project notes"
        id={id}
        tabIndex={-1}
      >
        Keep each change small enough to review.
      </section>
    </div>
  )
}

const meta = {
  title: 'Components/Link',
  component: Link,
  args: { children: 'project notes', variant: 'inline', tone: 'accent' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['accent', 'neutral', 'warning', 'danger'] },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] }
  },
  render: args => <LinkToNotes {...args} />
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  argTypes: {
    variant: { control: 'inline-radio', options: ['inline', 'subtle'] }
  },
  parameters: { controls: { include: ['variant', 'tone'] } }
}

export const StyledAsButton: Story = {
  args: { children: 'Open project notes', variant: 'outline', controlSize: 'medium' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'soft', 'outline', 'ghost'] }
  },
  parameters: { controls: { include: ['variant', 'tone', 'controlSize'] } }
}
