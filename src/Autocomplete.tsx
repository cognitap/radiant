'use client'
import type { ComponentProps } from 'react'
import {
  ComboboxRoot,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxPortal,
  ComboboxContent,
  ComboboxItem,
  ComboboxStatus,
  useAutocompleteParts,
  type ComboboxProps,
  type ComboboxOption,
  type ComboboxInputProps,
  type ComboboxTriggerProps,
  type ComboboxClearProps,
  type ComboboxContentProps,
  type ComboboxItemProps,
  type ComboboxStatusProps
} from './Combobox.js'
import type { DistributiveOmit } from './internal/types.js'
import { useControllableState } from './react/useControllableState.js'
import type { ValueOwner } from './react/useNativeOwner.js'
/** value is the literal completion text; labels may provide richer presentation. */
export type AutocompleteOption = ComboboxOption
export type AutocompleteProps = DistributiveOmit<
  ComboboxProps,
  | 'value'
  | 'defaultValue'
  | 'onValueChange'
  | 'query'
  | 'defaultQuery'
  | 'onQueryChange'
  | 'multiple'
  | 'selectedItem'
  | 'selectedItems'
> &
  ValueOwner<string> & { onValueChange?: (value: string) => void }
export type AutocompleteInputProps = ComboboxInputProps
export type AutocompleteTriggerProps = ComboboxTriggerProps
export type AutocompleteClearProps = ComboboxClearProps
export type AutocompletePortalProps = ComponentProps<typeof ComboboxPortal>
export type AutocompleteContentProps = ComboboxContentProps
export type AutocompleteItemProps = ComboboxItemProps
export type AutocompleteStatusProps = ComboboxStatusProps
const completionFilter = (item: AutocompleteOption, query: string) =>
  [item.value, item.textValue, typeof item.label === 'string' ? item.label : '']
    .join(' ')
    .toLocaleLowerCase()
    .includes(query.trim().toLocaleLowerCase())
/** Suggestions enhance a native text value; they never constrain it to a selection key. */
export function Autocomplete({
  value,
  defaultValue,
  onValueChange,
  filter = completionFilter,
  ...props
}: AutocompleteProps) {
  const text = useControllableState({
    name: 'Autocomplete',
    value,
    defaultValue,
    initialValue: '',
    onChange: onValueChange
  })
  if (
    typeof text.value !== 'string' ||
    (defaultValue !== undefined && typeof defaultValue !== 'string')
  )
    throw new TypeError('Autocomplete values must be strings.')
  return (
    <ComboboxRoot
      {...props}
      multiple={false}
      value={null}
      defaultValue={undefined}
      selectedItem={undefined}
      selectedItems={undefined}
      query={text.value}
      defaultQuery={undefined}
      onQueryChange={text.request}
      onValueChange={undefined}
      filter={filter}
      textInput={{ reset: text.reset }}
    />
  )
}
export function AutocompleteInput(props: AutocompleteInputProps) {
  useAutocompleteParts()
  return <ComboboxInput {...props} />
}
export function AutocompleteTrigger(props: AutocompleteTriggerProps) {
  useAutocompleteParts()
  return <ComboboxTrigger {...props} />
}
export function AutocompleteClear(props: AutocompleteClearProps) {
  useAutocompleteParts()
  return <ComboboxClear {...props} />
}
export function AutocompletePortal(props: AutocompletePortalProps) {
  useAutocompleteParts()
  return <ComboboxPortal {...props} />
}
export function AutocompleteContent(props: AutocompleteContentProps) {
  useAutocompleteParts()
  return <ComboboxContent {...props} />
}
export function AutocompleteItem(props: AutocompleteItemProps) {
  useAutocompleteParts()
  return <ComboboxItem {...props} />
}
export function AutocompleteStatus(props: AutocompleteStatusProps) {
  useAutocompleteParts()
  return <ComboboxStatus {...props} />
}
