import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, Button } from './index.js'
const image =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#d9e9df"/><circle cx="40" cy="29" r="15" fill="#346353"/><path d="M12 80v-8a28 28 0 0 1 56 0v8" fill="#346353"/></svg>'
  )
const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  args: { alt: 'Jordan Rivera' },
  parameters: {
    docs: {
      description: {
        component:
          'A fixed-size image/fallback graphic with one deliberate accessible name. Alt is required; use empty alt when decorative or named by adjacent text. Initials are visual fallback only, never a second name. Native image load/error events and cached request completion choose visible content. Applications own image URLs, privacy, alternative text and fallback text. Source changes preserve the root span and reset only image content. No announcements, timers, focus or animation engine are added.'
      }
    }
  }
} satisfies Meta<typeof Avatar>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { args: { alt: 'Jordan Rivera', src: image, fallback: 'JR' } }
export const Fallback: Story = { args: { alt: 'Jordan Rivera', fallback: 'JR' } }
export const Customisation: Story = {
  args: {
    alt: 'Jordan Rivera',
    src: image,
    fallback: 'JR',
    controlSize: 'large',
    style: {
      '--rad-avatar-size-large': '5rem',
      '--rad-avatar-radius': '.5rem',
      '--rad-avatar-border-width': '3px'
    },
    parts: { image: { style: { objectFit: 'contain' } } }
  }
}
function SourceExample() {
  const [available, setAvailable] = useState(true)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <Avatar
        alt=""
        src={available ? image : 'data:image/png;base64,broken'}
        fallback="JR"
      />
      <span>Jordan Rivera</span>
      <Button onClick={() => setAvailable(value => !value)}>
        {available ? 'Use unavailable image' : 'Restore image'}
      </Button>
    </div>
  )
}
export const ImageFailure: Story = { render: () => <SourceExample /> }
