import type { ReactNode } from 'react'
import { cn } from 'cn'
import { StandardIcon } from '../IconProvider/IconProvider.js'

export function CopyButtonContent({
  label,
  copied,
  copiedText = 'Copied',
  iconOnly
}: {
  label: ReactNode
  copied: boolean
  copiedText?: string
  iconOnly?: boolean
}) {
  const defaultIcon = typeof label === 'string' || typeof label === 'number'
  const contentClass =
    'col-start-1 row-start-1 inline-flex min-w-0 items-center justify-center gap-[0.5em]'

  return (
    <span className="inline-grid min-w-0">
      <span
        className={cn(contentClass, copied && 'invisible')}
        aria-hidden={copied}
      >
        {defaultIcon && <CopyGlyph name="copy" />}
        {defaultIcon ? <span className={iconOnly ? 'sr-only' : 'min-w-0'}>{label}</span> : label}
      </span>
      <span
        className={cn(contentClass, !copied && 'invisible')}
        aria-hidden={!copied}
      >
        <CopyGlyph name="check" />
        <span className={iconOnly ? 'sr-only' : 'min-w-0'}>{copiedText || label}</span>
      </span>
    </span>
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
