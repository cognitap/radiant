'use client'

import {
  Component,
  useEffect,
  useState,
  useSyncExternalStore,
  type ErrorInfo,
  type ReactNode
} from 'react'
import type { ComponentApi, FunctionImplementation } from '@a2ui/web_core/catalog'
import { MessageProcessor, type ProcessableMessage } from '@a2ui/web_core/processing'
import { effect, getValue, peekValue, type Signal } from '@a2ui/web_core/reactivity'
import { NodeResolver, type ComponentNode } from '@a2ui/web_core/resolution'
import type { ActionPayload, SurfaceModel } from '@a2ui/web_core/state'
import {
  createCatalogActionEvent,
  snapshotSurfaceState,
  type CatalogActionEvent,
  type CatalogDiagnostic
} from '../catalog/index.js'
import { isPlainRecord } from '../catalog/coerce.js'
import { A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import {
  COERCED_NOOP_ACTION_NAME,
  coerceA2uiMessages,
  extractA2uiNodeFallbackText,
  getRegistryEntry
} from './coerce.js'
import { radiantA2uiRegistry } from './entries.js'
import type { A2uiRegistry, A2uiRenderOptions } from './registry.js'
import type { A2uiMessage } from './sanitize.js'

/**
 * Outbound action payload delivered by `A2uiSurface`.
 * Implements the protocol-independent `CatalogActionEvent` (`{ action, surfaceId, nodeId, state }`)
 * while preserving the underlying A2UI wire fields (`name`, `sourceComponentId`, `context`, `timestamp`).
 */
export type A2uiActionPayload = CatalogActionEvent & ActionPayload

export type A2uiSurfaceProps = {
  /** Identifier of the A2UI surface to render. */
  readonly surfaceId: string
  /** A2UI 1.0 protocol messages defining and updating the surface. */
  readonly messages: readonly A2uiMessage[]
  /** Registry mapping A2UI component names to Radiant adapters. Defaults to `radiantA2uiRegistry`. */
  readonly registry?: A2uiRegistry
  /** Host callback invoked when an outbound A2UI action event fires. */
  readonly onAction?: (action: A2uiActionPayload) => void
  /** Host callback invoked whenever a prop is coerced, defaulted, stripped, or falls back. */
  readonly onDiagnostic?: (diagnostic: CatalogDiagnostic) => void
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

const boundaryFallbackText = (node: ComponentNode, token: unknown) =>
  extractA2uiNodeFallbackText(node, isPlainRecord(token) ? token : undefined)

type BoundaryProps = {
  readonly node: ComponentNode
  readonly resetToken: unknown
  readonly onDiagnostic: ((diagnostic: CatalogDiagnostic) => void) | undefined
  readonly children: ReactNode
}

class A2uiNodeErrorBoundary extends Component<
  BoundaryProps,
  { readonly failed: boolean; readonly failedToken: unknown }
> {
  override state = { failed: false, failedToken: undefined as unknown }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  static getDerivedStateFromProps(
    next: BoundaryProps,
    prev: { readonly failed: boolean; readonly failedToken: unknown }
  ) {
    if (!prev.failed) return null
    if (prev.failedToken === undefined) return { failed: true, failedToken: next.resetToken }
    return next.resetToken !== prev.failedToken ? { failed: false, failedToken: undefined } : null
  }

  override componentDidCatch(error: Error, _info: ErrorInfo) {
    const { node, resetToken, onDiagnostic } = this.props
    onDiagnostic?.({
      kind: 'fallback',
      nodeId: node.componentId,
      component: node.type,
      prop: 'render',
      received: error.message || 'Render error',
      used: boundaryFallbackText(node, resetToken),
      reason: 'Component threw during render.'
    })
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children
    const text = boundaryFallbackText(this.props.node, this.props.resetToken)
    return text ? (
      <span
        data-slot="a2ui-fallback"
        data-node-id={this.props.node.componentId}
      >
        {text}
      </span>
    ) : null
  }
}

function A2uiNodeRenderer({
  node,
  registry,
  inline,
  onDiagnostic
}: {
  readonly node: ComponentNode
  readonly registry: A2uiRegistry
  readonly inline: boolean
  readonly onDiagnostic: ((diagnostic: CatalogDiagnostic) => void) | undefined
}): ReactNode {
  const props = useSignalValue(node.props)
  if (!props || node.state !== 'resolved') return null
  const entry = getRegistryEntry(registry, node.type)
  if (!entry) return null

  return (
    <A2uiNodeErrorBoundary
      key={node.id}
      node={node}
      resetToken={props}
      onDiagnostic={onDiagnostic}
    >
      {entry.adapter(props, {
        node,
        inline,
        renderNode(child: ComponentNode, options?: A2uiRenderOptions) {
          return (
            <A2uiNodeRenderer
              key={child.id}
              node={child}
              registry={registry}
              inline={options?.inline ?? false}
              onDiagnostic={onDiagnostic}
            />
          )
        }
      })}
    </A2uiNodeErrorBoundary>
  )
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
    onAction: ((action: A2uiActionPayload) => void) | undefined,
    onDiagnostic: ((diagnostic: CatalogDiagnostic) => void) | undefined
  ) => void
  readonly dispose: () => void
}

function createSurfaceStore(
  initialSurfaceId: string,
  initialRegistry: A2uiRegistry,
  initialMessages: readonly A2uiMessage[],
  initialOnAction: ((action: A2uiActionPayload) => void) | undefined,
  initialOnDiagnostic: ((diagnostic: CatalogDiagnostic) => void) | undefined
): SurfaceStore {
  let surfaceId = initialSurfaceId
  let registry = initialRegistry
  let processedMessages = initialMessages
  let reported: readonly [string, A2uiRegistry, readonly A2uiMessage[]] | undefined
  let actionHandler = initialOnAction
  let diagnosticHandler = initialOnDiagnostic
  let disposed = false
  let processor: MessageProcessor<ComponentApi> | undefined
  let resolver: NodeResolver<ComponentApi, FunctionImplementation> | undefined
  let stopRootEffect: (() => void) | undefined
  const pendingDiagnostics: CatalogDiagnostic[] = []
  const listeners = new Set<() => void>()

  function notify() {
    for (const listener of listeners) {
      listener()
    }
  }

  function flushDiagnostics() {
    const batch = pendingDiagnostics.splice(0, pendingDiagnostics.length)
    if (diagnosticHandler) for (const d of batch) diagnosticHandler(d)
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

  const makeResolver = (s: SurfaceModel<ComponentApi> | undefined) =>
    s ? new NodeResolver(s as SurfaceModel<ComponentApi, FunctionImplementation>) : undefined

  function processBatch(
    target: MessageProcessor<ComponentApi>,
    targetRegistry: A2uiRegistry,
    batch: readonly A2uiMessage[],
    record: boolean
  ) {
    const { messages: coerced, diagnostics } = coerceA2uiMessages(batch, targetRegistry)
    if (record && diagnostics.length > 0) pendingDiagnostics.push(...diagnostics)
    if (coerced.length > 0) {
      target.processMessages(coerced as readonly ProcessableMessage[])
    }
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
    const sameBatch =
      reported?.[0] === nextSurfaceId &&
      reported[1] === nextRegistry &&
      reported[2] === nextMessages
    const webCoreCatalog = nextRegistry.toWebCoreCatalog()
    processor = new MessageProcessor(
      [webCoreCatalog],
      action => {
        if (action.name === COERCED_NOOP_ACTION_NAME) return
        const state = processor?.getSurface(action.surfaceId)?.dataModel.get('/')
        const catalogEvent = createCatalogActionEvent({
          action: action.name,
          surfaceId: action.surfaceId,
          nodeId: action.sourceComponentId,
          state
        })
        const contextSnapshot = snapshotSurfaceState(action.context)
        const context = (
          isPlainRecord(contextSnapshot) ? contextSnapshot : Object.freeze({})
        ) as Record<string, unknown>
        actionHandler?.(Object.freeze({ ...action, ...catalogEvent, context }))
      },
      { version: A2UI_PROTOCOL_VERSION }
    )
    if (nextMessages.length > 0) {
      processBatch(processor, nextRegistry, nextMessages, Boolean(diagnosticHandler) && !sameBatch)
    }
    reported = [nextSurfaceId, nextRegistry, nextMessages]
    resolver = makeResolver(processor.getSurface(nextSurfaceId))
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
    sync(nextSurfaceId, nextRegistry, nextMessages, nextOnAction, nextOnDiagnostic) {
      actionHandler = nextOnAction
      diagnosticHandler = nextOnDiagnostic
      if (!diagnosticHandler) pendingDiagnostics.length = 0
      if (
        disposed ||
        !processor ||
        surfaceId !== nextSurfaceId ||
        registry !== nextRegistry ||
        !isPrefixOf(processedMessages, nextMessages)
      ) {
        buildEngine(nextSurfaceId, nextRegistry, nextMessages)
        flushDiagnostics()
        notify()
        return
      }
      if (nextMessages.length > processedMessages.length) {
        const delta = nextMessages.slice(processedMessages.length)
        if (delta.length > 0) {
          processBatch(processor, nextRegistry, delta, Boolean(diagnosticHandler))
        }
        processedMessages = nextMessages
        reported = [nextSurfaceId, nextRegistry, nextMessages]
        if (!resolver || resolver.disposed) {
          resolver = makeResolver(processor.getSurface(nextSurfaceId))
          bindRootSignal()
        }
        flushDiagnostics()
        notify()
        return
      }
      flushDiagnostics()
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
 * Coerces invalid model props at the boundary, isolates failing nodes inside per-node
 * error boundaries with text-content fallbacks, inherits styling from the surrounding
 * `ThemeScope`, and ignores agent-supplied theme hints.
 */
export function A2uiSurface({
  surfaceId,
  messages,
  registry = radiantA2uiRegistry,
  onAction,
  onDiagnostic
}: A2uiSurfaceProps) {
  const [store] = useState(() =>
    createSurfaceStore(surfaceId, registry, messages, onAction, onDiagnostic)
  )

  useEffect(() => {
    store.sync(surfaceId, registry, messages, onAction, onDiagnostic)
  }, [store, surfaceId, registry, messages, onAction, onDiagnostic])

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
          onDiagnostic={onDiagnostic}
        />
      ) : null}
    </div>
  )
}
