import { createRef } from 'react'
import { Meter, type MeterProps, defineTheme } from '@cognitap/radiant'
const props: MeterProps = {
  value: 7.2,
  min: 0,
  max: 10,
  low: 6,
  high: 8.5,
  optimum: 0,
  'aria-label': 'Storage used',
  'aria-valuetext': '7.2 GB of 10 GB used',
  ref: createRef<HTMLMeterElement>(),
  style: { '--rad-meter-height': '12px' }
}
export const gauge = <Meter {...props} />
defineTheme({
  id: 'gauge',
  name: 'Gauge',
  components: { meter: { height: '12px', warningColor: 'orange', dangerColor: 'red' } }
})
// @ts-expect-error A gauge always has a measured value.
export const missing = <Meter aria-label="Storage" />
// @ts-expect-error Meter does not represent indeterminate progress.
export const unknown: MeterProps = { value: null }
// @ts-expect-error Native meter owns range semantics.
export const role: MeterProps = { value: 0.5, role: 'slider' }
// @ts-expect-error Native value truth cannot be replaced by ARIA.
export const lie: MeterProps = { value: 0.5, 'aria-valuenow': 2 }
// @ts-expect-error Meter is read-only, not a form value owner.
export const defaultValue: MeterProps = { value: 0.5, defaultValue: 0.2 }
// @ts-expect-error Fallback text derives from the actual measurement.
export const children: MeterProps = { value: 0.5, children: 'different value' }
// @ts-expect-error Ref targets the native meter.
export const ref: MeterProps = { value: 0.5, ref: createRef<HTMLInputElement>() }
