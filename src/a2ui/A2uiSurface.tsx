'use client'

import {
  cloneElement,
  Component,
  Fragment,
  isValidElement,
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ErrorInfo,
  type ReactNode,
  type Ref
} from 'react'
import { cn } from 'cn'
import type { ComponentApi, FunctionImplementation } from '@a2ui/web_core/catalog'
import { MessageProcessor, type ProcessableMessage } from '@a2ui/web_core/processing'
import { effect, getValue, peekValue } from '@a2ui/web_core/reactivity'
import { NodeResolver, type ComponentNode } from '@a2ui/web_core/resolution'
import type { ActionPayload, SurfaceModel } from '@a2ui/web_core/state'
import {
  createCatalogActionEvent,
  snapshotSurfaceState,
  type CatalogActionEvent,
  type CatalogDiagnostic
} from '../catalog/index.js'
import { isPlainRecord } from '../catalog/coerce.js'
import { focusRingClass } from '../components/shared/focusStyles.js'
import type { MotionProfile } from '../motion/config.js'
import { MotionProfileContext } from '../motion/context.js'
import { useComposedRefs } from '../react/useComposedRefs.js'
import { useLocale } from '../react/useLocale.js'
import { clampHeadingLevel, HeadingLevelProvider } from '../react/useHeadingLevel.js'
import type { HeadingLevel } from '../internal/headings.js'
import { warnA2uiAccessibility } from './accessibility.js'
import { A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import {
  COERCED_NOOP_ACTION_NAME,
  coerceA2uiMessages,
  extractA2uiNodeFallbackText,
  getRegistryEntry
} from './coerce.js'
import { A2uiPlaceholder, createPlaceholderTracker } from './A2uiPlaceholder.js'
import { radiantA2uiExtensionRegistry } from './extensionEntries.js'
import {
  createsSurface,
  deletesSurface,
  streamedComponents,
  protocolErrorDiagnostic,
  supersededBy,
  updatesSurface
} from './protocolErrors.js'
import {
  a2uiWebCoreCatalogs,
  type A2uiFlow,
  type A2uiRegistry,
  type A2uiRenderOptions
} from './registry.js'
import type { A2uiMessage } from './sanitize.js'
import { useSignalValue } from './useSignalValue.js'
import {
  ToastQueueProvider,
  ToastViewport,
  useToastQueueViewport
} from '../components/Toast/Toast.js'
import {
  A2uiLabelsContext,
  A2uiToastHostContext,
  type A2uiSurfaceLabels
} from './surfaceContext.js'
import {
  animateNodeEntry,
  captureFocusSnapshot,
  cloneMessageValue,
  createMicrotaskCoalescer,
  isHtmlElement,
  isMessagePrefix,
  restoreFocusFallback,
  type FocusSnapshot,
  type NodeHost
} from './surfaceRuntime.js'

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
  /** Registry mapping A2UI component names to Radiant adapters. Defaults to `radiantA2uiExtensionRegistry`. */
  readonly registry?: A2uiRegistry
  /** Host callback invoked when an outbound A2UI action event fires. */
  readonly onAction?: (action: A2uiActionPayload) => void
  /**
   * Host callback invoked whenever a prop is coerced, defaulted, stripped, or falls back, and for
   * catalog or protocol errors (`kind: 'error'` with a `code`).
   */
  readonly onDiagnostic?: (diagnostic: CatalogDiagnostic) => void
  /** Host-supplied text for controls the agent cannot describe; `notifications` gives Toast a viewport. */
  readonly labels?: A2uiSurfaceLabels
  /**
   * Level of the surface's top headings, so they fit the host outline; nested headings go one
   * deeper, up to 6. Defaults to an enclosing `HeadingLevelProvider`.
   */
  readonly headingLevel?: HeadingLevel
  /** Renders a root Column as a prose flow: prose text, reading width, and rhythm tokens. */
  readonly prose?: boolean
}

function isVisibleHost(element: HTMLElement): boolean {
  if (!element.isConnected || element.hidden || element.getClientRects().length === 0) return false
  const win = element.ownerDocument.defaultView
  return !win || win.getComputedStyle(element).visibility !== 'hidden'
}

function createSurfaceDomRuntime(initialMotionProfile: MotionProfile) {
  const hosts = new Map<string, NodeHost & { readonly elements?: readonly HTMLElement[] }>()
  const mountedInstances = new Map<string, string>()
  const containers = new Set<string>()
  const committedInstances = new Set<string>()
  const pendingMounts = new Set<string>()
  const unmountedInstances = new Set<string>()
  let surfaceElement: HTMLDivElement | null = null
  let motionProfile = initialMotionProfile
  let pendingFocus: FocusSnapshot | null = null
  const placeholders = createPlaceholderTracker()
  // Text nodes whose latest definition has not streamed its text yet; they reserve a line.
  const pendingText = new Set<string>()

  function flushBatch() {
    if (pendingFocus) {
      const snapshot = pendingFocus
      pendingFocus = null
      restoreFocusFallback(surfaceElement, snapshot, hosts)
    }
    if (surfaceElement?.isConnected && pendingMounts.size > 0) {
      for (const nodeId of pendingMounts) {
        const host = hosts.get(nodeId)
        if (!host || host.isContainer || !host.element.isConnected) continue
        if (committedInstances.has(host.instanceId) && unmountedInstances.has(host.instanceId)) {
          continue
        }
        for (const el of host.elements ?? [host.element]) {
          if (el.isConnected) animateNodeEntry(el, motionProfile)
        }
      }
      pendingMounts.clear()
    }
    for (const [nodeId, host] of hosts) {
      if (!mountedInstances.has(nodeId) || !host.element.isConnected) hosts.delete(nodeId)
    }
    for (const nodeId of containers) {
      if (!mountedInstances.has(nodeId)) containers.delete(nodeId)
    }
    unmountedInstances.clear()
    committedInstances.clear()
    for (const instanceId of mountedInstances.values()) committedInstances.add(instanceId)
  }

  const scheduleBatchFlush = createMicrotaskCoalescer(flushBatch)

  function captureFocus() {
    if (!pendingFocus) pendingFocus = captureFocusSnapshot(surfaceElement, hosts)
    if (pendingFocus) scheduleBatchFlush()
  }

  return {
    placeholders,
    pendingText,
    setSurfaceElement(element: HTMLDivElement | null) {
      surfaceElement = element
    },
    setMotionProfile(nextProfile: MotionProfile) {
      motionProfile = nextProfile
    },
    setNodeHost(
      nodeId: string,
      instanceId: string,
      element: unknown,
      isContainer?: boolean,
      elements?: readonly HTMLElement[]
    ) {
      if (isHtmlElement(element)) {
        hosts.set(nodeId, {
          nodeId,
          instanceId,
          element,
          elements,
          isContainer: isContainer ?? containers.has(nodeId)
        })
      } else if (element === null) {
        hosts.delete(nodeId)
      }
    },
    captureFocus,
    onNodeMount(nodeId: string, instanceId: string, requestProbe: () => void) {
      mountedInstances.set(nodeId, instanceId)
      pendingMounts.add(nodeId)
      const host = hosts.get(nodeId)
      if (
        !containers.has(nodeId) &&
        (!host || host.instanceId !== instanceId || !host.element.isConnected)
      ) {
        requestProbe()
      }
      scheduleBatchFlush()
    },
    onNodeUnmount(nodeId: string, instanceId: string) {
      mountedInstances.delete(nodeId)
      pendingMounts.delete(nodeId)
      unmountedInstances.add(instanceId)
      captureFocus()
      scheduleBatchFlush()
    },
    setNodeContainer(nodeId: string, isContainer: boolean) {
      if (isContainer) containers.add(nodeId)
      else containers.delete(nodeId)
      const host = hosts.get(nodeId)
      if (host && host.isContainer !== isContainer) hosts.set(nodeId, { ...host, isContainer })
    },
    onSurfaceRebuild() {
      committedInstances.clear()
      pendingMounts.clear()
      unmountedInstances.clear()
    }
  }
}

type SurfaceDomRuntime = ReturnType<typeof createSurfaceDomRuntime>

const boundaryFallbackText = (node: ComponentNode, token: unknown) =>
  extractA2uiNodeFallbackText(node, isPlainRecord(token) ? token : undefined)

type BoundaryProps = {
  readonly node: ComponentNode
  readonly resetToken: unknown
  readonly onDiagnostic: (diagnostic: CatalogDiagnostic) => void
  readonly onFallbackRef?: Ref<HTMLElement>
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
    onDiagnostic({
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
        ref={this.props.onFallbackRef}
        data-slot="a2ui-fallback"
        data-node-id={this.props.node.componentId}
      >
        {text}
      </span>
    ) : null
  }
}

type A2uiNodeRendererProps = {
  readonly node: ComponentNode
  readonly registry: A2uiRegistry
  readonly inline: boolean
  readonly flow?: A2uiFlow
  readonly onDiagnostic: (diagnostic: CatalogDiagnostic) => void
  readonly runtime: SurfaceDomRuntime
}

const LAYOUT_TYPES = new Set(['Column', 'Row', 'List'])

const A2uiNodeRenderer = memo(function A2uiNodeRenderer({
  node,
  registry,
  inline,
  flow,
  onDiagnostic,
  runtime
}: A2uiNodeRendererProps): ReactNode {
  const props = useSignalValue(node.props)
  const resolved = Boolean(props) && node.state === 'resolved'
  const entry = resolved ? getRegistryEntry(registry, node.type) : undefined
  const active = Boolean(entry)

  let hasChildNodes = false
  const adapted =
    props && entry
      ? entry.adapter(props, {
          node,
          inline,
          flow,
          reportDiagnostic: onDiagnostic,
          renderNode(child: ComponentNode, options?: A2uiRenderOptions) {
            if (!options?.inline) hasChildNodes = true
            return (
              <A2uiNodeRenderer
                key={child.id}
                node={child}
                registry={registry}
                inline={options?.inline ?? false}
                flow={options?.flow}
                onDiagnostic={onDiagnostic}
                runtime={runtime}
              />
            )
          }
        })
      : null
  // Text whose text has not streamed yet stays empty but reserves its line.
  const rendered =
    runtime.pendingText.has(node.componentId) &&
    isValidElement<{ className?: string }>(adapted) &&
    adapted.type !== Fragment
      ? cloneElement(adapted, {
          className: cn(
            adapted.props.className,
            inline ? 'inline-block min-h-[1lh]' : 'block min-h-[1lh]'
          )
        })
      : adapted

  const isContainer = LAYOUT_TYPES.has(node.type) || hasChildNodes
  const [probing, setProbing] = useState(false)
  const startRef = useRef<HTMLTemplateElement>(null)

  const setHostRef = useCallback(
    (element: HTMLElement | null) => runtime.setNodeHost(node.id, node.instanceId, element),
    [node.id, node.instanceId, runtime]
  )
  const hostElement =
    !inline && isValidElement<{ ref?: Ref<HTMLElement> }>(rendered) && rendered.type !== Fragment
      ? rendered
      : null
  const composedRef = useComposedRefs(setHostRef, hostElement?.props.ref)

  useLayoutEffect(() => {
    if (active && !inline) runtime.setNodeContainer(node.id, isContainer)
  }, [active, inline, isContainer, node.id, props, runtime])

  useLayoutEffect(() => {
    if (!active || inline) return
    runtime.onNodeMount(node.id, node.instanceId, () => setProbing(true))
    return () => runtime.onNodeUnmount(node.id, node.instanceId)
  }, [active, inline, node.id, node.instanceId, runtime])

  if (node.state === 'pending') {
    return (
      <A2uiPlaceholder
        nodeId={node.componentId}
        inline={inline}
        tracker={runtime.placeholders}
      />
    )
  }
  if (!props || !entry) return null

  return (
    <A2uiNodeErrorBoundary
      key={node.id}
      node={node}
      resetToken={props}
      onDiagnostic={onDiagnostic}
      onFallbackRef={inline ? undefined : setHostRef}
    >
      {probing ? <template ref={startRef} /> : null}
      {hostElement ? cloneElement(hostElement, { ref: composedRef }) : rendered}
      {probing ? (
        <template
          ref={end => {
            if (!end) return
            const start = startRef.current
            if (start && start.parentNode === end.parentNode) {
              const visible: HTMLElement[] = []
              for (
                let el = start.nextElementSibling;
                el && el !== end;
                el = el.nextElementSibling
              ) {
                if (isHtmlElement(el) && isVisibleHost(el)) visible.push(el)
              }
              if (visible.length > 0) {
                runtime.setNodeHost(
                  node.id,
                  node.instanceId,
                  visible[0],
                  isContainer,
                  visible.length > 1 ? visible : undefined
                )
              }
            }
            setProbing(false)
          }}
        />
      ) : null}
    </A2uiNodeErrorBoundary>
  )
})

type SurfacePhase = 'awaiting' | 'live' | 'closed'

function createSurfaceStore(
  initialSurfaceId: string,
  initialRegistry: A2uiRegistry,
  initialMessages: readonly A2uiMessage[],
  initialOnAction: ((action: A2uiActionPayload) => void) | undefined,
  initialOnDiagnostic: ((diagnostic: CatalogDiagnostic) => void) | undefined,
  runtime: SurfaceDomRuntime,
  initialLocale: string
) {
  // Basic functions such as formatNumber and pluralize format in this locale.
  let locale = initialLocale
  let surfaceId = initialSurfaceId
  let registry = initialRegistry
  let processedMessages: A2uiMessage[] = []
  let reported: readonly [string, A2uiRegistry, readonly A2uiMessage[]] | undefined
  let actionHandler = initialOnAction
  let diagnosticHandler = initialOnDiagnostic
  let disposed = false
  let processor: MessageProcessor<ComponentApi> | undefined
  let resolver: NodeResolver<ComponentApi, FunctionImplementation> | undefined
  let stopRootEffect: (() => void) | undefined
  let stopErrors: (() => void) | undefined
  let resolvedSurface: SurfaceModel<ComponentApi> | undefined
  // Errors are queued during sync, dropped on an identical rebuild, and delivered directly otherwise.
  let errorMode: 'direct' | 'queue' | 'suppress' = 'direct'
  // `awaiting` until createSurface succeeds; `closed` after deleteSurface or a failed create.
  let phase: SurfacePhase = 'awaiting'
  // Updates that arrive before their createSurface wait here instead of failing.
  let bufferedUpdates: A2uiMessage[] = []
  // Unknown components and icon names report once per node and value for each engine build.
  let reportedUnknown = new Set<string>()
  // A failing expression reports once per engine build, not once per evaluation.
  let reportedExpressions = new Set<string>()
  const pendingDiagnostics: CatalogDiagnostic[] = []
  const listeners = new Set<() => void>()

  const notify = () => {
    for (const listener of listeners) listener()
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
    stopErrors?.()
    stopErrors = undefined
    resolver?.dispose()
    resolver = undefined
    resolvedSurface = undefined
    processor?.dispose()
    processor = undefined
  }

  const makeResolver = (s: SurfaceModel<ComponentApi> | undefined) =>
    s ? new NodeResolver(s as SurfaceModel<ComponentApi, FunctionImplementation>) : undefined

  function withErrors(mode: typeof errorMode, run: () => void) {
    const previous = errorMode
    errorMode = mode
    try {
      run()
    } finally {
      errorMode = previous
    }
  }

  // Rebinds the resolver whenever the surface model is created, deleted, or recreated.
  function refreshResolver(target: MessageProcessor<ComponentApi>) {
    const surface = target.getSurface(surfaceId)
    if (resolver && !resolver.disposed && resolvedSurface === surface) return
    resolver?.dispose()
    resolvedSurface = surface
    resolver = makeResolver(surface)
    bindRootSignal()
  }

  function trackPendingText(
    coerced: readonly A2uiMessage[],
    diagnostics: readonly CatalogDiagnostic[]
  ) {
    for (const message of coerced) {
      for (const component of streamedComponents(message, surfaceId)) {
        if (component.component === 'Text') runtime.pendingText.delete(String(component.id))
      }
    }
    for (const d of diagnostics) {
      if (d.component === 'Text' && d.prop === 'text' && d.kind === 'defaulted') {
        runtime.pendingText.add(d.nodeId)
      }
    }
  }

  function dropBuffered(reason: string) {
    if (bufferedUpdates.length === 0) return
    pendingDiagnostics.push({
      kind: 'error',
      code: 'DROPPED_UPDATES',
      nodeId: '',
      component: 'surface',
      prop: 'message',
      received: bufferedUpdates.length,
      used: undefined,
      reason
    })
    bufferedUpdates = []
  }

  // Each message is applied on its own so one protocol error cannot drop the rest of a batch.
  function processBatch(
    target: MessageProcessor<ComponentApi>,
    targetRegistry: A2uiRegistry,
    batch: readonly A2uiMessage[],
    record: boolean
  ) {
    // Coerce each message once its surface's catalog is known, so held updates wait raw.
    const coerce = (messages: readonly A2uiMessage[]) => {
      const { messages: coerced, diagnostics } = coerceA2uiMessages(
        messages,
        targetRegistry,
        id => target.getSurface(id)?.defaultCatalog?.id
      )
      trackPendingText(coerced, diagnostics)
      if (record) {
        for (const diagnostic of diagnostics) {
          if (diagnostic.code === 'UNKNOWN_COMPONENT_TYPE' || diagnostic.code === 'UNKNOWN_ICON') {
            const key = `${diagnostic.nodeId}\u0000${String(diagnostic.received)}`
            if (reportedUnknown.has(key)) continue
            reportedUnknown.add(key)
          }
          pendingDiagnostics.push(diagnostic)
        }
      }
      return coerced
    }
    const apply = (message: A2uiMessage) =>
      target.processMessages([message] as readonly ProcessableMessage[])
    for (const raw of batch.map(message => cloneMessageValue(message))) {
      if (phase === 'awaiting' && updatesSurface(raw, surfaceId)) {
        bufferedUpdates.push(raw)
        continue
      }
      for (const message of coerce([raw])) {
        apply(message)
        if (createsSurface(message, surfaceId)) {
          if (target.getSurface(surfaceId)) {
            phase = 'live'
            const held = bufferedUpdates.filter(update => !supersededBy(message, update))
            bufferedUpdates = []
            for (const update of coerce(held)) apply(update)
          } else if (phase === 'awaiting') {
            phase = 'closed'
            dropBuffered('createSurface failed; buffered updates were dropped.')
          }
        } else if (deletesSurface(message, surfaceId) && !target.getSurface(surfaceId)) {
          phase = 'closed'
        }
        refreshResolver(target)
      }
    }
  }

  function buildEngine(
    nextSurfaceId: string,
    nextRegistry: A2uiRegistry,
    nextMessages: readonly A2uiMessage[]
  ) {
    teardownEngine()
    runtime.onSurfaceRebuild()
    disposed = false
    surfaceId = nextSurfaceId
    registry = nextRegistry
    bufferedUpdates = []
    reportedUnknown = new Set()
    reportedExpressions = new Set()
    runtime.pendingText.clear()
    phase = 'awaiting'
    const wireSnapshot = nextMessages.map(message => cloneMessageValue(message))
    processedMessages = wireSnapshot
    const sameBatch =
      reported?.[0] === nextSurfaceId &&
      reported[1] === nextRegistry &&
      reported[2].length === wireSnapshot.length &&
      isMessagePrefix(reported[2], wireSnapshot)
    processor = new MessageProcessor(
      a2uiWebCoreCatalogs(nextRegistry, locale),
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
      { version: A2UI_PROTOCOL_VERSION, reportErrorsOnly: true }
    )
    const errorSubscription = processor.model.onError.subscribe(error => {
      if (errorMode === 'suppress' || (error.surfaceId && error.surfaceId !== surfaceId)) return
      const diagnostic = protocolErrorDiagnostic(error)
      if (diagnostic.code === 'EXPRESSION_ERROR') {
        if (reportedExpressions.has(diagnostic.reason)) return
        reportedExpressions.add(diagnostic.reason)
      }
      if (errorMode === 'queue') pendingDiagnostics.push(diagnostic)
      else diagnosticHandler?.(diagnostic)
    })
    stopErrors = () => errorSubscription.unsubscribe()
    const target = processor
    withErrors(sameBatch ? 'suppress' : 'queue', () => {
      const before = pendingDiagnostics.length
      processBatch(target, nextRegistry, wireSnapshot, Boolean(diagnosticHandler) && !sameBatch)
      refreshResolver(target)
      if (sameBatch) pendingDiagnostics.length = before
    })
    reported = [nextSurfaceId, nextRegistry, wireSnapshot]
  }

  buildEngine(initialSurfaceId, initialRegistry, initialMessages)

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      if (listeners.size === 1) bindRootSignal()
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
    getPhase: () => phase,
    reportDiagnostic(diagnostic: CatalogDiagnostic) {
      diagnosticHandler?.(diagnostic)
    },
    sync(
      nextSurfaceId: string,
      nextRegistry: A2uiRegistry,
      nextMessages: readonly A2uiMessage[],
      nextOnAction: ((action: A2uiActionPayload) => void) | undefined,
      nextOnDiagnostic: ((diagnostic: CatalogDiagnostic) => void) | undefined,
      nextLocale: string
    ) {
      const localeChanged = locale !== nextLocale
      locale = nextLocale
      actionHandler = nextOnAction
      diagnosticHandler = nextOnDiagnostic
      if (!diagnosticHandler) pendingDiagnostics.length = 0
      if (
        disposed ||
        localeChanged ||
        !processor ||
        surfaceId !== nextSurfaceId ||
        registry !== nextRegistry ||
        !isMessagePrefix(processedMessages, nextMessages)
      ) {
        runtime.captureFocus()
        buildEngine(nextSurfaceId, nextRegistry, nextMessages)
        flushDiagnostics()
        notify()
        return
      }
      if (nextMessages.length > processedMessages.length) {
        runtime.captureFocus()
        const delta = nextMessages
          .slice(processedMessages.length)
          .map(message => cloneMessageValue(message))
        const target = processor
        withErrors('queue', () => {
          processBatch(target, nextRegistry, delta, Boolean(diagnosticHandler))
          refreshResolver(target)
        })
        processedMessages.push(...delta)
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

const zeroPlaceholders = () => 0

/**
 * Renders an A2UI 1.0 surface directly onto Radiant components via `@a2ui/web_core`.
 * Merges appended patches incrementally by stable node ID to keep local state, focus,
 * scroll position, and drags intact, animates newly added instances once, and recovers
 * removed-node focus as documented in `docs/architecture.md`.
 */
export function A2uiSurface({
  surfaceId,
  messages,
  registry = radiantA2uiExtensionRegistry,
  onAction,
  onDiagnostic,
  labels,
  headingLevel,
  prose = false
}: A2uiSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const motionProfile = useContext(MotionProfileContext)
  const locale = useLocale()

  const [runtime] = useState(() => createSurfaceDomRuntime(motionProfile))
  const [store] = useState(() =>
    createSurfaceStore(surfaceId, registry, messages, onAction, onDiagnostic, runtime, locale)
  )

  useLayoutEffect(() => {
    runtime.setSurfaceElement(surfaceRef.current)
    return () => runtime.setSurfaceElement(null)
  }, [runtime])

  useLayoutEffect(() => {
    runtime.setMotionProfile(motionProfile)
  }, [runtime, motionProfile])

  useEffect(() => {
    store.sync(surfaceId, registry, messages, onAction, onDiagnostic, locale)
  }, [store, surfaceId, registry, messages, onAction, onDiagnostic, locale])

  useEffect(() => () => store.dispose(), [store])

  useEffect(() => warnA2uiAccessibility(messages, registry), [messages, registry])

  const rootType = useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot()?.type,
    () => store.getSnapshot()?.type
  )
  useEffect(() => {
    if (!prose || rootType === undefined || rootType === 'Column') return
    store.reportDiagnostic({
      kind: 'fallback',
      nodeId: 'root',
      component: rootType,
      prop: 'prose',
      received: rootType,
      used: 'layout',
      reason: 'Only a root Column becomes a prose flow; the surface keeps its layout.'
    })
  }, [prose, rootType, store])

  const rootNode = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const phase = useSyncExternalStore(store.subscribe, store.getPhase, store.getPhase)
  const placeholders = useSyncExternalStore(
    runtime.placeholders.subscribe,
    runtime.placeholders.getSnapshot,
    zeroPlaceholders
  )
  const waiting = !rootNode && phase !== 'closed'
  const modalClose = labels?.modalClose
  const toastClose = labels?.toastClose
  const notifications = labels?.notifications?.trim()
  const revealPrevious = labels?.revealPrevious
  const revealNext = labels?.revealNext
  const revealPosition = labels?.revealPosition
  const labelValue = useMemo(
    () => ({ modalClose, notifications, toastClose, revealPrevious, revealNext, revealPosition }),
    [modalClose, notifications, toastClose, revealPrevious, revealNext, revealPosition]
  )
  const surface = (
    <div
      ref={surfaceRef}
      tabIndex={-1}
      className={focusRingClass}
      aria-busy={waiting || placeholders > 0 ? true : undefined}
      data-slot="a2ui-surface"
      data-surface-id={surfaceId}
      data-rad-type-container={prose ? '' : undefined}
      // A content-sized host would otherwise give the container no width.
      style={prose ? { containIntrinsicInlineSize: '20rem' } : undefined}
    >
      {rootNode ? (
        <A2uiLabelsContext.Provider value={labelValue}>
          <A2uiHeadingScope level={headingLevel}>
            <A2uiNodeRenderer
              node={rootNode}
              registry={registry}
              inline={false}
              flow={prose ? 'root' : undefined}
              onDiagnostic={store.reportDiagnostic}
              runtime={runtime}
            />
          </A2uiHeadingScope>
        </A2uiLabelsContext.Provider>
      ) : waiting ? (
        <A2uiPlaceholder
          inline={false}
          tracker={runtime.placeholders}
        />
      ) : null}
    </div>
  )

  return <A2uiToastScope notifications={notifications}>{surface}</A2uiToastScope>
}

/**
 * Gives a surface's Toast nodes a queue and viewport: a host ToastProvider's when one encloses
 * the surface, else the surface's own. The queue mounts unconditionally, so a label arriving
 * later keeps the tree; the viewport and announcers render beside the surface only with a label.
 */
function A2uiToastScope({
  notifications,
  children
}: {
  readonly notifications: string | undefined
  readonly children: ReactNode
}) {
  const outer = useToastQueueViewport()
  if (outer) {
    return (
      <A2uiToastHostContext.Provider value={HOST_TOASTS}>{children}</A2uiToastHostContext.Provider>
    )
  }
  return (
    <ToastQueueProvider announcers={Boolean(notifications)}>
      <A2uiToastHostContext.Provider value={notifications ? HOST_TOASTS : NO_TOASTS}>
        {children}
        {notifications ? <ToastViewport aria-label={notifications} /> : null}
      </A2uiToastHostContext.Provider>
    </ToastQueueProvider>
  )
}

function A2uiHeadingScope({
  level,
  children
}: {
  readonly level: HeadingLevel | undefined
  readonly children: ReactNode
}) {
  return level === undefined ? (
    children
  ) : (
    <HeadingLevelProvider level={clampHeadingLevel(level)}>{children}</HeadingLevelProvider>
  )
}

const HOST_TOASTS = { available: true }
const NO_TOASTS = { available: false }
