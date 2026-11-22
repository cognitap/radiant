import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import {
  RegionStage,
  RegionStageControls,
  RegionStagePin,
  RegionStageRegion,
  RegionStageViewport,
  Stage,
  StageBody,
  StageDescription,
  StageHeader,
  StageTitle,
  type RegionStageSeries
} from '../../index.js'

const meta = {
  title: 'Components/RegionStage',
  component: RegionStage,
  parameters: {
    docs: {
      description: {
        component:
          'A drawing in its own `viewBox` that pans and zooms by pointer drag, pinch, wheel and keyboard, with named regions to select and pins with callouts. RegionStageControls adds zoom in, zoom out and reset buttons from required labels. Regions are toggle buttons; selection follows `type`, `value` and `onValueChange`. Regions and pins share one tab stop and arrow keys move through them in document order; `+`, `-`, `0` and Shift with an arrow zoom, reset and pan. `series` fills a region with a categorical color. Callouts are Popovers anchored to their pin and follow it while the view moves. Animated view changes jump under reduced motion.'
      }
    }
  }
} satisfies Meta<typeof RegionStage>

export default meta
type Story = StoryObj<typeof meta>

const rooms: { value: string; label: string; d: string; series?: RegionStageSeries }[] = [
  { value: 'lobby', label: 'Lobby', d: 'M10 10h140v100H10z', series: 1 },
  { value: 'kitchen', label: 'Kitchen', d: 'M160 10h110v100H160z', series: 2 },
  { value: 'studio', label: 'Studio', d: 'M280 10h110v220H280z', series: 3 },
  { value: 'meeting', label: 'Meeting room', d: 'M10 120h140v110H10z' },
  { value: 'storage', label: 'Storage', d: 'M160 120h110v110H160z', series: 6 }
]

function Plan({ pins = false }: { pins?: boolean }) {
  return (
    <RegionStageViewport viewBox="0 0 400 240">
      {rooms.map(room => (
        <RegionStageRegion
          key={room.value}
          value={room.value}
          aria-label={room.label}
          series={room.series}
          d={room.d}
        />
      ))}
      {pins ? (
        <>
          <RegionStagePin
            x={150}
            y={60}
            aria-label="Fire exit"
          >
            <p className="m-0 font-semibold">Fire exit</p>
            <p className="m-0">Leads to the north stairwell.</p>
          </RegionStagePin>
          <RegionStagePin
            x={335}
            y={200}
            aria-label="First aid kit"
          >
            <p className="m-0">First aid kit on the east wall.</p>
          </RegionStagePin>
        </>
      ) : null}
    </RegionStageViewport>
  )
}

const controls = (
  <RegionStageControls
    zoomInLabel="Zoom in"
    zoomOutLabel="Zoom out"
    zoomResetLabel="Reset view"
  />
)

export const Default: Story = {
  args: { 'aria-label': 'Office floor plan' },
  render: () => (
    <div style={{ width: '480px', maxWidth: '100%' }}>
      <RegionStage
        aria-label="Office floor plan"
        defaultValue="kitchen"
      >
        {controls}
        <Plan />
      </RegionStage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Kitchen' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Lobby' }))
    await expect(canvas.getByRole('button', { name: 'Lobby' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  }
}

export const KeyboardHint: Story = {
  args: { 'aria-label': 'Office floor plan' },
  parameters: {
    docs: {
      description: {
        story:
          'The shortcuts are not discoverable, so a visible hint describes the stage through `aria-describedby`.'
      }
    }
  },
  render: () => (
    <div style={{ display: 'grid', gap: '0.5rem', width: '480px', maxWidth: '100%' }}>
      <RegionStage
        aria-label="Office floor plan"
        aria-describedby="region-stage-keys"
      >
        {controls}
        <Plan />
      </RegionStage>
      <p
        id="region-stage-keys"
        className="m-0 text-[length:0.8125rem]"
      >
        Arrow keys move between rooms, Enter selects, plus and minus zoom, zero resets, and Shift
        with an arrow key pans.
      </p>
    </div>
  )
}

export const Multiple: Story = {
  args: { 'aria-label': 'Office floor plan' },
  render: () => (
    <div style={{ width: '480px', maxWidth: '100%' }}>
      <RegionStage
        aria-label="Rooms to book"
        type="multiple"
        defaultValue={['lobby', 'studio']}
      >
        {controls}
        <Plan />
      </RegionStage>
    </div>
  )
}

export const PinsWithCallouts: Story = {
  args: { 'aria-label': 'Office floor plan' },
  render: () => (
    <div style={{ width: '480px', maxWidth: '100%' }}>
      <RegionStage aria-label="Safety plan">
        {controls}
        <Plan pins />
      </RegionStage>
    </div>
  )
}

function ControlledPlan() {
  const [value, setValue] = useState<string[]>(['meeting'])
  return (
    <div style={{ display: 'grid', gap: '0.5rem', width: '480px', maxWidth: '100%' }}>
      <RegionStage
        aria-label="Rooms to clean"
        type="multiple"
        value={value}
        onValueChange={setValue}
      >
        {controls}
        <Plan />
      </RegionStage>
      <p
        className="m-0"
        aria-live="polite"
      >
        Selected: {value.length ? value.join(', ') : 'none'}
      </p>
    </div>
  )
}

export const Controlled: Story = {
  args: { 'aria-label': 'Office floor plan' },
  render: () => <ControlledPlan />
}

export const InStage: Story = {
  args: { 'aria-label': 'Office floor plan' },
  parameters: {
    docs: {
      description: {
        story:
          'Stage frames the drawing with a title; the stage names it through `aria-labelledby`.'
      }
    }
  },
  render: () => (
    <div style={{ width: '520px', maxWidth: '100%' }}>
      <Stage>
        <StageHeader>
          <StageTitle
            level={3}
            id="region-stage-title"
          >
            Second floor
          </StageTitle>
          <StageDescription>Choose a room to see its bookings.</StageDescription>
        </StageHeader>
        <StageBody>
          <RegionStage aria-labelledby="region-stage-title">
            {controls}
            <Plan pins />
          </RegionStage>
        </StageBody>
      </Stage>
    </div>
  )
}

export const Widths: Story = {
  args: { 'aria-label': 'Office floor plan' },
  parameters: {
    docs: {
      description: { story: 'The drawing scales to its container at 360px and 720px.' }
    }
  },
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {[360, 720].map(width => (
        <div
          key={width}
          style={{ width: `${width}px`, maxWidth: '100%' }}
        >
          <RegionStage aria-label={`Floor plan at ${width}px`}>
            {controls}
            <Plan pins />
          </RegionStage>
        </div>
      ))}
    </div>
  )
}

export const ImageBackdrop: Story = {
  args: { 'aria-label': 'Office floor plan' },
  parameters: {
    docs: {
      description: {
        story:
          'Any SVG content can sit behind the regions, such as an `<image>` of a scanned plan; regions and pins use the same coordinates.'
      }
    }
  },
  render: () => (
    <div style={{ width: '480px', maxWidth: '100%' }}>
      <RegionStage aria-label="Annotated photo">
        {controls}
        <RegionStageViewport viewBox="0 0 300 200">
          <image
            href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23cbd5e1'/%3E%3Ccircle cx='90' cy='100' r='50' fill='%2394a3b8'/%3E%3Crect x='170' y='50' width='90' height='110' fill='%2364748b'/%3E%3C/svg%3E"
            width="300"
            height="200"
          />
          <RegionStageRegion
            value="round"
            aria-label="Round part"
            series={4}
            fillOpacity={0.6}
          >
            <circle
              cx="90"
              cy="100"
              r="50"
            />
          </RegionStageRegion>
          <RegionStageRegion
            value="box"
            aria-label="Box part"
            series={5}
            fillOpacity={0.6}
            d="M170 50h90v110h-90z"
          />
        </RegionStageViewport>
      </RegionStage>
    </div>
  )
}
