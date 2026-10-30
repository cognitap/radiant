'use client'
import { useRef, type ComponentProps } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { requireAccessibleName, type AccessibleName } from './internal/accessibleName.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { CompositeFocusContext, useRovingFocus } from './react/useRovingFocus.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type ToolbarOrientation = 'horizontal' | 'vertical'
export type ToolbarProps = Omit<
  ComponentProps<'div'>,
  'role' | 'aria-orientation' | 'tabIndex' | 'style' | 'contentEditable' | 'dangerouslySetInnerHTML'
> &
  AccessibleName & {
    orientation?: ToolbarOrientation
    loop?: boolean
    style?: ThemeStyle
    'data-slot'?: string
  }
const toolbarClass =
  'inline-flex w-fit max-w-full flex-wrap gap-[var(--rad-toolbar-gap,0.25rem)] p-[var(--rad-toolbar-padding,0px)] rounded-[var(--rad-toolbar-radius,var(--rad-control-radius,0.5rem))] bg-[var(--rad-toolbar-background,transparent)]'
/** One native composite; child actions retain their own activation and state. */
export function Toolbar({
  ref,
  orientation = 'horizontal',
  loop = true,
  className,
  onFocus,
  onBlur,
  onKeyDown,
  children,
  ...props
}: ToolbarProps) {
  requireAccessibleName('Toolbar', props)
  const host = useRef<HTMLDivElement>(null),
    hostRef = useComposedRefs(host, ref)
  const roving = useRovingFocus({
    host,
    selector: 'button, a[href]',
    scope: '[data-slot~="toolbar"]',
    orientation,
    loop
  })
  return (
    <CompositeFocusContext.Provider value='[data-slot~="toolbar"]'>
      <div
        {...props}
        ref={hostRef}
        role="toolbar"
        aria-orientation={orientation}
        tabIndex={-1}
        contentEditable={undefined}
        dangerouslySetInnerHTML={undefined}
        data-slot={joinIds('toolbar', props['data-slot'])}
        data-orientation={orientation}
        className={cn(
          toolbarClass,
          orientation === 'vertical' ? 'flex-col items-stretch' : 'items-center',
          className
        )}
        onFocus={event => {
          onFocus?.(event)
          roving.onFocus(event)
        }}
        onBlur={event => {
          onBlur?.(event)
          roving.onBlur(event)
        }}
        onKeyDown={event => {
          onKeyDown?.(event)
          roving.onKeyDown(event)
        }}
      >
        {children}
      </div>
    </CompositeFocusContext.Provider>
  )
}
