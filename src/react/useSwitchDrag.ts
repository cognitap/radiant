'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'
import { bindSwitchDrag, type SwitchDragBinding } from '../internal/switchDrag.js'

/** The input owns checked state; the private rail/handle own the transient drag. */
export function useSwitchDrag(
  input: RefObject<HTMLInputElement | null>,
  rail: RefObject<HTMLElement | null>,
  handle: RefObject<HTMLElement | null>
) {
  const binding = useRef<{
    input: HTMLInputElement
    rail: HTMLElement
    handle: HTMLElement
    control: SwitchDragBinding
  } | null>(null)
  useLayoutEffect(() => {
    if (
      binding.current &&
      (binding.current.input !== input.current ||
        binding.current.rail !== rail.current ||
        binding.current.handle !== handle.current)
    ) {
      binding.current.control.dispose()
      binding.current = null
    }
    if (!binding.current && input.current && rail.current && handle.current) {
      binding.current = {
        input: input.current,
        rail: rail.current,
        handle: handle.current,
        control: bindSwitchDrag(input.current, rail.current, handle.current)
      }
    }
    binding.current?.control.reconcile()
  })
  useLayoutEffect(
    () => () => {
      binding.current?.control.dispose()
      binding.current = null
    },
    []
  )
  return {
    start: (event: PointerEvent) => binding.current?.control.start(event),
    escape: (event: KeyboardEvent) => binding.current?.control.escape(event) ?? false
  }
}
