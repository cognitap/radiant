'use client'
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode
} from 'react'
import { Checkbox, type CheckboxProps } from './Checkbox.js'
import { Fieldset, type FieldsetProps } from './Fieldset.js'
import { useNativeOwner, type ValueOwner, type CheckedOwner } from './react/useNativeOwner.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ControlSize, PartStyle } from './presentation.js'
type OptionPresentation = Omit<
  CheckboxProps,
  | 'checked'
  | 'defaultChecked'
  | 'indeterminate'
  | 'name'
  | 'form'
  | 'value'
  | 'required'
  | 'onChange'
  | 'children'
  | 'label'
  | 'aria-checked'
  | 'defaultValue'
  | 'role'
> & { label: ReactNode }
export type CheckboxGroupItem = OptionPresentation & { value: string }
export type CheckboxGroupSelectAll = OptionPresentation
export type CheckboxGroupProps = Omit<
  FieldsetProps,
  'children' | 'defaultValue' | 'value' | 'parts' | 'onChange'
> &
  ValueOwner<readonly string[]> & {
    items: readonly CheckboxGroupItem[]
    onValueChange?: (value: string[]) => void
    controlSize?: ControlSize
    /** Toggles available options; disabled selections remain unchanged. Never submitted. */
    selectAll?: CheckboxGroupSelectAll
    parts?: NonNullable<FieldsetProps['parts']> & { options?: PartStyle }
  }
// Configuration objects may carry extra native props through structural typing.
const nativeOption = {
  checked: undefined,
  defaultChecked: undefined,
  indeterminate: false,
  'aria-checked': undefined,
  defaultValue: undefined,
  required: false,
  role: undefined,
  children: undefined
} satisfies Partial<CheckboxProps>
function normalize(value: readonly string[]) {
  if (!Array.isArray(value) || value.some(key => typeof key !== 'string'))
    throw new TypeError('CheckboxGroup values must be an array of strings.')
  return [...new Set(value)]
}
function equal(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every(value => b.includes(value))
}
function summary(values: readonly string[], items: readonly CheckboxGroupItem[]) {
  const available = items.filter(item => !item.disabled),
    count = available.filter(item => values.includes(item.value)).length
  return {
    all: available.length > 0 && count === available.length,
    mixed: count > 0 && count < available.length,
    empty: available.length === 0
  }
}
export function CheckboxGroup({
  items,
  value,
  defaultValue,
  onValueChange,
  selectAll,
  controlSize = 'medium',
  parts,
  ref,
  name,
  form,
  ...props
}: CheckboxGroupProps) {
  const controlled = useNativeOwner('CheckboxGroup', value, defaultValue)
  const [initial] = useState(() => normalize(defaultValue ?? []))
  const [local, setLocal] = useState(initial)
  const current = value !== undefined ? normalize(value) : local
  const keys = new Set<string>()
  for (const item of items) {
    if (typeof item.value !== 'string' || keys.has(item.value))
      throw new TypeError('CheckboxGroup item values must be unique strings.')
    keys.add(item.value)
  }
  const prefix = useId(),
    root = useRef<HTMLFieldSetElement>(null),
    all = useRef<HTMLInputElement>(null)
  const nodes = useRef(new Map<string, HTMLInputElement>())
  const accepted = useRef(initial)
  const hostRef = useComposedRefs(root, ref),
    allRef = useComposedRefs(all, selectAll?.ref)
  const register = useCallback((key: string, node: HTMLInputElement | null) => {
    if (node) nodes.current.set(key, node)
    else nodes.current.delete(key)
  }, [])
  const read = useCallback(
    () => items.filter(item => nodes.current.get(item.value)?.checked).map(item => item.value),
    [items]
  )
  const adopt = (next: string[]) => {
    accepted.current = next
    setLocal(previous => (equal(previous, next) ? previous : next))
  }
  const request = (next: string[]) => {
    const previous = controlled ? current : accepted.current
    if (equal(previous, next)) return
    if (!controlled) adopt(next)
    onValueChange?.([...next])
  }
  const nativeChange = useEffectEvent((event: Event) => {
    if (!controlled && [...nodes.current.values()].some(node => node === event.target))
      request(read())
  })
  useLayoutEffect(() => {
    const node = root.current
    // Native reset and bulk edits do not update React's checkbox change tracker.
    node?.addEventListener('change', nativeChange)
    return () => node?.removeEventListener('change', nativeChange)
  }, [])
  const aggregate = summary(current, items)
  useLayoutEffect(() => {
    // Native uncontrolled checkboxes own reset and edits made before hydration.
    const next = controlled ? current : read()
    if (controlled) {
      for (const item of items) {
        const node = nodes.current.get(item.value)
        if (node) node.checked = current.includes(item.value)
      }
    } else {
      // oxlint-disable-next-line react/set-state-in-effect -- Adopt browser-owned pre-hydration edits without emitting a change request.
      adopt(next)
    }
    const state = summary(next, items)
    if (all.current) {
      all.current.checked = state.all
      all.current.indeterminate = state.mixed
    }
  })
  const afterReset = useEffectEvent(() => {
    const next = controlled ? current : read()
    if (!controlled) adopt(next)
    else
      for (const item of items) {
        const node = nodes.current.get(item.value)
        if (node) node.checked = current.includes(item.value)
      }
    const state = summary(next, items)
    if (all.current) {
      all.current.checked = state.all
      all.current.indeterminate = state.mixed
    }
  })
  useEffect(() => {
    const node = root.current,
      owner = node?.form,
      win = node?.ownerDocument.defaultView
    if (!owner || !win) return
    let timer: number | undefined
    const reset = (event: Event) => {
      win.clearTimeout(timer)
      timer = win.setTimeout(() => {
        timer = undefined
        if (!event.defaultPrevented) afterReset()
      }, 0)
    }
    owner.addEventListener('reset', reset)
    return () => {
      owner.removeEventListener('reset', reset)
      win.clearTimeout(timer)
    }
  }, [form])
  const ids = items.map(item => item.id ?? `${prefix}-option-${encodeURIComponent(item.value)}`)
  const { options: optionsPart, ...fieldParts } = parts ?? {}
  const changeAll = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.matches(':disabled')) return
    const checked = event.currentTarget.checked
    if (controlled) {
      const next = new Set(current)
      for (const item of items)
        if (!item.disabled) {
          if (checked) next.add(item.value)
          else next.delete(item.value)
        }
      request([...next])
      // A controlled owner may refuse the request, so restore native mixed state too.
      event.currentTarget.checked = aggregate.all
      event.currentTarget.indeterminate = aggregate.mixed
    } else {
      for (const item of items) {
        const node = nodes.current.get(item.value)
        if (node && !node.matches(':disabled')) node.checked = checked
      }
      request(read())
    }
  }
  return (
    <Fieldset
      {...props}
      form={form}
      ref={hostRef}
      data-slot={joinIds('checkbox-group', props['data-slot'])}
      parts={fieldParts}
      data-control-size={controlSize}
    >
      {selectAll ? (
        <Checkbox
          {...selectAll}
          {...nativeOption}
          name={undefined}
          value={undefined}
          ref={allRef}
          form={form}
          controlSize={selectAll.controlSize ?? controlSize}
          disabled={selectAll.disabled || aggregate.empty}
          checked={aggregate.all}
          indeterminate={aggregate.mixed}
          aria-checked={aggregate.mixed ? 'mixed' : aggregate.all}
          aria-controls={joinIds(ids.join(' '), selectAll['aria-controls'])}
          onChange={changeAll}
        />
      ) : null}
      <div
        data-slot="checkbox-group-options"
        style={optionsPart?.style}
        className={cn(
          'grid min-w-0 justify-items-start gap-[var(--rad-checkbox-group-gap,var(--rad-spacing-group-gap,0.75rem))]',
          optionsPart?.className
        )}
      >
        {items.map((item, index) => (
          <Option
            key={item.value}
            item={item}
            id={ids[index]!}
            name={name}
            form={form}
            controlSize={controlSize}
            register={register}
            owner={
              controlled
                ? { checked: current.includes(item.value) }
                : { defaultChecked: initial.includes(item.value) }
            }
            onChange={event => {
              if (event.currentTarget.matches(':disabled')) {
                event.currentTarget.checked = current.includes(item.value)
                return
              }
              if (controlled) {
                const next = new Set(current)
                if (event.currentTarget.checked) next.add(item.value)
                else next.delete(item.value)
                request([...next])
              }
            }}
          />
        ))}
      </div>
    </Fieldset>
  )
}
function Option({
  item,
  id,
  name,
  form,
  controlSize,
  register,
  owner,
  onChange
}: {
  item: CheckboxGroupItem
  id: string
  name?: string
  form?: string
  controlSize: ControlSize
  register: (key: string, node: HTMLInputElement | null) => void
  owner: CheckedOwner
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const remember = useCallback(
    (node: HTMLInputElement | null) => register(item.value, node),
    [item.value, register]
  )
  const ref = useComposedRefs(remember, item.ref)
  return (
    <Checkbox
      {...item}
      {...nativeOption}
      {...owner}
      id={id}
      ref={ref}
      name={name}
      form={form}
      controlSize={item.controlSize ?? controlSize}
      onChange={onChange}
    />
  )
}
