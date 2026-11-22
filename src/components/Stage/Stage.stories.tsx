import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  Skeleton,
  Stage,
  StageActions,
  StageBody,
  StageDescription,
  StageFooter,
  StageHeader,
  StageTitle
} from '../../index.js'

const meta = {
  title: 'Components/Stage',
  component: Stage,
  parameters: {
    docs: {
      description: {
        component:
          'A passive div frame for custom widgets with StageHeader, StageTitle, StageDescription, StageActions, StageBody and StageFooter parts. Stage is a size container: below 30rem the actions sit under the title and footer items stack; wider, the actions sit beside the title and footer items share a row. StageBody `aspectRatio` holds the body size while content changes. Stage gives actions and footer no meaning; the app fills them.'
      }
    }
  }
} satisfies Meta<typeof Stage>

export default meta
type Story = StoryObj<typeof meta>

const hues = [200, 40, 140, 300]

function Swatch({ hue }: { hue: number }) {
  return (
    <div
      aria-hidden
      style={{
        borderRadius: '0.5rem',
        background: `linear-gradient(120deg, oklch(0.8 0.1 ${hue}), oklch(0.6 0.15 ${hue + 60}))`
      }}
    />
  )
}

function GradientStage({ width }: { width: string }) {
  const [index, setIndex] = useState(0)
  const hue = hues[index % hues.length]!
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <Stage>
        <StageHeader>
          <StageTitle>Gradient</StageTitle>
          <StageDescription>Hue {hue}, mixed in oklch.</StageDescription>
          <StageActions>
            <Button
              type="button"
              onClick={() => setIndex(index + 1)}
            >
              Shift hue
            </Button>
          </StageActions>
        </StageHeader>
        <StageBody aspectRatio={16 / 9}>
          <Swatch hue={hue} />
        </StageBody>
        <StageFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIndex(0)}
          >
            Reset
          </Button>
          <Button type="button">Copy CSS</Button>
        </StageFooter>
      </Stage>
    </div>
  )
}

export const Default: Story = {
  render: () => <GradientStage width="45rem" />
}

export const Widths: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The same Stage at 360px and 720px. Layout follows the Stage width, not the viewport.'
      }
    }
  },
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <GradientStage width="360px" />
      <GradientStage width="720px" />
    </div>
  )
}

function StreamingStage() {
  const [loaded, setLoaded] = useState(false)
  return (
    <div style={{ width: '360px', maxWidth: '100%' }}>
      <Stage>
        <StageHeader>
          <StageTitle>Streaming body</StageTitle>
          <StageDescription>The body keeps its 4:3 box while content arrives.</StageDescription>
        </StageHeader>
        <StageBody
          aspectRatio={4 / 3}
          aria-busy={loaded ? undefined : true}
        >
          {loaded ? <Swatch hue={140} /> : <Skeleton style={{ '--rad-skeleton-height': '100%' }} />}
        </StageBody>
        <StageFooter>
          <Button
            type="button"
            onClick={() => setLoaded(!loaded)}
          >
            {loaded ? 'Show skeleton' : 'Load content'}
          </Button>
        </StageFooter>
      </Stage>
    </div>
  )
}

export const StreamingBody: Story = {
  render: () => <StreamingStage />
}

export const Padding: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The theme decides how much space each `padding` step is; `normal` is the default.'
      }
    }
  },
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', width: '360px', maxWidth: '100%' }}>
      {(['tight', 'normal', 'airy'] as const).map(padding => (
        <Stage
          key={padding}
          padding={padding}
        >
          <StageTitle level={3}>{padding}</StageTitle>
        </Stage>
      ))}
    </div>
  )
}
