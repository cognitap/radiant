'use client'

import type { ComponentProps } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../Button/Button.js'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import { controlMetrics } from '../shared/controlStyles.js'
import { useFieldControl } from '../Field/Field.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import type { ControlSize, PartStyle } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { peerFocusRingClass } from '../shared/focusStyles.js'

export type FileInputProps = Omit<
  ComponentProps<'input'>,
  'type' | 'value' | 'defaultValue' | 'readOnly' | 'children' | 'style'
> & {
  controlSize?: ControlSize
  /** Applied to the native input. */
  style?: ThemeStyle
  /** Additional composed identities; the file-input token is always retained. */
  'data-slot'?: string
  /** Visible text of the choose action; defaults to "Choose file" or "Choose files". */
  chooseLabel?: string
  /** Shown while no file is chosen; defaults to "No file chosen" or "No files chosen". */
  emptyText?: string
  parts?: { wrapper?: PartStyle; trigger?: PartStyle; files?: PartStyle }
}

const names = (node: HTMLInputElement) => Array.from(node.files ?? [], file => file.name)

/**
 * The native file input stays the one focus, activation and form host. It spans the control so
 * touch exploration finds it; the positioned Button paints above it and keeps its own hover and press.
 */
export function FileInput({
  className,
  style,
  controlSize = 'medium',
  chooseLabel,
  emptyText,
  parts,
  ref,
  onChange,
  'data-slot': slot,
  ...props
}: FileInputProps) {
  const control = useFieldControl(props),
    input = useRef<HTMLInputElement>(null),
    composed = useComposedRefs(input, ref),
    [chosen, setChosen] = useState<string[]>([])
  useEffect(() => {
    const node = input.current
    if (!node) return
    setChosen(names(node))
    let pending: ReturnType<typeof setTimeout> | undefined
    // Reset runs after its event dispatches, and only when no listener cancels it.
    const observe = (event: Event) => {
      if (!node.form || event.target !== node.form) return
      clearTimeout(pending)
      pending = setTimeout(() => setChosen(names(node)))
    }
    const roots = new Set([node.ownerDocument, node.getRootNode()])
    for (const root of roots) root.addEventListener('reset', observe, true)
    return () => {
      clearTimeout(pending)
      for (const root of roots) root.removeEventListener('reset', observe, true)
    }
  }, [])
  return (
    <div
      dir={props.dir}
      data-slot="file-input-wrapper"
      className={cn(
        controlMetrics({ controlSize }),
        'relative flex w-full min-w-0 items-center gap-[var(--rad-file-input-gap,0.75rem)]',
        parts?.wrapper?.className
      )}
      style={parts?.wrapper?.style}
    >
      <input
        {...props}
        {...control}
        ref={composed}
        type="file"
        onChange={event => {
          setChosen(names(event.currentTarget))
          onChange?.(event)
        }}
        data-slot={joinIds('file-input', slot)}
        data-control-size={controlSize}
        className={cn(
          'peer absolute inset-0 m-0 box-border size-full cursor-pointer p-0 opacity-0',
          className
        )}
        style={style}
      />
      <Button
        aria-hidden
        tabIndex={-1}
        variant="outline"
        tone="neutral"
        controlSize={controlSize}
        disabled={control.disabled}
        onMouseDown={event => event.preventDefault()}
        onClick={() => {
          input.current?.focus()
          input.current?.click()
        }}
        data-slot="file-input-trigger"
        className={cn(
          'relative',
          peerFocusRingClass,
          'peer-focus-visible:[--_rad-focus-color:var(--rad-button-focus-color)] peer-focus-visible:[--_rad-focus-width:var(--rad-button-focus-width)] peer-focus-visible:[--_rad-focus-offset:var(--rad-button-focus-offset)] peer-focus-visible:[--_rad-focus-style:var(--rad-button-focus-style)]',
          'peer-data-invalid:[border-color:var(--rad-color-invalid,oklch(0.56_0.19_25))]',
          parts?.trigger?.className
        )}
        style={parts?.trigger?.style}
      >
        {chooseLabel ?? (props.multiple ? 'Choose files' : 'Choose file')}
      </Button>
      <span
        aria-hidden
        data-slot="file-input-files"
        className={cn(
          'min-w-0 [overflow-wrap:anywhere] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--_rad-control-font-size)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
          chosen.length
            ? '[color:var(--rad-color-foreground,oklch(0.21_0.006_286))]'
            : '[color:var(--rad-color-muted-foreground,oklch(0.45_0.01_286))]',
          parts?.files?.className
        )}
        style={parts?.files?.style}
      >
        {chosen.length
          ? chosen.join(', ')
          : (emptyText ?? (props.multiple ? 'No files chosen' : 'No file chosen'))}
      </span>
    </div>
  )
}
