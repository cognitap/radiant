import type { Meta, StoryObj } from '@storybook/react-vite'
import { AspectRatio } from './AspectRatio.js'
import {
  landscape,
  mediaStyle,
  videoSource,
  embeddedDocument
} from '../.storybook/examples/AspectRatioExamples.js'
const meta = {
  title: 'Components/AspectRatio',
  component: AspectRatio,
  args: { ratio: 1 },
  argTypes: { ratio: { control: { type: 'number', min: 0.1, step: 0.1 } } },
  parameters: {
    docs: {
      description: {
        component:
          'A native CSS aspect-ratio box reserves space before media loads. The root adds no semantics; images, video and embeds keep their own accessible names and behavior. Size media to fill the box and choose object-fit on the media itself. Native root props, refs, classes and styles reach the div.'
      }
    }
  }
} satisfies Meta<typeof AspectRatio>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: args => (
    <div style={{ width: '24rem', maxWidth: '100%' }}>
      <AspectRatio
        {...args}
        style={{ borderRadius: 'var(--rad-surface-radius,0.75rem)' }}
      >
        <img
          src={landscape}
          alt="Green mountains beneath a golden sun"
          style={mediaStyle}
        />
      </AspectRatio>
    </div>
  )
}
export const PlayingVideo: Story = {
  render: () => (
    <div style={{ width: '32rem', maxWidth: '100%' }}>
      <AspectRatio ratio={16 / 9}>
        <video
          aria-label="Flowers in a garden"
          src={videoSource}
          poster={landscape}
          controls
          muted
          playsInline
          preload="none"
          style={mediaStyle}
        />
      </AspectRatio>
    </div>
  )
}
export const EmbeddingContent: Story = {
  render: () => (
    <div style={{ width: '32rem', maxWidth: '100%' }}>
      <AspectRatio ratio={4 / 3}>
        <iframe
          title="Studio notes"
          srcDoc={embeddedDocument}
          sandbox=""
          style={{ ...mediaStyle, border: 0 }}
        />
      </AspectRatio>
    </div>
  )
}
