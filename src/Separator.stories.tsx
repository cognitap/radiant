import type { Meta, StoryObj } from '@storybook/react-vite'
import { Separator, Button } from './index.js'
const meta = {
  title: 'Components/Separator',
  component: Separator,
  parameters: {
    docs: {
      description: {
        component:
          'Static native thematic separation. Default horizontal and meaningful; decorative hides visual-only divisions. Vertical separators stretch in a sized flex row or take an explicit height. They are never focusable splitters. Native hr refs, caller styles and theme color/thickness/style/spacing remain available.'
      }
    }
  }
} satisfies Meta<typeof Separator>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <div style={{ width: '20rem', maxWidth: '100%', display: 'grid', gap: '1rem' }}>
      <p>Account settings</p>
      <Separator />
      <p>Notification settings</p>
    </div>
  )
}
export const Vertical: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A vertical separator between groups in a row. It stretches to the row height; outside a sized flex row, give it an explicit height.'
      }
    }
  },
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '3rem' }}>
      <Button variant="outline">Undo</Button>
      <Button variant="outline">Redo</Button>
      <Separator orientation="vertical" />
      <Button>Save</Button>
    </div>
  )
}
export const Decorative: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A separator is announced by default. Mark it decorative when the surrounding structure already divides the content, such as a rule under a heading, so screen readers skip it.'
      }
    }
  },
  render: () => (
    <section style={{ width: '20rem', maxWidth: '100%', display: 'grid', gap: '0.5rem' }}>
      <h3 style={{ margin: 0 }}>Billing</h3>
      <Separator decorative />
      <p style={{ margin: 0 }}>Your plan renews on the first of each month.</p>
    </section>
  )
}
export const Customisation: Story = {
  args: {
    style: {
      width: '18rem',
      '--rad-separator-thickness': '3px',
      '--rad-separator-style': 'dashed',
      '--rad-separator-color': 'var(--rad-color-accent)'
    }
  }
}
