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
export const Decorative: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '3rem' }}>
      <Button>Save</Button>
      <Separator
        decorative
        orientation="vertical"
      />
      <Button variant="outline">Preview</Button>
    </div>
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
