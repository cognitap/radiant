'use client'

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject
} from 'react'
import { createPortal } from 'react-dom'
import { Button, type ButtonProps, type ButtonRenderProps } from './Button.js'
import {
  ComposedLink,
  type ComposedLinkProps,
  type ComposedLinkRenderProps
} from './composedLink.js'
import { Drawer, DrawerContent, DrawerTitle, DrawerClose, useDrawer } from './Drawer.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { composeAction } from './internal/events.js'
import type { WithoutToggle, DistributiveOmit } from './internal/types.js'
import { useControllableState } from './react/useControllableState.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import type { StateOwner } from './react/useNativeOwner.js'
import { useTransitionHost } from './motion/host.js'
import type { PartStyle } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type AppShellProps = Omit<ComponentProps<'div'>, 'style'> &
  StateOwner<'collapsed', boolean> &
  StateOwner<'open', boolean> & {
    style?: ThemeStyle
    'data-slot'?: string
    onCollapsedChange?: (collapsed: boolean) => void
    onOpenChange?: (open: boolean) => void
    mainId?: string
    sidebarId?: string
    motion?: 'inherit' | 'off'
  }
export type AppShellState = {
  collapsed: boolean
  open: boolean
  mobile: boolean
  collapsedControlled: boolean
  openControlled: boolean
  mainId: string
  sidebarId: string
  setCollapsed: (collapsed: boolean) => void
  setOpen: (open: boolean) => void
}
type Binding = AppShellState & {
  root: RefObject<HTMLDivElement | null>
  drawerId: string
  labelId: string
  motion: 'inherit' | 'off'
}
const Context = createContext<Binding | null>(null)
export function useAppShell(): AppShellState | null {
  return useContext(Context)
}
export function useSidebar(): AppShellState | null {
  return useContext(Context)
}
function useBinding() {
  const value = useContext(Context)
  if (!value) throw new Error('AppShell and Sidebar parts must render inside AppShell.')
  return value
}
function Provider({
  binding,
  children
}: {
  binding: Omit<Binding, 'drawerId'>
  children: ReactNode
}) {
  const drawer = useDrawer()
  if (!drawer) throw new Error('AppShell requires its Drawer.')
  return (
    <Context.Provider value={{ ...binding, drawerId: drawer.contentId }}>
      {children}
    </Context.Provider>
  )
}
function toggleFocus(root: HTMLElement | null) {
  ;(
    root?.querySelector<HTMLElement>('[data-slot~="sidebar-trigger"]:not(:disabled)') ??
    root?.querySelector<HTMLElement>('[data-slot~="app-shell-main"]')
  )?.focus({ preventScroll: true })
}
export function AppShell({
  collapsed,
  defaultCollapsed,
  onCollapsedChange,
  open,
  defaultOpen,
  onOpenChange,
  mainId,
  sidebarId,
  motion = 'inherit',
  ref,
  className,
  onFocusCapture,
  ...props
}: AppShellProps) {
  const collapse = useControllableState({
      name: 'AppShell collapsed',
      value: collapsed,
      defaultValue: defaultCollapsed,
      initialValue: false,
      onChange: onCollapsedChange
    }),
    drawer = useControllableState({
      name: 'AppShell open',
      value: open,
      defaultValue: defaultOpen,
      initialValue: false,
      onChange: onOpenChange
    })
  if (typeof collapse.value !== 'boolean' || typeof drawer.value !== 'boolean')
    throw new TypeError('AppShell states must be boolean.')
  for (const id of [mainId, sidebarId])
    if (id !== undefined && (!id || /\s/.test(id)))
      throw new TypeError('AppShell relationship IDs must be nonempty and contain no whitespace.')
  const root = useRef<HTMLDivElement>(null),
    host = useComposedRefs(root, ref),
    { ref: layoutRef } = useTransitionHost('layout', host, motion === 'off'),
    [mobile, setMobile] = useState(false),
    id = useId(),
    latestOpen = useRef(drawer.request),
    focused = useRef<HTMLElement | null>(null),
    previous = useRef(collapse.value)
  useLayoutEffect(() => {
    latestOpen.current = drawer.request
  })
  useEffect(() => {
    const node = root.current
    if (!node) return
    const query = node.ownerDocument.defaultView!.matchMedia('(width < 40rem)')
    setMobile(query.matches)
    const change = () => {
      setMobile(query.matches)
      if (!query.matches) latestOpen.current(false)
    }
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  useLayoutEffect(() => {
    const node = root.current,
      active = focused.current
    if (
      node &&
      !mobile &&
      collapse.value &&
      !previous.current &&
      active?.closest('[data-slot~="sidebar-content"][data-expanded-only]') &&
      (node.ownerDocument.activeElement === node.ownerDocument.body ||
        node.ownerDocument.activeElement === active)
    )
      toggleFocus(node)
    previous.current = collapse.value
  })
  const setCollapsed = (next: boolean) => {
    if (typeof next !== 'boolean')
      throw new TypeError('AppShell collapsed requests must be boolean.')
    collapse.request(next)
  }
  const setOpen = (next: boolean) => {
    if (typeof next !== 'boolean') throw new TypeError('AppShell open requests must be boolean.')
    drawer.request(next)
  }
  return (
    <Drawer
      open={mobile && drawer.value}
      onOpenChange={setOpen}
      snapPoints={[1]}
    >
      <Provider
        binding={{
          collapsed: collapse.value,
          open: drawer.value,
          mobile,
          collapsedControlled: collapse.controlled,
          openControlled: drawer.controlled,
          setCollapsed,
          setOpen,
          mainId: mainId ?? `${id}-main`,
          sidebarId: sidebarId ?? `${id}-sidebar`,
          labelId: `${id}-sidebar-label`,
          root,
          motion
        }}
      >
        <div
          {...props}
          ref={layoutRef}
          data-slot={joinIds('app-shell', props['data-slot'])}
          data-collapsed={collapse.value || undefined}
          data-mobile={mobile || undefined}
          data-state={
            mobile ? (drawer.value ? 'open' : 'closed') : collapse.value ? 'closed' : 'open'
          }
          data-motion={motion}
          className={cn(
            'relative grid h-dvh min-h-0 min-w-0 grid-cols-[var(--_rad-shell-sidebar)_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] [--_rad-shell-sidebar:var(--rad-sidebar-width,16rem)] data-collapsed:[--_rad-shell-sidebar:var(--rad-sidebar-collapsed-width,5rem)] max-[40rem]:grid-cols-[0_minmax(0,1fr)] bg-[var(--rad-app-shell-background,var(--rad-color-surface,white))] text-[var(--rad-app-shell-color,var(--rad-color-foreground,black))]',
            className
          )}
          onFocusCapture={event => {
            onFocusCapture?.(event)
            focused.current = event.target
          }}
        >
          {props.children}
        </div>
      </Provider>
    </Drawer>
  )
}
export type AppShellHeaderProps = Omit<ComponentProps<'header'>, 'style' | 'role'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
export function AppShellHeader({ className, ...props }: AppShellHeaderProps) {
  useBinding()
  return (
    <div
      data-rad-layout-slot=""
      className="col-span-2 row-start-1 min-w-0"
    >
      <div
        data-rad-layout-part=""
        className="flow-root size-full"
      >
        <header
          {...props}
          role="banner"
          data-slot={joinIds('app-shell-header', props['data-slot'])}
          className={cn(
            'box-border flex min-w-0 items-center justify-between gap-4 min-h-[var(--rad-app-shell-header-min-height,3.5rem)] p-[var(--rad-app-shell-header-padding,1rem)] border-b-[length:var(--rad-app-shell-header-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-surface-border-style,solid)] border-[var(--rad-app-shell-header-border-color,var(--rad-color-border))] bg-[var(--rad-app-shell-header-background,var(--rad-color-surface))] text-[var(--rad-app-shell-header-color,var(--rad-color-foreground))]',
            className
          )}
        />
      </div>
    </div>
  )
}
export type AppShellMainProps = Omit<
  ComponentProps<'main'>,
  'style' | 'role' | 'id' | 'tabIndex'
> & { style?: ThemeStyle; 'data-slot'?: string }
export function AppShellMain({ className, ...props }: AppShellMainProps) {
  const shell = useBinding()
  return (
    <div
      data-rad-layout-slot=""
      className="col-start-2 row-start-2 min-h-0 min-w-0"
    >
      <div
        data-rad-layout-part=""
        className="flow-root size-full"
      >
        <main
          {...props}
          id={shell.mainId}
          role="main"
          tabIndex={-1}
          data-slot={joinIds('app-shell-main', props['data-slot'])}
          className={cn(
            'relative box-border size-full min-h-0 min-w-0 overflow-auto p-[var(--rad-app-shell-main-padding,var(--rad-surface-padding,1.5rem))] focus-visible:[outline-style:var(--rad-focus-style,solid)] focus-visible:outline-[color:var(--rad-color-focus)] focus-visible:outline-[length:var(--rad-focus-width,2px)] focus-visible:outline-offset-[-2px]',
            className
          )}
        />
      </div>
    </div>
  )
}
export type AppShellRenderProps = ComposedLinkRenderProps
export type AppShellSkipLinkProps = Omit<ComposedLinkProps, 'href'>
export function AppShellSkipLink({ className, ...props }: AppShellSkipLinkProps) {
  const shell = useBinding()
  return (
    <ComposedLink
      {...props}
      identity="app-shell-skip-link"
      href={`#${shell.mainId}`}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded focus:bg-[var(--rad-color-surface)] focus:p-3',
        className
      )}
    />
  )
}
export type SidebarProps = Omit<
  ComponentProps<'nav'>,
  'style' | 'role' | 'id' | 'aria-label' | 'aria-labelledby' | 'tabIndex'
> & {
  style?: ThemeStyle
  'data-slot'?: string
  label: ReactNode
  closeLabel?: string
  parts?: { label?: PartStyle; drawer?: PartStyle; viewport?: PartStyle; close?: PartStyle }
}
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The named native navigation viewport accepts focus for keyboard scrolling. */
export function Sidebar({
  label,
  closeLabel = 'Close navigation',
  parts,
  ref,
  className,
  children,
  ...props
}: SidebarProps) {
  const shell = useBinding(),
    desktop = useRef<HTMLDivElement>(null),
    dock = useRef<HTMLDivElement>(null),
    [container, setContainer] = useState<HTMLDivElement | null>(null),
    collapsed = shell.collapsed && !shell.mobile
  if (
    label === null ||
    label === undefined ||
    typeof label === 'boolean' ||
    (typeof label === 'string' && !label.trim()) ||
    !closeLabel.trim()
  )
    throw new TypeError('Sidebar requires meaningful navigation and close labels.')
  useLayoutEffect(() => {
    const slot = desktop.current
    if (!slot) return
    const node = slot.ownerDocument.createElement('div')
    node.setAttribute('data-rad-layout-part', '')
    node.className = 'flow-root size-full min-w-0'
    setContainer(node)
    return () => node.remove()
  }, [])
  useLayoutEffect(() => {
    if (!container) return
    const target = shell.mobile ? dock.current : desktop.current
    if (!target) return
    const doc = target.ownerDocument,
      view = doc.defaultView!,
      active = doc.activeElement,
      held =
        active instanceof doc.defaultView!.HTMLElement && container.contains(active) ? active : null
    if (container.parentElement === target) return
    target.append(container)
    if (held && shell.mobile && !shell.open)
      toggleFocus(desktop.current?.closest('[data-slot~="app-shell"]') ?? null)
    let frame = 0
    if (held && (!shell.mobile || shell.open))
      frame = view.requestAnimationFrame(() => {
        if (
          doc.activeElement === doc.body ||
          (doc.activeElement?.closest('[data-slot~="sidebar-trigger"]') &&
            desktop.current?.closest('[data-slot~="app-shell"]')?.contains(doc.activeElement)) ||
          dock.current?.closest('dialog')?.contains(doc.activeElement)
        )
          held.focus({ preventScroll: true })
      })
    return () => view.cancelAnimationFrame(frame)
  }, [container, shell.mobile, shell.open])
  const navigation = (
    <nav
      {...props}
      ref={ref}
      role="navigation"
      id={shell.sidebarId}
      aria-labelledby={shell.labelId}
      tabIndex={0}
      data-slot={joinIds('sidebar', props['data-slot'])}
      data-collapsed={collapsed || undefined}
      data-state={shell.mobile ? (shell.open ? 'open' : 'closed') : collapsed ? 'closed' : 'open'}
      className={cn(
        'relative box-border flex size-full min-h-0 min-w-0 flex-col overflow-auto gap-[var(--rad-sidebar-gap,1rem)] p-[var(--rad-sidebar-padding,0.5rem)] border-e-[length:var(--rad-sidebar-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-surface-border-style,solid)] border-[var(--rad-sidebar-border-color,var(--rad-color-border))] bg-[var(--rad-sidebar-background,var(--rad-color-surface))] text-[var(--rad-sidebar-color,var(--rad-color-foreground))]',
        className
      )}
    >
      <h2
        id={shell.labelId}
        data-slot="sidebar-label"
        className={cn(
          'm-0 font-[family-name:var(--rad-typography-roles-ui-title-family,system-ui,sans-serif)] text-[length:var(--rad-sidebar-label-size,1rem)] font-[number:var(--rad-typography-roles-ui-title-weight,600)] tracking-[var(--rad-typography-roles-ui-title-letter-spacing,-0.015em)]',
          collapsed || shell.mobile ? 'sr-only' : undefined,
          parts?.label?.className
        )}
        style={parts?.label?.style}
      >
        {label}
      </h2>
      {children}
    </nav>
  )
  return (
    <>
      <div
        ref={desktop}
        data-slot="sidebar-slot"
        data-rad-layout-slot={shell.mobile ? undefined : ''}
        className="col-start-1 row-start-2 min-h-0 min-w-0 max-[40rem]:hidden"
      >
        {!container && (
          <div
            data-rad-layout-part=""
            className="flow-root size-full"
          >
            {navigation}
          </div>
        )}
      </div>
      <DrawerContent
        side="start"
        motion={shell.motion}
        className={cn(
          'open:w-[min(var(--rad-sidebar-width,16rem),90dvw)]',
          parts?.drawer?.className
        )}
        style={parts?.drawer?.style}
        parts={{
          viewport: {
            className: cn('flex flex-col gap-0 p-0', parts?.viewport?.className),
            style: parts?.viewport?.style
          }
        }}
      >
        <div className="flex items-center justify-between gap-3 p-3">
          <DrawerTitle className="m-0 text-base">{label}</DrawerTitle>
          <DrawerClose
            variant="ghost"
            tone="neutral"
            controlSize="small"
            className={parts?.close?.className}
            style={parts?.close?.style}
          >
            {closeLabel}
          </DrawerClose>
        </div>
        <div
          ref={dock}
          className="min-h-0 flex-1"
        />
      </DrawerContent>
      {container && createPortal(navigation, container)}
    </>
  )
}
/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */
export type SidebarRenderProps = ButtonRenderProps
export type SidebarTriggerProps = WithoutToggle<
  DistributiveOmit<
    ButtonProps,
    'aria-expanded' | 'aria-controls' | 'aria-haspopup' | 'popoverTarget' | 'popoverTargetAction'
  >
>
export function SidebarTrigger({
  onClick,
  variant = 'ghost',
  tone = 'neutral',
  ...props
}: SidebarTriggerProps) {
  const shell = useBinding()
  return (
    <Button
      {...props}
      variant={variant}
      tone={tone}
      pressed={undefined}
      defaultPressed={undefined}
      onPressedChange={undefined}
      aria-pressed={undefined}
      popoverTarget={undefined}
      popoverTargetAction={undefined}
      aria-expanded={shell.mobile ? shell.open : !shell.collapsed}
      aria-controls={shell.mobile ? shell.drawerId : shell.sidebarId}
      aria-haspopup={shell.mobile ? 'dialog' : undefined}
      data-slot={joinIds('sidebar-trigger', props['data-slot'])}
      onClick={composeAction(onClick, () =>
        shell.mobile ? shell.setOpen(!shell.open) : shell.setCollapsed(!shell.collapsed)
      )}
    />
  )
}
export type SidebarLabelProps = Omit<ComponentProps<'span'>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
export function SidebarLabel({ className, ...props }: SidebarLabelProps) {
  const shell = useBinding()
  return (
    <span
      {...props}
      data-slot={joinIds('sidebar-item-label', props['data-slot'])}
      className={cn(shell.collapsed && !shell.mobile ? 'sr-only' : undefined, className)}
    />
  )
}
export type SidebarContentProps = Omit<ComponentProps<'div'>, 'style' | 'hidden' | 'inert'> & {
  style?: ThemeStyle
  'data-slot'?: string
  expandedOnly?: boolean
}
export function SidebarContent({ expandedOnly = false, className, ...props }: SidebarContentProps) {
  const shell = useBinding(),
    hidden = expandedOnly && shell.collapsed && !shell.mobile
  return (
    <div
      {...props}
      hidden={hidden}
      inert={hidden}
      data-slot={joinIds('sidebar-content', props['data-slot'])}
      data-expanded-only={expandedOnly || undefined}
      className={cn('min-w-0 [hidden]:hidden', className)}
    />
  )
}
