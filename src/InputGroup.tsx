'use client'

import { createContext, useContext, type ComponentProps } from 'react'
import { InputRoot, type InputProps } from './Input.js'
import { TextareaRoot, type TextareaProps } from './Textarea.js'
import { cn } from './cn.js'
import { controlBorderClass, controlMetrics } from './controlStyles.js'
import { joinIds } from './internal/ids.js'
import type { ControlSize } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

const SizeContext = createContext<ControlSize | null>(null)
function useInputGroup() {
  const size = useContext(SizeContext)
  if (!size) throw new Error('InputGroup parts require InputGroup.')
  return size
}

export type InputGroupProps = Omit<ComponentProps<'div'>, 'style'> & {
  controlSize?: ControlSize
  style?: ThemeStyle
  'data-slot'?: string
}

/** One shared boundary around a real native control and its adjacent content. */
export function InputGroup({
  controlSize = 'medium',
  className,
  onPointerDown,
  ...props
}: InputGroupProps) {
  return (
    <SizeContext.Provider value={controlSize}>
      <div
        {...props}
        data-slot={joinIds('input-group', props['data-slot'])}
        data-control-size={controlSize}
        onPointerDown={event => {
          onPointerDown?.(event)
          if (event.defaultPrevented || event.button !== 0 || !event.isPrimary) return
          const view = event.currentTarget.ownerDocument.defaultView
          if (!view || !(event.target instanceof view.Element)) return
          const addon = event.target.closest('[data-slot~="input-group-addon"]')
          if (!addon || addon.closest('[data-slot~="input-group"]') !== event.currentTarget) return
          const interactive = event.target.closest(
            'button,a[href],input,textarea,select,summary,label,iframe,audio[controls],video[controls],[tabindex],[contenteditable]:not([contenteditable="false"])'
          )
          if (interactive && addon.contains(interactive)) return
          const control = event.currentTarget.querySelector<HTMLInputElement | HTMLTextAreaElement>(
            ':scope > [data-slot~="input-group-input"],:scope > [data-slot~="input-group-textarea"]'
          )
          if (!control || control.matches(':disabled')) return
          // A pointer convenience only: the native control remains the keyboard target.
          event.preventDefault()
          control.focus()
        }}
        className={cn(
          controlBorderClass,
          controlMetrics({ controlSize }),
          'box-border flex w-full min-w-0 items-center gap-[var(--rad-input-group-gap,0.5rem)] px-[var(--rad-input-group-padding-inline,0.75rem)]',
          'rounded-[var(--rad-input-group-radius,var(--rad-control-radius,0.5rem))] [border-width:var(--rad-input-group-border-width,var(--rad-control-border-width,1px))] border-solid [border-color:var(--rad-input-group-border-color,var(--_rad-control-border))]',
          'bg-[var(--rad-input-group-background,var(--rad-color-surface,oklch(1_0_0)))] [color:var(--rad-input-group-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
          'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--_rad-control-font-size)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
          'focus-within:outline-solid focus-within:[outline-width:var(--rad-input-group-focus-width,var(--rad-focus-width,2px))] focus-within:[outline-offset:var(--rad-input-group-focus-offset,var(--rad-focus-offset,2px))] focus-within:[outline-color:var(--rad-input-group-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
          'has-[>[data-invalid]]:[border-color:var(--rad-input-group-invalid-border,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
          'has-[>input:disabled]:cursor-not-allowed has-[>textarea:disabled]:cursor-not-allowed has-[>input:disabled]:bg-[var(--rad-color-disabled-background,oklch(0.96_0.005_286))] has-[>textarea:disabled]:bg-[var(--rad-color-disabled-background,oklch(0.96_0.005_286))]',
          'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:focus-within:outline-[Highlight]',
          className
        )}
      />
    </SizeContext.Provider>
  )
}

export type InputGroupInputProps = InputProps
export function InputGroupInput(props: InputGroupInputProps) {
  return (
    <InputGroupInputRoot
      {...props}
      family={undefined}
    />
  )
}
/** Private composition seam retaining the real grouped Input host and identities. */
export function InputGroupInputRoot({
  family,
  className,
  controlSize,
  ...props
}: InputGroupInputProps & { family?: 'password-input' | 'number-field' }) {
  const size = useInputGroup()
  return (
    <InputRoot
      {...props}
      family={family ?? 'input-group-input'}
      controlSize={controlSize ?? size}
      className={cn(
        'flex-1 rounded-none px-0 [border-width:0] [box-shadow:none] bg-transparent disabled:[background:transparent] focus-visible:[outline-width:0]',
        'h-[calc(var(--rad-input-height,var(--_rad-control-height))_-_2*var(--rad-input-group-border-width,var(--rad-control-border-width,1px)))]',
        className
      )}
    />
  )
}

export type InputGroupTextareaProps = TextareaProps
export function InputGroupTextarea({ className, controlSize, ...props }: InputGroupTextareaProps) {
  const size = useInputGroup()
  return (
    <TextareaRoot
      {...props}
      family="input-group-textarea"
      controlSize={controlSize ?? size}
      className={cn(
        'flex-1 rounded-none px-0 [border-width:0] [box-shadow:none] bg-transparent disabled:[background:transparent] focus-visible:[outline-width:0]',
        className
      )}
    />
  )
}

export type InputGroupAddonProps = Omit<ComponentProps<'div'>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
export function InputGroupAddon({ className, ...props }: InputGroupAddonProps) {
  useInputGroup()
  return (
    <div
      {...props}
      data-slot={joinIds('input-group-addon', props['data-slot'])}
      className={cn('flex shrink-0 items-center gap-2', className)}
    />
  )
}
