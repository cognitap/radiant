'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { buildTree, type TreeItem, type TreeLoad, type TreeNode } from './treeModel.js'

export function useTreeLoading(items: readonly TreeItem[]) {
  const [loads, setLoads] = useState<ReadonlyMap<string, TreeLoad>>(() => new Map())
  const cache = useRef(loads)
  const requestItems = useRef(items)
  const pending = useRef(new Map<string, AbortController>())
  const save = useCallback((value: string, load: TreeLoad) => {
    cache.current = new Map(cache.current).set(value, load)
    setLoads(cache.current)
  }, [])

  useLayoutEffect(() => {
    requestItems.current = items
    if (!cache.current.size) return
    const { byValue } = buildTree(items, cache.current)
    const next = new Map(cache.current)
    for (const value of next.keys()) {
      if (byValue.get(value)?.item.loadChildren) continue
      pending.current.get(value)?.abort()
      pending.current.delete(value)
      next.delete(value)
    }
    if (next.size !== cache.current.size) {
      cache.current = next
      setLoads(next)
    }
  }, [items])

  useEffect(() => {
    const requests = pending.current
    return () => {
      for (const controller of requests.values()) controller.abort()
      requests.clear()
    }
  }, [])

  const load = useCallback(
    ({ item, value }: TreeNode) => {
      if (
        !item.loadChildren ||
        pending.current.has(value) ||
        cache.current.get(value)?.status === 'loaded'
      )
        return
      const controller = new AbortController()
      const loader = item.loadChildren
      pending.current.set(value, controller)
      save(value, { status: 'loading' })
      void Promise.resolve()
        .then(() => (controller.signal.aborted ? [] : loader(controller.signal)))
        .then(children => {
          if (controller.signal.aborted) return
          // Validate against all accepted results before exposing the new collection.
          const next = new Map(cache.current).set(value, { status: 'loaded', children })
          buildTree(requestItems.current, next)
          save(value, { status: 'loaded', children })
        })
        .catch(() => {
          if (!controller.signal.aborted) save(value, { status: 'error' })
        })
        .finally(() => {
          if (pending.current.get(value) === controller) pending.current.delete(value)
        })
    },
    [save]
  )

  return { loads, load }
}
