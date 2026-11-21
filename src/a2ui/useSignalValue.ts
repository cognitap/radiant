'use client'

import { useSyncExternalStore } from 'react'
import { effect, getValue, peekValue, type Signal } from '@a2ui/web_core/reactivity'

/** Subscribes a component to a web_core signal and returns its current value. */
export function useSignalValue<T>(signal: Signal<T> | undefined): T | undefined {
  return useSyncExternalStore(
    onStoreChange => {
      if (!signal) return () => {}
      let initial = true
      return effect(() => {
        getValue(signal)
        if (initial) {
          initial = false
          return
        }
        onStoreChange()
      })
    },
    () => (signal ? peekValue(signal) : undefined),
    () => (signal ? peekValue(signal) : undefined)
  )
}
