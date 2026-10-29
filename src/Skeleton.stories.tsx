import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton, Button } from './index.js'
const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component:
          'Empty visual content placeholders, always hidden from assistive technology. The application owns useful loading text, the content region’s aria-busy state, completion/error announcements and replacement with real content. Width, height, radius and color follow theme overrides and native span styling. System reduced motion, local motion off and theme motion off retain static shapes. No timers, loading state or animation engine are added.'
      }
    }
  }
} satisfies Meta<typeof Skeleton>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '.75rem', width: '20rem', maxWidth: '100%' }}>
      <Skeleton />
      <Skeleton style={{ width: '75%' }} />
      <Skeleton style={{ width: '50%' }} />
    </div>
  )
}
export const Customisation: Story = {
  args: {
    style: {
      '--rad-skeleton-width': '4rem',
      '--rad-skeleton-height': '4rem',
      '--rad-skeleton-radius': '50%',
      '--rad-skeleton-color': 'var(--rad-color-accent)',
      '--rad-skeleton-duration': '3s'
    }
  }
}
export const MotionOff: Story = { args: { motion: 'off', style: { width: '16rem' } } }
function LoadingExample() {
  const [loaded, setLoaded] = useState(false)
  return (
    <div style={{ display: 'grid', gap: '1rem', width: '20rem', maxWidth: '100%' }}>
      <section
        aria-label="Account details"
        aria-busy={!loaded}
      >
        {loaded ? (
          <p>Jordan Rivera. Email preferences are ready.</p>
        ) : (
          <div style={{ display: 'grid', gap: '.75rem' }}>
            <p>Loading account…</p>
            <Skeleton style={{ height: '3rem', width: '3rem', borderRadius: '50%' }} />
            <Skeleton />
            <Skeleton style={{ width: '65%' }} />
          </div>
        )}
      </section>
      <Button onClick={() => setLoaded(value => !value)}>
        {loaded ? 'Reload account' : 'Simulate account loaded'}
      </Button>
      <output aria-label="Account result">{loaded ? 'Account loaded.' : ''}</output>
    </div>
  )
}
export const LoadingComposition: Story = { render: () => <LoadingExample /> }
