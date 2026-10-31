'use client'

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps
} from 'react'
import { Button, type ButtonProps, type ButtonRenderProps } from './Button.js'
import { ScrollArea, type ScrollAreaProps } from './ScrollArea.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { composeAction } from './internal/events.js'
import type { DistributiveOmit, WithoutToggle } from './internal/types.js'
import type { PartStyle } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

type Phase = 'idle' | 'pending' | 'success' | 'error'
type Feedback = { source: string; phase: Phase }
type Native<Host extends 'div' | 'pre'> = Omit<ComponentProps<Host>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
export type CodeBlockProps = Native<'div'> & {
  code: string
  language?: string
  lineNumbers?: boolean
  loadingText?: string
  copiedText?: string
  errorText?: string
  parts?: { status?: PartStyle }
}
export type CodeBlockHeaderProps = Native<'div'>
export type CodeBlockViewportProps = ScrollAreaProps
export type CodeBlockContentProps = Native<'pre'>
export type CodeBlockRenderProps = ButtonRenderProps
export type CodeBlockCopyProps = WithoutToggle<DistributiveOmit<ButtonProps, 'type'>> & {
  type?: never
}
type Context = {
  code: string
  language?: string
  lineNumbers: boolean
  pending: boolean
  statusId: string
  copy: (win: Window | null) => Promise<void>
}
const CodeContext = createContext<Context | null>(null)
function useCode() {
  const context = useContext(CodeContext)
  if (!context) throw new Error('CodeBlock parts must render inside CodeBlock.')
  return context
}
/** Raw source owns copying; consumers can supply highlighted React content without an engine dependency. */
export function CodeBlock({
  code,
  language,
  lineNumbers = false,
  loadingText = 'Copying code…',
  copiedText = 'Code copied.',
  errorText = 'Could not copy code. Select the code and copy it manually.',
  children,
  parts,
  className,
  ...props
}: CodeBlockProps) {
  if (typeof code !== 'string') throw new TypeError('CodeBlock code must be a string.')
  const [feedback, setFeedback] = useState<Feedback>({ source: code, phase: 'idle' })
  const [pending, setPending] = useState(false)
  const busy = useRef(false),
    mounted = useRef(true),
    operation = useRef(0)
  const statusId = useId()
  // Forget feedback for replaced source without cancelling an already requested browser write.
  if (feedback.source !== code) setFeedback({ source: code, phase: 'idle' })
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      operation.current += 1
    }
  }, [])
  const copy = async (win: Window | null) => {
    if (busy.current) return
    const source = code,
      request = ++operation.current
    busy.current = true
    setPending(true)
    setFeedback({ source, phase: 'pending' })
    let phase: Phase = 'success'
    try {
      if (!win?.navigator.clipboard?.writeText) throw new Error('Clipboard writing is unavailable.')
      await win.navigator.clipboard.writeText(source)
    } catch {
      phase = 'error'
    }
    if (!mounted.current || request !== operation.current) return
    busy.current = false
    setPending(false)
    setFeedback(current => (current.source === source ? { source, phase } : current))
  }
  const phase = feedback.source === code ? feedback.phase : 'idle'
  const message =
    phase === 'pending'
      ? loadingText
      : phase === 'success'
        ? copiedText
        : phase === 'error'
          ? errorText
          : ''
  return (
    <CodeContext.Provider value={{ code, language, lineNumbers, pending, statusId, copy }}>
      <div
        {...props}
        data-slot={joinIds('code-block', props['data-slot'])}
        data-language={language}
        data-line-numbers={lineNumbers || undefined}
        data-copy-state={pending ? 'pending' : phase}
        className={cn(
          'box-border min-w-0 w-full overflow-hidden rounded-[var(--rad-code-block-radius,var(--rad-surface-radius,0.75rem))]',
          'border-[length:var(--rad-code-block-border-width,var(--rad-surface-border-width,1px))] border-solid [border-color:var(--rad-code-block-border-color,var(--rad-color-border))]',
          'bg-[var(--rad-code-block-background,var(--rad-color-surface))] [color:var(--rad-code-block-color,var(--rad-color-foreground))]',
          'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
          className
        )}
      >
        <output
          id={statusId}
          data-slot="code-block-status"
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            'block m-0 break-words text-[length:var(--rad-typography-roles-ui-supporting-size,0.8125rem)] [color:var(--rad-code-block-status-color,var(--rad-color-muted-foreground))] forced-colors:text-[CanvasText]',
            message && 'px-[var(--rad-code-block-padding,1rem)] py-2',
            parts?.status?.className
          )}
          style={parts?.status?.style}
        >
          {message}
        </output>
        {children}
      </div>
    </CodeContext.Provider>
  )
}
export function CodeBlockHeader({ className, ...props }: CodeBlockHeaderProps) {
  useCode()
  return (
    <div
      {...props}
      data-slot={joinIds('code-block-header', props['data-slot'])}
      className={cn(
        'flex min-w-0 flex-wrap items-center justify-between gap-[var(--rad-code-block-header-gap,0.75rem)] p-[var(--rad-code-block-header-padding,0.75rem)]',
        'font-[family-name:var(--rad-typography-roles-ui-label-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-label-size,0.875rem)]',
        'border-b-[length:var(--rad-code-block-border-width,var(--rad-surface-border-width,1px))] border-solid [border-color:var(--rad-code-block-border-color,var(--rad-color-border))] forced-colors:border-[CanvasText]',
        className
      )}
    />
  )
}
export function CodeBlockViewport({
  children,
  className,
  dir = 'ltr',
  orientation = 'both',
  ...props
}: CodeBlockViewportProps) {
  useCode()
  return (
    <ScrollArea
      {...props}
      dir={dir}
      orientation={orientation}
      data-slot={joinIds('code-block-viewport', props['data-slot'])}
      className={cn(
        'max-h-[var(--rad-code-block-max-height,24rem)] focus-visible:[outline-offset:-3px]',
        className
      )}
    >
      {children === undefined ? <CodeBlockContent /> : children}
    </ScrollArea>
  )
}
export function CodeBlockContent({ children, className, ...props }: CodeBlockContentProps) {
  const { code, language, lineNumbers } = useCode()
  const count = code.split(/\r\n|\r|\n/).length
  return (
    <pre
      {...props}
      data-slot={joinIds('code-block-content', props['data-slot'])}
      className={cn(
        'm-0 box-border flex w-max min-w-full whitespace-pre p-[var(--rad-code-block-padding,1rem)]',
        'font-[number:var(--rad-typography-roles-code-weight,400)] tracking-[var(--rad-typography-roles-code-letter-spacing,0)] font-[family-name:var(--rad-typography-roles-code-family,ui-monospace,monospace)] text-[length:var(--rad-code-block-font-size,var(--rad-typography-roles-code-size,0.875rem))] leading-[var(--rad-code-block-line-height,var(--rad-typography-roles-code-line-height,1.65))]',
        className
      )}
    >
      {lineNumbers ? (
        <span
          aria-hidden="true"
          data-slot="code-block-line-numbers"
          className="shrink-0 select-none whitespace-pre text-end pe-[var(--rad-code-block-number-gap,1rem)] [color:var(--rad-code-block-number-color,var(--rad-color-muted-foreground))] forced-colors:text-[CanvasText]"
        >
          {Array.from({ length: count }, (_, index) => index + 1).join('\n')}
        </span>
      ) : null}
      <code
        data-slot="code-block-code"
        data-language={language}
        className="block min-w-0 whitespace-pre [font-family:inherit] [font-size:inherit] [line-height:inherit]"
      >
        {children === undefined ? code : children}
      </code>
    </pre>
  )
}
export function CodeBlockCopy({
  onClick,
  children = 'Copy code',
  pending = false,
  ...props
}: CodeBlockCopyProps) {
  const context = useCode()
  return (
    <Button
      {...props}
      pressed={undefined}
      defaultPressed={undefined}
      onPressedChange={undefined}
      aria-pressed={undefined}
      type="button"
      pending={pending || context.pending}
      data-slot={joinIds('code-block-copy', props['data-slot'])}
      aria-describedby={joinIds(props['aria-describedby'], context.statusId)}
      onClick={composeAction(onClick, event => {
        void context.copy(event.currentTarget.ownerDocument.defaultView)
      })}
    >
      {children}
    </Button>
  )
}
