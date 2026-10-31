import { createElement, createRef } from 'react'
import {
  Combobox,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxPortal,
  ComboboxItem,
  useCombobox,
  defineTheme,
  type ComboboxProps,
  type ComboboxTriggerProps,
  type ComboboxClearProps,
  type ComboboxRenderProps,
  type ComboboxInputProps,
  type ComboboxOption
} from '@cognitap/radiant'
const items: ComboboxOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: '', label: createElement('strong', null, 'Anywhere'), textValue: 'Anywhere' }
]
const props: ComboboxProps = {
  items,
  value: null,
  query: 'a',
  open: true,
  filter: null,
  loading: true,
  selectedItem: items[0],
  onValueChange(value) {
    const selected: string | null = value
    void selected
  },
  onQueryChange(query) {
    query.toLowerCase()
  }
}
createElement(
  Combobox,
  props,
  createElement(ComboboxInput, {
    ref: createRef<HTMLInputElement>(),
    size: 30,
    style: { '--rad-combobox-radius': '0' }
  }),
  createElement(ComboboxTrigger, {
    ref: createRef<HTMLButtonElement>(),
    render: resolved => createElement('button', resolved)
  }),
  createElement(
    ComboboxPortal,
    null,
    createElement(
      ComboboxContent,
      { ref: createRef<HTMLDivElement>(), motion: 'off' },
      createElement(ComboboxItem, { value: 'a' })
    )
  )
)
function Owner() {
  const state = useCombobox()
  state?.setValue(null)
  state?.setQuery('')
  return null
}
void Owner
defineTheme({
  id: 'combobox',
  name: 'Combobox',
  components: {
    combobox: { fontSize: '1rem', itemBackground: 'blue', placeholder: 'gray', contentRadius: '0' }
  }
})
// @ts-expect-error One selection owner.
const mixed: ComboboxProps = { items, value: 'a', defaultValue: 'a' }
// @ts-expect-error One query owner.
const query: ComboboxProps = { items, query: 'a', defaultQuery: 'b' }
// @ts-expect-error One open owner.
const open: ComboboxProps = { items, open: true, defaultOpen: true }
// @ts-expect-error Single selection only.
const multiple: ComboboxProps = { items, value: ['a'] }
// @ts-expect-error Rich labels need readable text.
const unreadable: ComboboxOption = { value: 'a', label: createElement('strong', null, 'Alpha') }
// @ts-expect-error The input displays search; it does not own selection.
const inputValue: ComboboxInputProps = { value: 'a' }
// @ts-expect-error The committed value is submitted by the root.
const name: ComboboxInputProps = { name: 'query' }
// @ts-expect-error Relationships belong to the owner.
const active: ComboboxInputProps = { 'aria-activedescendant': 'other' }
// @ts-expect-error Choose many with type="multiple", not a boolean.
const legacyMultiple: ComboboxProps = { items, multiple: true, value: ['a'] }
// @ts-expect-error Load-failure text is errorText; error is a validation message.
const legacyError: ComboboxProps = { items, error: 'Unavailable' }
// @ts-expect-error A trigger that opens results does not own pressed state.
const pressedTrigger: ComboboxTriggerProps = { pressed: true }
// @ts-expect-error Clearing is an action, not a toggle.
const pressedClear: ComboboxClearProps = { onPressedChange: () => {} }
// @ts-expect-error The hook selects multiple mode with type.
const legacyHook = () => useCombobox({ multiple: true })
const many: ComboboxProps = {
  items,
  type: 'multiple',
  defaultValue: ['a'],
  errorText: 'Unavailable',
  'aria-invalid': true,
  onValueChange(value) {
    value.map(item => item.toUpperCase())
  }
}
const manyHook = () => useCombobox({ type: 'multiple' })?.value.map(item => item.toUpperCase())
const renderProps: Pick<ComboboxRenderProps, 'children'> = { children: 'Show options' }
void [mixed, query, open, multiple, unreadable, inputValue, name, active]
void [legacyMultiple, legacyError, pressedTrigger, pressedClear, legacyHook, many, manyHook]
void renderProps

// @ts-expect-error Adornments use Combobox presentation, not action treatments.
const actionVariant: ComboboxTriggerProps = { variant: 'solid' }
void actionVariant
