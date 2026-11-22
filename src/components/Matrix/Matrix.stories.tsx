import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import {
  Matrix,
  MatrixCell,
  MatrixColumnHeader,
  MatrixCorner,
  MatrixMarker,
  MatrixRegion,
  MatrixRow,
  MatrixRowHeader,
  type MatrixCellState,
  type SeriesNumber
} from '../../index.js'

const meta = {
  title: 'Components/Matrix',
  component: Matrix,
  args: { 'aria-label': 'Seats', columns: 8, disabled: false },
  argTypes: {
    disabled: { control: 'boolean' },
    columns: { control: false },
    type: { control: false },
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A grid of cells under column headers, beside row headers. Arrow keys, Home, End and Ctrl+Home or End move between cells; Space or Enter selects a cell that has a `value`. Rows share column tracks of at least `components.matrix.cellSize`, and the Matrix scrolls sideways when they do not fit.'
      }
    }
  }
} satisfies Meta<typeof Matrix>

export default meta
type Story = StoryObj<typeof meta>

const rows = ['A', 'B', 'C', 'D']
const seats = [1, 2, 3, 4, 5, 6, 7, 8]
const taken = new Set(['A3', 'A4', 'C6', 'D1'])

function Seats({ disabled }: { disabled?: boolean }) {
  return (
    <Matrix
      aria-label="Seats"
      type="multiple"
      columns={seats.length}
      defaultValue={['B4']}
      disabled={disabled}
    >
      <MatrixRow>
        <MatrixCorner />
        {seats.map(seat => (
          <MatrixColumnHeader key={seat}>{seat}</MatrixColumnHeader>
        ))}
      </MatrixRow>
      {rows.map(row => (
        <MatrixRow key={row}>
          <MatrixRowHeader>Row {row}</MatrixRowHeader>
          {seats.map(seat => {
            const id = `${row}${seat}`
            return (
              <MatrixCell
                key={id}
                value={id}
                disabled={taken.has(id)}
              >
                {id}
              </MatrixCell>
            )
          })}
        </MatrixRow>
      ))}
      <MatrixRegion
        row={1}
        column={1}
        rowSpan={2}
        columnSpan={2}
        label="Quiet"
        series={3}
      />
    </Matrix>
  )
}

export const Default: Story = {
  render: args => <Seats disabled={args.disabled} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const seat = canvas.getByRole('gridcell', { name: 'C2' })
    await userEvent.click(seat)
    await expect(seat).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('gridcell', { name: 'B4' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  }
}

const hours = ['9', '10', '11', '12', '13', '14']
const rooms: {
  name: string
  cells: (null | { state?: MatrixCellState; series?: SeriesNumber })[]
}[] = [
  {
    name: 'Atlas',
    cells: [{ series: 1 }, { series: 1 }, null, null, { series: 2 }, null]
  },
  {
    name: 'Birch',
    cells: [null, { series: 3, state: 'active' }, { series: 3 }, null, null, null]
  },
  {
    name: 'Cove',
    cells: [{ state: 'muted' }, { state: 'muted' }, null, { state: 'highlighted' }, null, null]
  }
]

export const States: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A schedule without selection: series colors tell bookings apart, `active` marks the one in progress, `highlighted` draws attention and `muted` steps back. A region labels a block of cells.'
      }
    }
  },
  render: () => (
    <Matrix
      aria-label="Room bookings"
      columns={hours.length}
    >
      <MatrixRow>
        <MatrixCorner>Room</MatrixCorner>
        {hours.map(hour => (
          <MatrixColumnHeader key={hour}>{hour}:00</MatrixColumnHeader>
        ))}
      </MatrixRow>
      {rooms.map(room => (
        <MatrixRow key={room.name}>
          <MatrixRowHeader>{room.name}</MatrixRowHeader>
          {room.cells.map((cell, index) => (
            <MatrixCell
              key={index}
              state={cell?.state}
              series={cell?.series}
            >
              {cell?.series ? 'Booked' : cell?.state === 'muted' ? 'Closed' : ''}
            </MatrixCell>
          ))}
        </MatrixRow>
      ))}
      <MatrixRegion
        row={1}
        column={5}
        rowSpan={3}
        columnSpan={2}
        label="Cleaning"
      />
    </Matrix>
  )
}

export const Markers: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Markers sit in cells as solid dots or outlined rings, taking the cell series unless they set their own. `altText` names a cell that only holds a marker.'
      }
    }
  },
  render: () => (
    <Matrix
      aria-label="Sensor readings"
      columns={5}
    >
      <MatrixRow>
        <MatrixCorner />
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
          <MatrixColumnHeader key={day}>{day}</MatrixColumnHeader>
        ))}
      </MatrixRow>
      {['North', 'South'].map((sensor, row) => (
        <MatrixRow key={sensor}>
          <MatrixRowHeader>{sensor}</MatrixRowHeader>
          {[0, 1, 2, 3, 4].map(day => (
            <MatrixCell
              key={day}
              series={(day + row) % 2 ? 4 : undefined}
              altText={(day + row) % 3 ? `Reading ${day + 1}` : 'No reading'}
            >
              <MatrixMarker variant={(day + row) % 3 ? 'solid' : 'outline'}>
                {(day + row) % 3 ? day + 1 : ''}
              </MatrixMarker>
            </MatrixCell>
          ))}
        </MatrixRow>
      ))}
    </Matrix>
  )
}

export const Widths: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The same Matrix at 360px and 720px. At 360px the cells keep their smallest size and the Matrix scrolls sideways.'
      }
    }
  },
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ width: '360px', maxWidth: '100%' }}>
        <Seats disabled={args.disabled} />
      </div>
      <div style={{ width: '720px', maxWidth: '100%' }}>
        <Seats disabled={args.disabled} />
      </div>
    </div>
  )
}

function ControlledSeats() {
  const [value, setValue] = useState<string | null>('A1')
  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <Matrix
        aria-label="Seat"
        columns={4}
        value={value}
        onValueChange={setValue}
      >
        {['A', 'B'].map(row => (
          <MatrixRow key={row}>
            <MatrixRowHeader>Row {row}</MatrixRowHeader>
            {[1, 2, 3, 4].map(seat => (
              <MatrixCell
                key={seat}
                value={`${row}${seat}`}
              >
                {row}
                {seat}
              </MatrixCell>
            ))}
          </MatrixRow>
        ))}
      </Matrix>
      <output>Chosen: {value ?? 'none'}</output>
    </div>
  )
}

export const Controlled: Story = {
  render: () => <ControlledSeats />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('gridcell', { name: 'B3' }))
    await expect(canvas.getByText('Chosen: B3')).toBeVisible()
  }
}
