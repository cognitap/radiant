import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spinner, Button } from './index.js'
const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    docs: {
      description: {
        component:
          'Compact visual activity feedback. Decorative by default beside visible loading text; label supplies an image name when standalone. It never creates a live region or moves focus. The application owns busy regions, useful status messages and removal on completion. Reduced motion, theme motion off and motion="off" keep a static visible arc. Sizes and named track/indicator parts remain customizable. Button pending reuses the decorative indicator while preserving its action name.'
      }
    }
  }
} satisfies Meta<typeof Spinner>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
      <Spinner />
      <span>Loading account…</span>
    </div>
  )
}
export const Standalone: Story = { args: { label: 'Loading account', controlSize: 'large' } }
export const Customisation: Story = {
  args: {
    label: 'Loading files',
    style: {
      '--rad-spinner-size': '3rem',
      '--rad-spinner-stroke-width': '3',
      '--rad-spinner-color': 'var(--rad-color-accent)',
      '--rad-spinner-duration': '1.5s'
    },
    parts: { track: { style: { opacity: 0.4 } } }
  }
}
export const MotionOff: Story = { args: { label: 'Loading account', motion: 'off' } }
export const PendingAction: Story = { render: () => <Button pending>Save settings</Button> }
