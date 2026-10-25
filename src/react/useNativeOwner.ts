'use client'

import { useState } from 'react'

export type ValueOwner<Value> =
  | { value: Value; defaultValue?: never }
  | { value?: undefined; defaultValue?: Value }

export type CheckedOwner =
  | { checked: boolean; defaultChecked?: never }
  | { checked?: undefined; defaultChecked?: boolean }

/** Validate ownership without replacing React/browser state or reset behavior. */
export function useNativeOwner(
  name: string,
  value: unknown,
  defaultValue: unknown,
  enabled = true
) {
  const controlled = value !== undefined
  const [owner] = useState(controlled)
  if (enabled) {
    if (value !== undefined && defaultValue !== undefined) {
      throw new TypeError(`${name} accepts a controlled value or a default, not both.`)
    }
    if (owner !== controlled) {
      throw new TypeError(
        `${name} cannot switch between controlled and uncontrolled state. Remount with a new key.`
      )
    }
  }
  return controlled
}
