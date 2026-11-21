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
import type { ActionPayload } from '@a2ui/web_core/state'
import type { CatalogDiagnostic } from '../catalog/index.js'
import { A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import {
  COERCED_NOOP_ACTION_NAME,
  coerceA2uiMessages,
  extractA2uiNodeFallbackText
} from './coerce.js'
import { radiantA2uiRegistry } from './entries.js'
import type { A2uiRegistry, A2uiRenderOptions } from './registry.js'
import type { A2uiMessage } from './sanitize.js'

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

function errorToMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return typeof error === 'string' ? error : 'Unknown render error'
}

function A2uiFallbackText({
  nodeId,
  component,
  fallbackText,
  errorMessage,
  emitDiagnostic
}: {
  readonly nodeId: string
  readonly component: string
  readonly fallbackText: string
  readonly errorMessage?: string
  readonly emitDiagnostic?: (diagnostic: CatalogDiagnostic) => void
}): ReactNode {
  useEffect(() => {
    if (!errorMessage || !emitDiagnostic) return
    emitDiagnostic({
      kind: 'fallback',
      nodeId,
      component,
      prop: '$render',
      received: errorMessage,
      used: fallbackText,
      reason: 'Component threw during render; fell back to text content.'
    })
  }, [nodeId, component, fallbackText, errorMessage, emitDiagnostic])

  if (!fallbackText) return null
  return (
    <span
      data-slot="a2ui-fallback"
      data-node-id={nodeId}
    >
      {fallbackText}
    </span>
  )
}

type NodeErrorBoundaryProps = {
  readonly node: ComponentNode
  readonly emitDiagnostic: (diagnostic: CatalogDiagnostic) => void
  readonly children: ReactNode
}

type NodeErrorBoundaryState = {
  readonly failed: boolean
}

class A2uiNodeErrorBoundary extends Component<NodeErrorBoundaryProps, NodeErrorBoundaryState> {
  override state: NodeErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): NodeErrorBoundaryState {
    return { failed: true }
  }

  override componentDidCatch(error: Error, _info: ErrorInfo) {
    const { node, emitDiagnostic } = this.props
    const fallbackText = extractA2uiNodeFallbackText(node)
    emitDiagnostic({
      kind: 'fallback',
      nodeId: node.componentId,
      component: node.type,
      prop: '$render',
      received: errorToMessage(error),
      used: fallbackText,
      reason: 'Component threw during render; fell back to text content.'
    })
  }

  override render(): ReactNode {
    if (this.state.failed) {
      const { node } = this.props
      const fallbackText = extractA2uiNodeFallbackText(node)
      if (!fallbackText) return null
      return (
        <span
          data-slot="a2ui-fallback"
          data-node-id={node.componentId}
        >
          {fallbackText}
        </span>
      )
    }
    return this.props.children
  }
}

function A2uiNodeContent({
  node,
  registry,
  inline,
  emitDiagnostic
}: {
  readonly node: ComponentNode
  readonly registry: A2uiRegistry
  readonly inline: boolean
  readonly emitDiagnostic: (diagnostic: CatalogDiagnostic) => void
}): ReactNode {
  const props = useSignalValue(node.props)
  if (!props || node.state !== 'resolved') return null
  const entry = registry.entries[node.type]
  if (!entry) return null

  try {
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
            emitDiagnostic={emitDiagnostic}
          />
        )
      }
    })
  } catch (error) {
    return (
      <A2uiFallbackText
        nodeId={node.componentId}
        component={node.type}
        fallbackText={extractA2uiNodeFallbackText(node, props)}
        errorMessage={errorToMessage(error)}
        emitDiagnostic={emitDiagnostic}
      />
    )
  }
}

function A2uiNodeRenderer({
  node,
  registry,
  inline,
  emitDiagnostic
}: {
  readonly node: ComponentNode
  readonly registry: A2uiRegistry
  readonly inline: boolean
  readonly emitDiagnostic: (diagnostic: CatalogDiagnostic) => void
}): ReactNode {
  return (
    <A2uiNodeErrorBoundary
      key={node.id}
      node={node}
      emitDiagnostic={emitDiagnostic}
    >
      <A2uiNodeContent
        node={node}
        registry={registry}
        inline={inline}
        emitDiagnostic={emitDiagnostic}
      />
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
  readonly emitDiagnostic: (diagnostic: CatalogDiagnostic) => void
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
  let reportedSurfaceId: string | undefined
  let reportedRegistry: A2uiRegistry | undefined
  let reportedMessages: readonly A2uiMessage[] = []
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
    if (!diagnosticHandler || pendingDiagnostics.length === 0) return
    const batch = pendingDiagnostics.splice(0, pendingDiagnostics.length)
    for (const diagnostic of batch) {
      diagnosticHandler(diagnostic)
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

  function processCoercedMessages(
    targetProcessor: MessageProcessor<ComponentApi>,
    targetSurfaceId: string,
    targetRegistry: A2uiRegistry,
    batch: readonly A2uiMessage[],
    recordDiagnostics: boolean
  ) {
    const { messages: coerced, diagnostics } = coerceA2uiMessages(batch, targetRegistry)
    if (recordDiagnostics && diagnostics.length > 0) {
      pendingDiagnostics.push(...diagnostics)
    }
    for (const message of coerced) {
      try {
        targetProcessor.processMessages([message as ProcessableMessage])
      } catch (error) {
        if (recordDiagnostics) {
          pendingDiagnostics.push({
            kind: 'fallback',
            nodeId: targetSurfaceId,
            component: '$surface',
            prop: '$message',
            received: message,
            used: undefined,
            reason: errorToMessage(error)
          })
        }
      }
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
    const isSameReportedBatch =
      reportedSurfaceId === nextSurfaceId &&
      reportedRegistry === nextRegistry &&
      reportedMessages === nextMessages
    const webCoreCatalog = nextRegistry.toWebCoreCatalog()
    processor = new MessageProcessor(
      [webCoreCatalog],
      action => {
        if (action.name === COERCED_NOOP_ACTION_NAME) return
        actionHandler?.(action)
      },
      { version: A2UI_PROTOCOL_VERSION }
    )
    if (nextMessages.length > 0) {
      processCoercedMessages(
        processor,
        nextSurfaceId,
        nextRegistry,
        nextMessages,
        !isSameReportedBatch
      )
    }
    reportedSurfaceId = nextSurfaceId
    reportedRegistry = nextRegistry
    reportedMessages = nextMessages
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
    emitDiagnostic(diagnostic) {
      if (diagnosticHandler) {
        diagnosticHandler(diagnostic)
      } else {
        pendingDiagnostics.push(diagnostic)
      }
    },
    sync(nextSurfaceId, nextRegistry, nextMessages, nextOnAction, nextOnDiagnostic) {
      actionHandler = nextOnAction
      diagnosticHandler = nextOnDiagnostic
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
          processCoercedMessages(processor, nextSurfaceId, nextRegistry, delta, true)
        }
        processedMessages = nextMessages
        reportedMessages = nextMessages
        if (!resolver || resolver.disposed) {
          const surface = processor.getSurface(nextSurfaceId)
          resolver = surface
            ? new NodeResolver(surface, nextRegistry.toWebCoreCatalog())
            : undefined
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
 * Coerces invalid model props at the catalog boundary, isolates every node in its own
 * error boundary, inherits styling from the surrounding `ThemeScope`, and ignores
 * agent-supplied theme hints.
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
          emitDiagnostic={store.emitDiagnostic}
        />
      ) : null}
    </div>
  )
}
