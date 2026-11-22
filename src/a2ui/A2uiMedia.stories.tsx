import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { A2uiSurface } from './A2uiSurface.js'
import { A2UI_BASIC_CATALOG_ID, A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import { A2uiMediaProvider } from './media.js'
import { lucideA2uiIcons } from './lucide.js'
import {
  audioPlayerFixtureMessages,
  iconFixtureMessages,
  imageFixtureMessages,
  MEDIA_SURFACE_ID,
  toneDataUrl,
  videoFixtureMessages
} from './mediaFixtures.js'

const meta = {
  title: 'A2UI/Media',
  component: A2uiSurface,
  args: { surfaceId: MEDIA_SURFACE_ID, messages: iconFixtureMessages },
  render: args => (
    <div className="grid max-w-md gap-4">
      <A2uiMediaProvider icons={lucideA2uiIcons}>
        <A2uiSurface {...args} />
      </A2uiMediaProvider>
    </div>
  )
} satisfies Meta<typeof A2uiSurface>

export default meta

type Story = StoryObj<typeof meta>

export const Icons: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('img', { name: 'Warning' })).toBeVisible()
    await expect(canvas.getByRole('img', { name: 'Summit' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Search' })).toBeVisible()
  }
}

export const Image: Story = {
  args: { messages: imageFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('img', { name: 'A blue lake under a yellow sun' })
    ).toBeVisible()
  }
}

export const Video: Story = {
  args: { messages: videoFixtureMessages },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('video')).not.toBeNull())
    const video = canvasElement.querySelector('video')!
    await expect(video).toHaveAttribute('aria-label', 'Lake tour')
    await expect(video.controls).toBe(true)
  }
}

export const AudioPlayer: Story = {
  args: { messages: audioPlayerFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Morning birdsong at the lake')).toBeVisible()
    await expect(canvasElement.querySelector('audio')!.controls).toBe(true)
  }
}

export const AudioPlayerWithLabels: Story = {
  args: {
    messages: [
      {
        version: A2UI_PROTOCOL_VERSION,
        createSurface: {
          surfaceId: MEDIA_SURFACE_ID,
          catalogId: A2UI_BASIC_CATALOG_ID,
          components: [
            { id: 'root', component: 'Column', children: ['clip'] },
            {
              id: 'clip',
              component: 'AudioPlayer',
              url: toneDataUrl(12),
              description: 'Morning birdsong at the lake'
            }
          ]
        }
      }
    ],
    labels: {
      audioPlay: 'Play',
      audioPause: 'Pause',
      audioSeek: 'Seek',
      audioError: 'This clip cannot be played.'
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('group', { name: 'Morning birdsong at the lake' })
    ).toBeVisible()
    await waitFor(() => expect(canvas.getByRole('slider', { name: 'Seek' })).toBeEnabled())
    await expect(canvas.getByRole('button', { name: 'Play' })).toBeEnabled()
  }
}
