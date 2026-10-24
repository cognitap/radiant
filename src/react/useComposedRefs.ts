'use client'

import { useMemo, type Ref, type RefCallback } from 'react'

/** Compose library and caller refs without discarding React callback cleanup. */
export function useComposedRefs<Node>(
  libraryRef: Ref<Node> | undefined,
  callerRef: Ref<Node> | undefined
): RefCallback<Node> {
  return useMemo(
    () => node => {
      const cleanups = [libraryRef, callerRef].map(ref => {
        if (typeof ref === 'function') {
          const cleanup = ref(node)
          return typeof cleanup === 'function'
            ? cleanup
            : () => {
                ref(null)
              }
        }
        if (ref) ref.current = node
        return () => {
          if (ref) ref.current = null
        }
      })
      return () => {
        for (const cleanup of cleanups) cleanup()
      }
    },
    [libraryRef, callerRef]
  )
}
