'use client'

import { useId } from 'react'
import { cn } from 'cn'
import { composeAction } from '../../internal/events.js'
import { joinIds } from '../../internal/ids.js'
import type { DistributiveOmit, WithoutToggle } from '../../internal/types.js'
import type { PartStyle } from '../../presentation.js'
import { copyConfirmationDelay, useClipboardCopy } from '../../react/useClipboardCopy.js'
import { Button, type ButtonProps, type ButtonRenderProps } from '../Button/Button.js'
import { CopyButtonContent } from './CopyButtonContent.js'

export type CopyButtonRenderProps = ButtonRenderProps
export type CopyButtonProps = WithoutToggle<DistributiveOmit<ButtonProps, 'type' | 'value'>> & {
  /** The exact text to write. */
  value: string
  /** Milliseconds to show a successful write before clearing the confirmation. */
  resetDelay?: number
  copiedText?: string
  errorText?: string
  parts?: { status?: PartStyle }
}

export function CopyButton({
  value,
  resetDelay = copyConfirmationDelay,
  copiedText = 'Copied',
  errorText = 'Could not copy. Try again or copy the text manually.',
  onClick,
  children,
  iconOnly,
  pending: externalPending,
  parts,
  ...props
}: CopyButtonProps) {
  if (typeof value !== 'string') throw new TypeError('CopyButton value must be a string.')
  if (!Number.isFinite(resetDelay) || resetDelay <= 0 || resetDelay > 2_147_483_647) {
    throw new RangeError('CopyButton resetDelay must be a positive delay in milliseconds.')
  }
  const statusId = useId()
  const { pending, phase, copy } = useClipboardCopy(value, resetDelay)
  const copied = phase === 'success'
  const failed = phase === 'error'
  const label = children ?? 'Copy'

  return (
    <>
      <Button
        {...props}
        type="button"
        pressed={undefined}
        defaultPressed={undefined}
        onPressedChange={undefined}
        aria-pressed={undefined}
        iconOnly={iconOnly}
        pending={externalPending || pending}
        data-slot={joinIds('copy-button', props['data-slot'])}
        aria-describedby={joinIds(props['aria-describedby'], failed ? statusId : undefined)}
        onClick={composeAction(onClick, event => {
          void copy(event.currentTarget.ownerDocument.defaultView)
        })}
      >
        <CopyButtonContent
          label={label}
          copied={copied}
          copiedText={copiedText}
          iconOnly={iconOnly}
        />
      </Button>
      <output
        id={statusId}
        data-slot="copy-button-status"
        data-state={phase}
        className={cn(
          failed &&
            'block min-w-0 text-sm [overflow-wrap:anywhere] [color:var(--rad-color-invalid)]',
          parts?.status?.className,
          !failed && 'sr-only'
        )}
        style={parts?.status?.style}
      >
        {copied ? copiedText : failed ? errorText : ''}
      </output>
    </>
  )
}
