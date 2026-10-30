'use client'

import type { ComponentProps } from 'react'
import {
  Combobox,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxPortal,
  ComboboxContent,
  ComboboxItem,
  ComboboxStatus,
  ComboboxTags,
  useCombobox,
  type ComboboxMultipleProps,
  type ComboboxMultipleState,
  type ComboboxOption,
  type ComboboxInputProps,
  type ComboboxTriggerProps,
  type ComboboxClearProps,
  type ComboboxContentProps,
  type ComboboxItemProps,
  type ComboboxStatusProps,
  type ComboboxTagsProps
} from './Combobox.js'
import type { ButtonRenderProps } from './Button.js'
import type { DistributiveOmit } from './internal/types.js'

export type MultiSelectProps = DistributiveOmit<ComboboxMultipleProps, 'multiple'> & {
  multiple?: never
}
export type MultiSelectState = ComboboxMultipleState
export type MultiSelectOption = ComboboxOption
export type MultiSelectInputProps = ComboboxInputProps
export type MultiSelectTriggerProps = ComboboxTriggerProps
export type MultiSelectClearProps = ComboboxClearProps
export type MultiSelectPortalProps = ComponentProps<typeof ComboboxPortal>
export type MultiSelectContentProps = ComboboxContentProps
export type MultiSelectItemProps = ComboboxItemProps
export type MultiSelectStatusProps = ComboboxStatusProps
export type MultiSelectTagsProps = ComboboxTagsProps
export type MultiSelectRenderProps = ButtonRenderProps

export function useMultiSelect(): MultiSelectState | null {
  return useCombobox({ multiple: true })
}
function useMultiSelectContext() {
  const state = useMultiSelect()
  if (!state)
    throw new Error('MultiSelect parts must render inside MultiSelect or a multiple Combobox.')
  return state
}
/** Array selection is the real Combobox multiple mode, including its native form bridge. */
export function MultiSelect(props: MultiSelectProps) {
  return (
    <Combobox
      {...props}
      multiple
    />
  )
}
export function MultiSelectInput(props: MultiSelectInputProps) {
  useMultiSelectContext()
  return <ComboboxInput {...props} />
}
export function MultiSelectTrigger(props: MultiSelectTriggerProps) {
  useMultiSelectContext()
  return <ComboboxTrigger {...props} />
}
export function MultiSelectClear(props: MultiSelectClearProps) {
  useMultiSelectContext()
  return <ComboboxClear {...props} />
}
export function MultiSelectPortal(props: MultiSelectPortalProps) {
  useMultiSelectContext()
  return <ComboboxPortal {...props} />
}
export function MultiSelectContent(props: MultiSelectContentProps) {
  useMultiSelectContext()
  return <ComboboxContent {...props} />
}
export function MultiSelectItem(props: MultiSelectItemProps) {
  useMultiSelectContext()
  return <ComboboxItem {...props} />
}
export function MultiSelectStatus(props: MultiSelectStatusProps) {
  useMultiSelectContext()
  return <ComboboxStatus {...props} />
}
export function MultiSelectTags(props: MultiSelectTagsProps) {
  useMultiSelectContext()
  return <ComboboxTags {...props} />
}
