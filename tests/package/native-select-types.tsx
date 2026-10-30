import { createRef } from 'react'
import { NativeSelect, type NativeSelectProps, defineTheme } from '@cognitap/radiant'
const single: NativeSelectProps = {
  name: 'phase',
  value: 'draft',
  onChange: () => {},
  required: true,
  ref: createRef<HTMLSelectElement>(),
  controlSize: 'small',
  style: { '--rad-native-select-radius': '4px' }
}
const multiple: NativeSelectProps = {
  multiple: true,
  size: 5,
  defaultValue: ['reader', 'component'],
  'aria-label': 'Cohorts'
}
export const picker = (
  <NativeSelect {...single}>
    <option
      value=""
      disabled
    >
      Choose
    </option>
    <optgroup label="Phases">
      <option value="draft">Draft</option>
    </optgroup>
  </NativeSelect>
)
export const list = (
  <NativeSelect {...multiple}>
    <option value="reader">Readers</option>
  </NativeSelect>
)
defineTheme({
  id: 'native',
  name: 'Native',
  components: { nativeSelect: { fontWeight: 600, borderWidth: '1px', focusOffset: '2px' } }
})
// @ts-expect-error Native selection has one owner.
export const mixed: NativeSelectProps = { value: 'draft', defaultValue: 'analysis' }
// @ts-expect-error Native size remains a row count.
export const size: NativeSelectProps = { size: 'large' }
// @ts-expect-error Native role follows single/multiple/size semantics.
export const role: NativeSelectProps = { role: 'button' }
// @ts-expect-error Ref targets the actual native select.
export const ref: NativeSelectProps = { ref: createRef<HTMLInputElement>() }
