import { createRef } from 'react'
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteClear,
  AutocompletePortal,
  AutocompleteContent,
  type AutocompleteProps,
  type AutocompleteInputProps
} from '@cognitap/radiant'
const items = [{ value: 'Budapest', label: 'Budapest' }]
export const uncontrolled = (
  <Autocomplete
    items={items}
    name="city"
    defaultValue="Any city"
    required
  >
    <AutocompleteInput
      ref={createRef<HTMLInputElement>()}
      autoComplete="address-level2"
    />
    <AutocompleteClear />
    <AutocompletePortal>
      <AutocompleteContent />
    </AutocompletePortal>
  </Autocomplete>
)
export const controlled = (
  <Autocomplete
    items={items}
    value="Any city"
    onValueChange={value => value.toUpperCase()}
    filter={null}
  />
)
// @ts-expect-error Text is one string owner.
export const both: AutocompleteProps = { items, value: 'one', defaultValue: 'two' }
// @ts-expect-error Empty text is an empty string, not null.
export const nullable: AutocompleteProps = { items, value: null }
// @ts-expect-error The text value is also the query.
export const query: AutocompleteProps = { items, query: 'separate' }
// @ts-expect-error Completion is not multiple selection.
export const multiple: AutocompleteProps = { items, multiple: true }
// @ts-expect-error Open state has one owner.
export const bothOpen: AutocompleteProps = { items, open: true, defaultOpen: true }
// @ts-expect-error The native form name belongs to the root.
export const name: AutocompleteInputProps = { name: 'city' }
// @ts-expect-error The native input value belongs to the root.
export const inputValue: AutocompleteInputProps = { value: 'separate' }
// @ts-expect-error The state root has no DOM host; style AutocompleteInput.
export const rootStyle: AutocompleteProps = { items, className: 'custom' }
