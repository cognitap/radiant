import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { StageProps } from '../../index.js'
import {
  Button,
  Input,
  Skeleton,
  Stage,
  StageActions,
  StageBody,
  StageDescription,
  StageExpand,
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
          'A passive div frame for custom widgets with StageHeader, StageTitle, StageDescription, StageActions, StageBody and StageFooter parts. With `expandTo`, StageExpand moves the Stage into a modal dialog or docked panel without remounting the widget. Stage is an inline-size container: below 30rem the actions sit under the title and footer items stack; wider, the actions sit beside the title and footer items share a row. StageBody `aspectRatio` holds the body size while content changes and clips taller content. Stage gives actions and footer no meaning; the app fills them.'
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

function ExpandIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" />
    </svg>
  )
}

function NotesStage({
  expandTo,
  ...owner
}: Pick<StageProps, 'expandTo' | 'open' | 'onOpenChange'>) {
  return (
    <div style={{ width: '300px', maxWidth: '100%' }}>
      <Stage
        expandTo={expandTo}
        {...(owner as object)}
      >
        <StageHeader>
          <StageTitle level={3}>{expandTo === 'panel' ? 'Panel notes' : 'Dialog notes'}</StageTitle>
          <StageDescription>Type, expand, and keep typing.</StageDescription>
          <StageActions>
            <StageExpand
              variant="ghost"
              expandLabel="Expand notes"
              collapseLabel="Collapse notes"
            >
              <ExpandIcon />
            </StageExpand>
          </StageActions>
        </StageHeader>
        <StageBody>
          <Input aria-label="Note" />
        </StageBody>
      </Stage>
    </div>
  )
}

export const Expand: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'StageExpand opens the same widget as a modal dialog or a docked panel. Typed text, focus and scroll survive; Escape collapses.'
      }
    }
  },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
      <NotesStage expandTo="dialog" />
      <NotesStage expandTo="panel" />
    </div>
  )
}

function ControlledStage() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'grid', gap: '0.5rem', justifyItems: 'start' }}>
      <Button
        type="button"
        onClick={() => setOpen(true)}
      >
        Open from outside
      </Button>
      <NotesStage
        expandTo="dialog"
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}

export const Controlled: Story = {
  render: () => <ControlledStage />
}
