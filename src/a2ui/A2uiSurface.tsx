'use client'

import {
  Component,
  useEffect,
  useRef,
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
import { isPlainRecord, type CatalogDiagnostic } from '../catalog/coerce.js'
import { A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import {
  COERCED_NOOP_ACTION_NAME,
  coerceA2uiMessages,
  coerceA2uiResolvedProps,
  createA2uiCoerceState,
  extractA2uiNodeFallbackText,
  getRegistryEntry,
  type A2uiCoerceState
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

type EmitDiag = (d: CatalogDiagnostic) => void

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

const errorMsg = (e: unknown) =>
  e instanceof Error && e.message ? e.message : typeof e === 'string' ? e : 'Render error'

const renderDiag = (
  nodeId: string,
  component: string,
  received: string,
  used: string
): CatalogDiagnostic => ({
  kind: 'fallback',
  nodeId,
  component,
  prop: '$render',
  received,
  used,
  reason: 'Component threw during render.'
})

const sameDiags = (a: readonly CatalogDiagnostic[], b: readonly CatalogDiagnostic[]) =>
  a.length === b.length &&
  a.every(
    (l, i) =>
      l.kind === b[i]!.kind &&
      l.prop === b[i]!.prop &&
      Object.is(l.received, b[i]!.received) &&
      Object.is(l.used, b[i]!.used)
  )

const boundaryText = (node: ComponentNode, token: unknown) =>
  extractA2uiNodeFallbackText(node, isPlainRecord(token) ? token : undefined)

const renderFallbackSpan = (nodeId: string, text: string): ReactNode =>
  text ? (
    <span
      data-slot="a2ui-fallback"
      data-node-id={nodeId}
    >
      {text}
    </span>
  ) : null

type BoundaryProps = {
  readonly node: ComponentNode
  readonly resetToken: unknown
  readonly emit: EmitDiag
  readonly children: ReactNode
}

class A2uiNodeErrorBoundary extends Component<
  BoundaryProps,
  { readonly failed: boolean; readonly token: unknown }
> {
  override state = { failed: false, token: undefined as unknown }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  static getDerivedStateFromProps(
    next: BoundaryProps,
    prev: { readonly failed: boolean; readonly token: unknown }
  ) {
    if (!prev.failed) return null
    if (prev.token === undefined) return { failed: true, token: next.resetToken }
    return next.resetToken !== prev.token ? { failed: false, token: undefined } : null
  }
  override componentDidCatch(error: Error, _info: ErrorInfo) {
    const { node, resetToken, emit } = this.props
    emit(renderDiag(node.componentId, node.type, errorMsg(error), boundaryText(node, resetToken)))
  }
  override render(): ReactNode {
    if (!this.state.failed) return this.props.children
    return renderFallbackSpan(
      this.props.node.componentId,
      boundaryText(this.props.node, this.props.resetToken)
    )
  }
}

type NodeRenderProps = {
  readonly node: ComponentNode
  readonly registry: A2uiRegistry
  readonly inline: boolean
  readonly emit: EmitDiag
}

function A2uiNodeContent({
  node,
  props,
  registry,
  inline,
  emit
}: NodeRenderProps & { readonly props: Readonly<Record<string, unknown>> }): ReactNode {
  const entry = getRegistryEntry(registry, node.type)
  const resolved = entry ? coerceA2uiResolvedProps(entry, node, props) : undefined
  const reportedRef = useRef<readonly CatalogDiagnostic[]>([])
  const diags: CatalogDiagnostic[] = resolved ? [...resolved.diagnostics] : []
  let content: ReactNode = null

  if (entry && resolved) {
    try {
      content = entry.adapter(resolved.props, {
        node,
        inline,
        renderNode(child: ComponentNode, options?: A2uiRenderOptions) {
          return (
            <A2uiNodeRenderer
              key={child.id}
              node={child}
              registry={registry}
              inline={options?.inline ?? false}
              emit={emit}
            />
          )
        }
      })
    } catch (error) {
      const text = extractA2uiNodeFallbackText(node, resolved.props)
      diags.push(renderDiag(node.componentId, node.type, errorMsg(error), text))
      content = renderFallbackSpan(node.componentId, text)
    }
  }

  useEffect(() => {
    if (!diags.length) {
      reportedRef.current = []
      return
    }
    if (sameDiags(reportedRef.current, diags)) return
    reportedRef.current = diags
    for (const d of diags) emit(d)
  })

  return content
}

function A2uiNodeRenderer({ node, registry, inline, emit }: NodeRenderProps): ReactNode {
  const props = useSignalValue(node.props)
  if (!props || node.state !== 'resolved') return null
  return (
    <A2uiNodeErrorBoundary
      key={node.id}
      node={node}
      resetToken={props}
      emit={emit}
    >
      <A2uiNodeContent
        node={node}
        props={props}
        registry={registry}
        inline={inline}
        emit={emit}
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
  readonly emitDiagnostic: EmitDiag
  readonly sync: (
    surfaceId: string,
    registry: A2uiRegistry,
    messages: readonly A2uiMessage[],
    onAction: ((action: A2uiActionPayload) => void) | undefined,
    onDiagnostic: EmitDiag | undefined
  ) => void
  readonly dispose: () => void
}

function createSurfaceStore(
  initialSurfaceId: string,
  initialRegistry: A2uiRegistry,
  initialMessages: readonly A2uiMessage[],
  initialOnAction: ((action: A2uiActionPayload) => void) | undefined,
  initialOnDiagnostic: EmitDiag | undefined
): SurfaceStore {
  let surfaceId = initialSurfaceId
  let registry = initialRegistry
  let processedMessages = initialMessages
  let reported: readonly [string, A2uiRegistry, readonly A2uiMessage[]] | undefined
  let actionHandler = initialOnAction
  let diagnosticHandler = initialOnDiagnostic
  let disposed = false
  let coerceState: A2uiCoerceState = createA2uiCoerceState()
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
    targetSurfaceId: string,
    targetRegistry: A2uiRegistry,
    batch: readonly A2uiMessage[],
    record: boolean
  ) {
    const { messages: coerced, diagnostics } = coerceA2uiMessages(
      batch,
      targetRegistry,
      coerceState
    )
    if (record && diagnostics.length > 0) pendingDiagnostics.push(...diagnostics)
    const pushFallback = (
      nodeId: string,
      component: string,
      prop: string,
      received: unknown,
      err: unknown
    ) => {
      if (record)
        pendingDiagnostics.push({
          kind: 'fallback',
          nodeId,
          component,
          prop,
          received,
          used: undefined,
          reason: errorMsg(err)
        })
    }
    for (const message of coerced) {
      try {
        target.processMessages([message as ProcessableMessage])
      } catch (error) {
        const msg = isPlainRecord(message) ? message : undefined
        const version = typeof msg?.version === 'string' ? msg.version : A2UI_PROTOCOL_VERSION
        const createOp = isPlainRecord(msg?.createSurface) ? msg.createSurface : undefined
        const op =
          createOp ?? (isPlainRecord(msg?.updateComponents) ? msg.updateComponents : undefined)
        const sid = typeof op?.surfaceId === 'string' ? op.surfaceId : targetSurfaceId
        const comps = op && Array.isArray(op.components) ? op.components : undefined

        if (createOp && comps && !target.getSurface(sid)) {
          try {
            const { components: _drop, ...surfaceOnly } = createOp
            target.processMessages([{ version, createSurface: surfaceOnly } as ProcessableMessage])
          } catch {}
        }
        if (comps && target.getSurface(sid)) {
          for (const comp of comps) {
            try {
              target.processMessages([
                {
                  version,
                  updateComponents: { surfaceId: sid, components: [comp] }
                } as ProcessableMessage
              ])
            } catch (err) {
              const rec = isPlainRecord(comp) ? comp : undefined
              pushFallback(
                typeof rec?.id === 'string' ? rec.id : sid,
                typeof rec?.component === 'string' ? rec.component : '$surface',
                '$node',
                comp,
                err
              )
            }
          }
          continue
        }
        pushFallback(sid, '$surface', '$message', message, error)
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
    coerceState = createA2uiCoerceState()
    const sameBatch =
      reported?.[0] === nextSurfaceId &&
      reported[1] === nextRegistry &&
      reported[2] === nextMessages
    const webCoreCatalog = nextRegistry.toWebCoreCatalog()
    processor = new MessageProcessor(
      [webCoreCatalog],
      action => {
        if (action.name !== COERCED_NOOP_ACTION_NAME) actionHandler?.(action)
      },
      { version: A2UI_PROTOCOL_VERSION }
    )
    if (nextMessages.length > 0) {
      processBatch(
        processor,
        nextSurfaceId,
        nextRegistry,
        nextMessages,
        Boolean(diagnosticHandler) && !sameBatch
      )
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
    emitDiagnostic: d => diagnosticHandler?.(d),
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
          processBatch(processor, nextSurfaceId, nextRegistry, delta, Boolean(diagnosticHandler))
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
 * Coerces invalid model props at the catalog boundary, isolates rendered nodes inside
 * per-node text-fallback error boundaries on the client (and catches direct adapter throws
 * during synchronous `renderToString` SSR), inherits styling from the surrounding
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
          emit={store.emitDiagnostic}
        />
      ) : null}
    </div>
  )
}
