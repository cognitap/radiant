'use client'

import { useId } from 'react'
import { cn } from 'cn'
import { composeAction } from '../../internal/events.js'
import { joinIds } from '../../internal/ids.js'
import type { DistributiveOmit, WithoutToggle } from '../../internal/types.js'
import type { PartStyle } from '../../presentation.js'
import { useClipboardCopy } from '../../react/useClipboardCopy.js'
import { Button, type ButtonProps, type ButtonRenderProps } from '../Button/Button.js'
import { StandardIcon } from '../IconProvider/IconProvider.js'

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
  resetDelay = 2000,
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
  const defaultIcon = typeof label === 'string' || typeof label === 'number'
  const contentClass =
    'col-start-1 row-start-1 inline-flex min-w-0 items-center justify-center gap-[0.5em]'

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
        <span className="inline-grid min-w-0">
          <span
            className={cn(contentClass, copied && 'invisible')}
            aria-hidden={copied}
          >
            {defaultIcon && <CopyGlyph name="copy" />}
            {defaultIcon ? (
              <span className={iconOnly ? 'sr-only' : 'min-w-0'}>{label}</span>
            ) : (
              label
            )}
          </span>
          <span
            className={cn(contentClass, !copied && 'invisible')}
            aria-hidden={!copied}
          >
            <CopyGlyph name="check" />
            <span className={iconOnly ? 'sr-only' : 'min-w-0'}>{copiedText || label}</span>
          </span>
        </span>
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

function CopyGlyph({ name }: { name: 'copy' | 'check' }) {
  return (
    <StandardIcon
      name={name}
      fallback={
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {name === 'copy' ? (
            <>
              <rect
                x="8"
                y="8"
                width="12"
                height="12"
                rx="2"
              />
              <path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
            </>
          ) : (
            <path d="m5 12 4 4 10-10" />
          )}
        </svg>
      }
    />
  )
}
