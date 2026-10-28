'use client'

import { useRef, useState } from 'react'

type StateOptions<Value> = {
  name: string
  value: Value | undefined
  defaultValue: Value | undefined
  initialValue: Value
  onChange?: (value: Value) => void
  equal?: (left: Value, right: Value) => boolean
}

/** One owner per mount. Native observations are separate from change requests. */
export function useControllableState<Value>({
  name,
  value,
  defaultValue,
  initialValue,
  onChange,
  equal = Object.is
}: StateOptions<Value>) {
  const [controlled] = useState(value !== undefined)
  const [uncontrolled, setUncontrolled] = useState(() =>
    defaultValue !== undefined ? defaultValue : initialValue
  )
  if (controlled !== (value !== undefined)) {
    throw new TypeError(
      `${name} cannot switch between controlled and uncontrolled state. Remount with a new key.`
    )
  }
  if (value !== undefined && defaultValue !== undefined) {
    throw new TypeError(`${name} accepts a controlled value or a default, not both.`)
  }
  const current = value !== undefined ? value : uncontrolled
  const initial = useRef(uncontrolled)
  const accepted = useRef(current)
  const request = (update: Value | ((current: Value) => Value)) => {
    const previous = controlled ? current : accepted.current
    const next =
      typeof update === 'function' ? (update as (current: Value) => Value)(previous) : update
    if (equal(previous, next)) return
    if (!controlled) {
      // Deduplicate accepted requests in the same event before React commits.
      accepted.current = next
      setUncontrolled(next)
    }
    onChange?.(next)
  }
  const reset = () => {
    if (controlled) return
    accepted.current = initial.current
    setUncontrolled(initial.current)
  }
  return { value: current, request, controlled, reset }
}
