'use client'

import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import { DateEditor, type DateEditorControlProps } from '../DatePicker/DateEditor.js'

export type DateFieldProps = DateEditorControlProps &
  ValueOwner<string | null> & {
    onValueChange?: (iso: string | null) => void
  }

export function DateField({ value, defaultValue, onValueChange, ...control }: DateFieldProps) {
  const owner = useControllableState({
    name: 'DateField value',
    value,
    defaultValue,
    initialValue: null,
    onChange: onValueChange
  })

  return (
    <DateEditor
      {...control}
      componentName="DateField"
      slot="date-field"
      revision={0}
      value={owner.value}
      onValueChange={owner.request}
      onFormReset={owner.reset}
    />
  )
}
