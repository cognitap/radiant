import { createRef } from 'react'
import { NumberField, type NumberFieldProps, defineTheme } from '@cognitap/radiant'
export const input = (
  <NumberField
    name="rate"
    ref={createRef<HTMLInputElement>()}
    defaultValue={null}
    min={0}
    max={100}
    step={0.25}
    largeStep={5}
    locale="fr-FR"
    formatOptions={{ style: 'currency', currency: 'EUR' }}
  />
)
export const controlled = (
  <NumberField
    value={0.85}
    onValueChange={value => {
      const raw: number | null = value
      void raw
    }}
    formatOptions={{ style: 'percent' }}
    parts={{
      wrapper: { className: 'gap-2' },
      increment: { style: { color: 'red' } },
      decrement: { className: 'px-3' }
    }}
  />
)
export const theme = defineTheme({
  id: 'number',
  name: 'Number',
  components: { numberField: { gap: '6px' } }
})
// @ts-expect-error One numeric owner.
export const both: NumberFieldProps = { value: 1, defaultValue: 2 }
// @ts-expect-error Raw numeric values, not localized strings.
export const formatted: NumberFieldProps = { value: '1,5' }
// @ts-expect-error Native text type is protected.
export const type: NumberFieldProps = { type: 'number' }
// @ts-expect-error Input ref is not the wrapper.
export const wrapper: NumberFieldProps = { ref: createRef<HTMLDivElement>() }
// @ts-expect-error Compact notation is not editable.
export const compact: NumberFieldProps = { formatOptions: { notation: 'compact' } }
// @ts-expect-error Currency names may have value-dependent plural affixes.
export const names: NumberFieldProps = { formatOptions: { currencyDisplay: 'name' } }
// @ts-expect-error Value semantics belong to the component.
export const aria: NumberFieldProps = { 'aria-valuenow': 5 }
