'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { ComponentApi, FunctionImplementation } from '@a2ui/web_core/catalog'
import { MessageProcessor, type ProcessableMessage } from '@a2ui/web_core/processing'
import { effect, getValue, peekValue, type Signal } from '@a2ui/web_core/reactivity'
import { NodeResolver, type ComponentNode } from '@a2ui/web_core/resolution'
import type { ActionPayload } from '@a2ui/web_core/state'
import { A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import { radiantA2uiRegistry } from './entries.js'
import type { A2uiRegistry, A2uiRenderOptions } from './registry.js'
import { sanitizeA2uiMessages, type A2uiMessage } from './sanitize.js'

export type A2uiActionPayload = ActionPayload

export type A2uiSurfaceProps = {
  /** Identifier of the A2UI surface to render. */
  readonly surfaceId: string
  /** A2UI 1.0 protocol messages defining and updating the surface. */
  readonly messages: readonly A2uiMessage[]
  /** Registry mapping A2UI component names to Radiant adapters. Defaults to `radiantA2uiRegistry`. */
  readonly registry?: A2uiRegistry
  /** Host callback invoked when an outbound A2UI action event fires. */
  readonly onAction?: (action: A2uiActionPayload) => void
}

function useSignalValue<T>(signal: Signal<T> | undefined): T | undefined {
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

function A2uiNodeRenderer({
  node,
  registry,
  inline
}: {
  readonly node: ComponentNode
  readonly registry: A2uiRegistry
  readonly inline: boolean
}): ReactNode {
  const props = useSignalValue(node.props)
  if (!props || node.state !== 'resolved') return null
  const entry = registry.entries[node.type]
  if (!entry) return null
  return entry.adapter(props, {
    node,
    inline,
    renderNode(child: ComponentNode, options?: A2uiRenderOptions) {
      return (
        <A2uiNodeRenderer
          key={child.id}
          node={child}
          registry={registry}
          inline={options?.inline ?? false}
        />
      )
    }
  })
}

function isPrefixOf(previous: readonly A2uiMessage[], next: readonly A2uiMessage[]): boolean {
  if (previous.length > next.length) return false
  for (let i = 0; i < previous.length; i++) {
    if (previous[i] !== next[i]) return false
  }
  return true
}

type SurfaceStore = {
  readonly subscribe: (listener: () => void) => () => void
  readonly getSnapshot: () => ComponentNode | undefined
  readonly sync: (
    surfaceId: string,
    registry: A2uiRegistry,
    messages: readonly A2uiMessage[],
    onAction: ((action: A2uiActionPayload) => void) | undefined
  ) => void
  readonly dispose: () => void
}

function createSurfaceStore(
  initialSurfaceId: string,
  initialRegistry: A2uiRegistry,
  initialMessages: readonly A2uiMessage[],
  initialOnAction: ((action: A2uiActionPayload) => void) | undefined
): SurfaceStore {
  let surfaceId = initialSurfaceId
  let registry = initialRegistry
  let processedMessages = initialMessages
  let actionHandler = initialOnAction
  let disposed = false
  let processor: MessageProcessor<ComponentApi> | undefined
  let resolver: NodeResolver<ComponentApi, FunctionImplementation> | undefined
  let stopRootEffect: (() => void) | undefined
  const listeners = new Set<() => void>()

  function notify() {
    for (const listener of listeners) {
      listener()
    }
  }

  function bindRootSignal() {
    stopRootEffect?.()
    stopRootEffect = undefined
    if (listeners.size === 0 || !resolver) return
    const rootSignal = resolver.rootNode
    let initial = true
    stopRootEffect = effect(() => {
      getValue(rootSignal)
      if (initial) {
        initial = false
        return
      }
      notify()
    })
  }

  function teardownEngine() {
    stopRootEffect?.()
    stopRootEffect = undefined
    resolver?.dispose()
    resolver = undefined
    processor?.dispose()
    processor = undefined
  }

  function buildEngine(
    nextSurfaceId: string,
    nextRegistry: A2uiRegistry,
    nextMessages: readonly A2uiMessage[]
  ) {
    teardownEngine()
    disposed = false
    surfaceId = nextSurfaceId
    registry = nextRegistry
    processedMessages = nextMessages
    const webCoreCatalog = nextRegistry.toWebCoreCatalog()
    processor = new MessageProcessor(
      [webCoreCatalog],
      action => {
        actionHandler?.(action)
      },
      { version: A2UI_PROTOCOL_VERSION }
    )
    const sanitized = sanitizeA2uiMessages(nextMessages)
    if (sanitized.length > 0) {
      processor.processMessages(sanitized as readonly ProcessableMessage[])
    }
    const surface = processor.getSurface(nextSurfaceId)
    resolver = surface ? new NodeResolver(surface, webCoreCatalog) : undefined
    bindRootSignal()
  }

  buildEngine(initialSurfaceId, initialRegistry, initialMessages)

  return {
    subscribe(listener) {
      listeners.add(listener)
      if (listeners.size === 1) {
        bindRootSignal()
      }
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) {
          stopRootEffect?.()
          stopRootEffect = undefined
        }
      }
    },
    getSnapshot() {
      return resolver ? peekValue(resolver.rootNode) : undefined
    },
    sync(nextSurfaceId, nextRegistry, nextMessages, nextOnAction) {
      actionHandler = nextOnAction
      if (
        disposed ||
        !processor ||
        surfaceId !== nextSurfaceId ||
        registry !== nextRegistry ||
        !isPrefixOf(processedMessages, nextMessages)
      ) {
        buildEngine(nextSurfaceId, nextRegistry, nextMessages)
        notify()
        return
      }
      if (nextMessages.length > processedMessages.length) {
        const delta = sanitizeA2uiMessages(nextMessages.slice(processedMessages.length))
        if (delta.length > 0) {
          processor.processMessages(delta as readonly ProcessableMessage[])
        }
        processedMessages = nextMessages
        if (!resolver || resolver.disposed) {
          const surface = processor.getSurface(nextSurfaceId)
          resolver = surface
            ? new NodeResolver(surface, nextRegistry.toWebCoreCatalog())
            : undefined
          bindRootSignal()
        }
        notify()
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      teardownEngine()
    }
  }
}

/**
 * Renders an A2UI 1.0 surface directly onto Radiant components via `@a2ui/web_core`.
 * Inherits styling from the surrounding `ThemeScope` and ignores agent-supplied theme hints.
 */
export function A2uiSurface({
  surfaceId,
  messages,
  registry = radiantA2uiRegistry,
  onAction
}: A2uiSurfaceProps) {
  const [store] = useState(() => createSurfaceStore(surfaceId, registry, messages, onAction))

  useEffect(() => {
    store.sync(surfaceId, registry, messages, onAction)
  }, [store, surfaceId, registry, messages, onAction])

  useEffect(() => {
    return () => {
      store.dispose()
    }
  }, [store])

  const rootNode = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  return (
    <div
      data-slot="a2ui-surface"
      data-surface-id={surfaceId}
    >
      {rootNode ? (
        <A2uiNodeRenderer
          node={rootNode}
          registry={registry}
          inline={false}
        />
      ) : null}
    </div>
  )
}
