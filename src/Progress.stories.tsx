import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Progress, Button } from './index.js'
const meta = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    docs: {
      description: {
        component:
          'Native progress for task completion, named with a native label, aria-label or aria-labelledby. Minimum is zero and max defaults to 100. Value must be finite within the range; omit it or pass null for indeterminate work. Native range semantics remain owned by the element; aria-valuetext can express a meaningful phase. This is read-only feedback, not an input or a meter for resource usage. No timers, focus management or automatic live announcements are added. Indeterminate styling is static so reduced-motion users retain the same signal. Use visible status and coarse milestone announcements rather than reading every rapid update.'
      }
    }
  }
} satisfies Meta<typeof Progress>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <div style={{ width: '20rem', maxWidth: '100%' }}>
      <label htmlFor="default-progress">Export progress</label>
      <Progress
        id="default-progress"
        value={40}
      />
      <p>40 of 100 items exported.</p>
    </div>
  )
}
export const Indeterminate: Story = {
  render: () => (
    <div style={{ width: '20rem', maxWidth: '100%' }}>
      <Progress aria-label="Preparing export" />
      <p>Preparing the export. The remaining amount is unknown.</p>
    </div>
  )
}
export const Customisation: Story = {
  render: () => (
    <div style={{ width: '20rem', maxWidth: '100%' }}>
      <Progress
        aria-label="Upload progress"
        value={3}
        max={5}
        style={{
          '--rad-progress-height': '1rem',
          '--rad-progress-radius': '.25rem',
          '--rad-progress-indicator-color': 'var(--rad-color-warning)'
        }}
      />
      <p>3 of 5 files uploaded.</p>
    </div>
  )
}
function UpdateExample() {
  const [value, setValue] = useState(0)
  return (
    <div style={{ display: 'grid', gap: '1rem', width: '20rem', maxWidth: '100%' }}>
      <Progress
        aria-label="Local export progress"
        value={value}
      />
      <p>{value}% complete.</p>
      <Button
        onClick={() => setValue(number => Math.min(100, number + 25))}
        disabled={value === 100}
      >
        Advance export
      </Button>
    </div>
  )
}
export const Updates: Story = { render: () => <UpdateExample /> }
