import { createRef } from 'react'
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
  type MatrixProps
} from '@cognitap/radiant'
const state: MatrixCellState = 'highlighted'
const single: MatrixProps = {
  'aria-label': 'Seats',
  columns: 2,
  defaultValue: 'a',
  onValueChange: (value: string | null) => void value,
  ref: createRef<HTMLDivElement>()
}
;<Matrix {...single}>
  <MatrixRow>
    <MatrixCorner />
    <MatrixColumnHeader>1</MatrixColumnHeader>
    <MatrixColumnHeader>2</MatrixColumnHeader>
  </MatrixRow>
  <MatrixRow>
    <MatrixRowHeader>A</MatrixRowHeader>
    <MatrixCell
      value="a"
      state={state}
      series="3"
    >
      <MatrixMarker variant="outline">1</MatrixMarker>
    </MatrixCell>
    <MatrixCell altText="Empty" />
  </MatrixRow>
  <MatrixRegion
    row={1}
    column={1}
    columnSpan={2}
    label="Front"
  />
</Matrix>
;<Matrix
  aria-label="Seats"
  columns={1}
  type="multiple"
  value={['a']}
  onValueChange={(value: string[]) => void value}
/>
// @ts-expect-error A multiple Matrix holds an array.
;<Matrix
  aria-label="Seats"
  columns={1}
  type="multiple"
  value="a"
/>
// @ts-expect-error Matrix needs an accessible name.
;<Matrix columns={1} />
// @ts-expect-error Cell states are a closed set.
;<MatrixCell state="loud" />
// @ts-expect-error Series run from 1 to 8.
;<MatrixCell series="9" />
// @ts-expect-error A region needs its label.
;<MatrixRegion
  row={1}
  column={1}
/>
