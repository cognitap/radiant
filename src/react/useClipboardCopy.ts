'use client'

import { useEffect, useRef, useState } from 'react'

type Phase = 'idle' | 'pending' | 'success' | 'error'
type Feedback = { source: string; phase: Phase }

export const copyConfirmationDelay = 2000

export function useClipboardCopy(source: string, resetDelay = copyConfirmationDelay) {
  const [feedback, setFeedback] = useState<Feedback>({ source, phase: 'idle' })
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const operation = useRef(0)
  const cancelReset = useRef<() => void>(() => {})
  // Forget feedback for replaced source while an already requested browser write completes.
  if (feedback.source !== source) setFeedback({ source, phase: 'idle' })

  useEffect(
    () => () => {
      operation.current += 1
      busy.current = false
      cancelReset.current()
    },
    []
  )

  async function copy(win: Window | null) {
    if (busy.current) return
    const request = ++operation.current
    busy.current = true
    cancelReset.current()
    setPending(true)
    setFeedback({ source, phase: 'pending' })
    let phase: Phase = 'success'
    try {
      if (!win?.navigator.clipboard?.writeText) throw new Error('Clipboard writing is unavailable.')
      await win.navigator.clipboard.writeText(source)
    } catch {
      phase = 'error'
    }
    if (request !== operation.current) return
    busy.current = false
    setPending(false)
    const result: Feedback = { source, phase }
    setFeedback(current => (current.source === source ? result : current))
    if (phase === 'success' && win) {
      const id = win.setTimeout(() => {
        setFeedback(current => (current === result ? { source, phase: 'idle' } : current))
      }, resetDelay)
      cancelReset.current = () => win.clearTimeout(id)
    }
  }

  return { copy, pending, phase: feedback.source === source ? feedback.phase : 'idle' }
}
