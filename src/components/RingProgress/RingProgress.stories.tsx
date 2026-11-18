import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MotionProvider } from '../../motion/react.js'
import { Button } from '../Button/Button.js'
import { RingProgress } from './RingProgress.js'

const meta = {
  title: 'Components/RingProgress',
  component: RingProgress,
  args: { 'aria-label': 'Upload progress', value: 62, label: '62%' }
} satisfies Meta<typeof RingProgress>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

function Upload() {
  const [value, setValue] = useState(20)
  return (
    <MotionProvider>
      <div className="grid justify-items-center gap-4">
        <RingProgress
          aria-label="Upload progress"
          value={value}
          label={value + '%'}
        />
        <Button onClick={() => setValue(current => Math.min(100, current + 20))}>
          Finish next file
        </Button>
      </div>
    </MotionProvider>
  )
}

export const TrackAnUpload: Story = { render: () => <Upload /> }

export const ReadStorageAllocation: Story = {
  render: () => (
    <RingProgress
      kind="meter"
      aria-label="Storage used"
      aria-valuetext="64 gigabytes used out of 100"
      segments={[
        { value: 40, tone: 'accent' },
        { value: 24, tone: 'warning' }
      ]}
      label="64 GB"
    />
  )
}
