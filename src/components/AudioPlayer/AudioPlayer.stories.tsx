import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { toneDataUrl } from '../../a2ui/mediaFixtures.js'
import { AudioPlayer, AudioPlayerGroup, LocaleProvider, Stack } from '../../index.js'

const clip = toneDataUrl(12)
const labels = { playLabel: 'Play', pauseLabel: 'Pause', seekLabel: 'Seek' } as const

const meta = {
  title: 'Components/AudioPlayer',
  component: AudioPlayer,
  args: { ...labels, src: clip, 'aria-label': 'Voice note' },
  parameters: {
    docs: {
      description: {
        component:
          'A player for short clips on one native `<audio>` element: a play/pause toggle whose name switches, a `Slider` scrubber and the elapsed and total time in the locale digits. `compact` keeps only the toggle and needs an accessible name. Inside an `AudioPlayerGroup`, starting one player pauses the one playing.'
      }
    }
  }
} satisfies Meta<typeof AudioPlayer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByRole('slider', { name: 'Seek' })).toBeEnabled())
    await expect(canvas.getByRole('button', { name: 'Play' })).toBeEnabled()
  }
}

export const SharedControlSizes: Story = {
  render: args => (
    <Stack gap="normal">
      {(['small', 'medium', 'large'] as const).map(size => (
        <AudioPlayer
          key={size}
          {...labels}
          src={args.src}
          controlSize={size}
          aria-label={`Voice note, ${size}`}
        />
      ))}
    </Stack>
  )
}

export const Compact: Story = {
  render: args => (
    <AudioPlayer
      compact
      playLabel="Play"
      pauseLabel="Pause"
      src={args.src}
      aria-label="Preview of the ringtone"
    />
  )
}

export const OnePlayingAtATime: Story = {
  render: args => (
    <AudioPlayerGroup>
      <Stack gap="normal">
        <AudioPlayer
          {...labels}
          src={args.src}
          aria-label="First message"
        />
        <AudioPlayer
          {...labels}
          src={args.src}
          aria-label="Second message"
        />
      </Stack>
    </AudioPlayerGroup>
  )
}

export const Widths: Story = {
  render: args => (
    <Stack gap="airy">
      {['360px', '720px'].map(width => (
        <div
          key={width}
          style={{ width, maxWidth: '100%' }}
        >
          <AudioPlayer
            {...labels}
            src={args.src}
            aria-label={`Voice note at ${width}`}
          />
        </div>
      ))}
    </Stack>
  )
}

export const LoadError: Story = {
  args: { src: 'data:audio/wav;base64,AAAA', errorText: 'This clip cannot be played.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('This clip cannot be played.')).toBeVisible())
  }
}

export const RightToLeft: Story = {
  render: args => (
    <LocaleProvider locale="ar-EG">
      <AudioPlayer
        playLabel="تشغيل"
        pauseLabel="إيقاف مؤقت"
        seekLabel="تقديم"
        src={args.src}
        aria-label="رسالة صوتية"
      />
    </LocaleProvider>
  )
}
