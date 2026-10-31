'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode
} from 'react'
import {
  Alert,
  AlertTitle,
  AlertDescription,
  type AlertProps,
  type AlertAnnouncement,
  type AlertTitleProps,
  type AlertDescriptionProps
} from './Alert.js'
import { Button, type ButtonProps, type ButtonRenderProps } from './Button.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { WithoutToggle } from './internal/types.js'
import { composeAction } from './internal/events.js'
import { validateToastDuration } from './internal/toast.js'
import { useControllableState } from './react/useControllableState.js'
import type { StateOwner } from './react/useNativeOwner.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useToastTimer } from './react/useToastTimer.js'
import { useTransitionHost } from './motion/host.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type ToastProviderProps = { duration?: number; children?: ReactNode }
export type ToastAnnouncement = AlertAnnouncement
export type ToastProps = Omit<
  AlertProps,
  'hidden' | 'inert' | 'aria-hidden' | 'tabIndex' | 'announce' | 'onSelect'
> &
  StateOwner<'open', boolean> & {
    onOpenChange?: (open: boolean) => void
    duration?: number
    announce?: ToastAnnouncement
    announcement?: string
    motion?: 'inherit' | 'off'
  }
export type ToastState = { open: boolean; visible: boolean; setOpen: (open: boolean) => void }
export type ToastTitleProps = AlertTitleProps
export type ToastDescriptionProps = AlertDescriptionProps
type ToastButtonProps = WithoutToggle<ButtonProps>
export type ToastActionProps = ToastButtonProps & { altText: string }
export type ToastCloseProps = ToastButtonProps
const notToggle = {
  pressed: undefined,
  defaultPressed: undefined,
  onPressedChange: undefined,
  'aria-pressed': undefined
} as const
export type ToastRenderProps = ButtonRenderProps
export type ToastViewportProps = Omit<
  ComponentProps<'section'>,
  'style' | 'role' | 'tabIndex' | 'aria-keyshortcuts'
> & { style?: ThemeStyle; 'data-slot'?: string; hotkey?: boolean }
type Queue = {
  duration: number
  queue: string[]
  register(id: string): () => void
  publish(id: string, text: string, urgency: ToastAnnouncement, view: Window): void
  clear(id: string): void
}
const QueueContext = createContext<Queue | null>(null)
const ToastContext = createContext<ToastState | null>(null)
function useQueue() {
  const value = useContext(QueueContext)
  if (!value) throw new Error('Toast and ToastViewport must render inside ToastProvider.')
  return value
}
export function useToast(): ToastState | null {
  return useContext(ToastContext)
}
function useToastContext() {
  const value = useToast()
  if (!value) throw new Error('Toast parts must render inside Toast.')
  return value
}

/** One visible toast at a time. Declarative open roots wait in registration order. */
export function ToastProvider({ duration = 0, children }: ToastProviderProps) {
  validateToastDuration(duration)
  const [queue, setQueue] = useState<string[]>([])
  const [live, setLive] = useState({ polite: '', assertive: '' })
  const current = useRef<{
    id: string
    text: string
    urgency: ToastAnnouncement
    view: Window
    frame: number | null
  } | null>(null)
  const register = useCallback((id: string) => {
    setQueue(values => (values.includes(id) ? values : [...values, id]))
    return () => setQueue(values => values.filter(value => value !== id))
  }, [])
  const clear = useCallback((id: string) => {
    if (current.current?.id !== id) return
    if (current.current.frame !== null)
      current.current.view.cancelAnimationFrame(current.current.frame)
    current.current = null
    setLive({ polite: '', assertive: '' })
  }, [])
  const publish = useCallback(
    (id: string, text: string, urgency: ToastAnnouncement, view: Window) => {
      const previous = current.current
      if (previous?.id === id && previous.text === text && previous.urgency === urgency) return
      if (previous?.frame != null) previous.view.cancelAnimationFrame(previous.frame)
      setLive({ polite: '', assertive: '' })
      const entry = { id, text, urgency, view, frame: null as number | null }
      current.current = entry
      if (urgency === 'off' || !text) return
      // The live hosts already exist; clearing first also permits a distinct repeated message.
      entry.frame = view.requestAnimationFrame(() => {
        entry.frame = null
        if (current.current !== entry) return
        setLive({
          polite: urgency === 'polite' ? text : '',
          assertive: urgency === 'assertive' ? text : ''
        })
      })
    },
    []
  )
  useEffect(
    () => () => {
      const entry = current.current
      if (entry?.frame != null) entry.view.cancelAnimationFrame(entry.frame)
    },
    []
  )
  return (
    <QueueContext.Provider value={{ duration, queue, register, publish, clear }}>
      {children}
      <output
        className="sr-only"
        data-slot="toast-announcer"
      >
        {live.polite}
      </output>
      <div
        className="sr-only"
        data-slot="toast-announcer"
        role="alert"
      >
        {live.assertive}
      </div>
    </QueueContext.Provider>
  )
}
export function Toast({
  open,
  defaultOpen,
  onOpenChange,
  duration,
  announce = 'polite',
  announcement,
  motion = 'inherit',
  ref,
  className,
  onKeyDown,
  onFocusCapture,
  onBlurCapture,
  ...props
}: ToastProps) {
  const owner = useQueue()
  const { register, publish: announceText, clear: clearText } = owner
  const state = useControllableState({
    name: 'Toast',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })
  const id = useId()
  const visible = state.value && owner.queue[0] === id
  const timeout = duration ?? owner.duration
  validateToastDuration(timeout)
  if (!['off', 'polite', 'assertive'].includes(announce))
    throw new TypeError('Toast announce must be off, polite or assertive.')
  const nodeRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('Notification')
  const focused = useRef(false)
  const returnTo = useRef<HTMLElement | null>(null)
  const update = useRef(() => {})
  const latest = useRef({ announce, announcement })
  useLayoutEffect(() => {
    latest.current = { announce, announcement }
    update.current()
  }, [announce, announcement])
  useLayoutEffect(() => (state.value ? register(id) : undefined), [state.value, register, id])
  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!visible || !node) return
    const doc = node.ownerDocument
    const win = doc.defaultView!
    returnTo.current = doc.activeElement instanceof win.HTMLElement ? doc.activeElement : null
    const publish = () => {
      const parts = Array.from(
        node.querySelectorAll<HTMLElement>(
          '[data-slot~="toast-title"], [data-slot~="toast-description"], [data-slot~="toast-action"]'
        )
      )
      const title = parts.find(part => part.dataset.slot?.split(' ').includes('toast-title'))
      setLabel(title?.innerText || 'Notification')
      const text =
        latest.current.announcement ??
        parts
          .map(part => part.dataset.toastAnnouncement ?? part.innerText)
          .filter(Boolean)
          .join(' ')
      announceText(id, text, latest.current.announce, win)
    }
    update.current = publish
    publish()
    const observer = new win.MutationObserver(publish)
    observer.observe(node, { childList: true, subtree: true, characterData: true })
    return () => {
      observer.disconnect()
      update.current = () => {}
      clearText(id)
      const opener = returnTo.current
      const inside =
        node.contains(doc.activeElement) || (focused.current && doc.activeElement === doc.body)
      const modal = Array.from(doc.querySelectorAll('dialog:modal')).at(-1)
      if (
        inside &&
        opener?.isConnected &&
        opener.checkVisibility() &&
        !opener.closest('[inert]') &&
        (!modal || modal.contains(opener))
      )
        opener.focus({ preventScroll: true })
      focused.current = false
    }
  }, [visible, id, announceText, clearText])
  useToastTimer(nodeRef, visible, timeout, () => state.request(false))
  const host = useComposedRefs(nodeRef, ref)
  const { ref: transitionRef, active, off } = useTransitionHost('popup', host, motion === 'off')
  return (
    <ToastContext.Provider value={{ open: state.value, visible, setOpen: state.request }}>
      <Alert
        {...props}
        ref={transitionRef}
        announce="off"
        aria-label={props['aria-label'] ?? (props['aria-labelledby'] ? undefined : label)}
        hidden={!visible}
        inert={!visible}
        aria-hidden={!visible || undefined}
        tabIndex={-1}
        data-slot={joinIds('toast', props['data-slot'])}
        data-state={visible ? 'open' : 'closed'}
        data-queued={(state.value && !visible) || undefined}
        data-motion={motion}
        data-urgency={announce}
        className={cn(
          '[&[hidden]]:hidden pointer-events-auto max-h-[calc(100dvh-2rem)] overflow-auto overscroll-contain outline-none p-[var(--rad-toast-padding,var(--rad-surface-padding,1.5rem))] gap-[var(--rad-toast-gap,var(--rad-spacing-header-gap,0.375rem))] rounded-[var(--rad-toast-radius,var(--rad-surface-radius,0.75rem))]',
          'bg-[var(--rad-toast-background,var(--_action-soft))] [color:var(--rad-toast-color,var(--_action-ink))] [border-color:var(--rad-toast-border-color,var(--_action-edge))] [border-width:var(--rad-toast-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-toast-border-style,var(--rad-surface-border-style,solid))] [box-shadow:var(--rad-toast-shadow,var(--rad-surface-overlay-shadow,0_8px_32px_#0003))]',
          'focus-visible:outline-solid focus-visible:outline-[var(--rad-color-focus)] focus-visible:outline-[length:var(--rad-focus-width,2px)] focus-visible:outline-offset-[var(--rad-focus-offset,2px)]',
          'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:shadow-none',
          active && !off && 'opacity-[var(--_rad-popup-enter,0)] motion-reduce:opacity-100',
          className
        )}
        onKeyDown={composeAction(onKeyDown, event => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          event.stopPropagation()
          state.request(false)
        })}
        onFocusCapture={event => {
          const previous = event.relatedTarget
          if (
            previous instanceof event.currentTarget.ownerDocument.defaultView!.HTMLElement &&
            !event.currentTarget.contains(previous)
          )
            returnTo.current = previous
          focused.current = true
          onFocusCapture?.(event)
        }}
        onBlurCapture={event => {
          if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
            focused.current = false
          onBlurCapture?.(event)
        }}
      />
    </ToastContext.Provider>
  )
}
export function ToastTitle({ className, ...props }: ToastTitleProps) {
  useToastContext()
  return (
    <AlertTitle
      {...props}
      data-slot={joinIds('toast-title', props['data-slot'])}
      className={cn(
        'text-[length:var(--rad-toast-title-size,var(--rad-typography-roles-ui-title-size,1.125rem))] font-[number:var(--rad-toast-title-weight,var(--rad-typography-roles-ui-title-weight,600))]',
        className
      )}
    />
  )
}
export function ToastDescription({ className, ...props }: ToastDescriptionProps) {
  useToastContext()
  return (
    <AlertDescription
      {...props}
      data-slot={joinIds('toast-description', props['data-slot'])}
      className={cn(
        'text-[length:var(--rad-toast-description-size,var(--rad-typography-roles-ui-body-size,0.875rem))]',
        className
      )}
    />
  )
}
export function ToastAction({ altText, onClick, ...props }: ToastActionProps) {
  const toast = useToastContext()
  if (!altText.trim())
    throw new TypeError('ToastAction needs meaningful altText for its announcement.')
  return (
    <Button
      {...props}
      {...notToggle}
      data-slot={joinIds('toast-action', props['data-slot'])}
      data-toast-announcement={altText}
      onClick={composeAction(onClick, () => toast.setOpen(false))}
    />
  )
}
export function ToastClose({ onClick, ...props }: ToastCloseProps) {
  const toast = useToastContext()
  return (
    <Button
      {...props}
      {...notToggle}
      data-slot={joinIds('toast-close', props['data-slot'])}
      onClick={composeAction(onClick, () => toast.setOpen(false))}
    />
  )
}
export function ToastViewport({ hotkey = true, ref, className, ...props }: ToastViewportProps) {
  useQueue()
  const nativeProps = { ...props, role: undefined }
  const nodeRef = useRef<HTMLElement>(null)
  const host = useComposedRefs(nodeRef, ref)
  useEffect(() => {
    const node = nodeRef.current
    if (!node || !hotkey) return
    const doc = node.ownerDocument
    const focus = (event: KeyboardEvent) => {
      if (
        event.key !== 'F8' ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.defaultPrevented ||
        event.isComposing
      )
        return
      const modal = Array.from(doc.querySelectorAll('dialog:modal')).at(-1)
      if (modal && !modal.contains(node)) return
      const toast = node.querySelector<HTMLElement>('[data-slot~="toast"][data-state="open"]')
      if (!toast || !toast.checkVisibility()) return
      event.preventDefault()
      toast.focus({ preventScroll: true })
    }
    doc.addEventListener('keydown', focus)
    return () => doc.removeEventListener('keydown', focus)
  }, [hotkey])
  return (
    <section
      {...nativeProps}
      ref={host}
      aria-label={props['aria-labelledby'] ? undefined : (props['aria-label'] ?? 'Notifications')}
      aria-keyshortcuts={hotkey ? 'F8' : undefined}
      tabIndex={-1}
      data-slot={joinIds('toast-viewport', props['data-slot'])}
      className={cn(
        'pointer-events-none fixed right-[var(--rad-toast-inset,1rem)] bottom-[var(--rad-toast-inset,1rem)] z-[var(--rad-toast-z-index,50)] grid min-w-0 w-[var(--rad-toast-width,24rem)] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-visible',
        className
      )}
    />
  )
}
