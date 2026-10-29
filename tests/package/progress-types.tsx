import { createElement as h, createRef } from 'react'
import { Progress, type ProgressProps } from '@cognitap/radiant'
h(Progress, {
  value: 2,
  max: 5,
  'aria-label': 'Export',
  'aria-valuetext': 'Two of five files',
  ref: createRef<HTMLProgressElement>(),
  style: { '--rad-progress-height': '1rem' }
})
h(Progress, { value: null, 'aria-labelledby': 'export-label' })
// @ts-expect-error Progress owns native range semantics.
const range: ProgressProps = { 'aria-valuenow': 50 }
// @ts-expect-error Native progress has a fixed minimum of zero.
const min: ProgressProps = { min: 10 }
// @ts-expect-error Progress is a read-only feedback value, without an uncontrolled default.
const initial: ProgressProps = { defaultValue: 20 }
// @ts-expect-error Use the native progress host.
const role: ProgressProps = { role: 'slider' }
void [range, min, initial, role]
