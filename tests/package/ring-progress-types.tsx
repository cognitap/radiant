import { RingProgress, type RingProgressProps } from '@cognitap/radiant'

const capacity: RingProgressProps = {
  kind: 'meter',
  'aria-label': 'Storage used',
  segments: [{ value: 50, tone: 'warning' }]
}
export const ring = <RingProgress {...capacity} />
// @ts-expect-error A ring has one numeric source.
export const ambiguous: RingProgressProps = { 'aria-label': 'Progress', value: 2, segments: [] }
// @ts-expect-error A meter needs a reading.
export const unmeasured: RingProgressProps = { kind: 'meter', 'aria-label': 'Storage used' }
