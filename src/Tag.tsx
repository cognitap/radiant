'use client'

import type { MouseEvent, ReactNode } from 'react'
import { Badge, type BadgeProps } from './Badge.js'
import { Button } from './Button.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { requireAccessibleName } from './internal/accessibleName.js'
import type { PartStyle } from './presentation.js'

export type TagProps = Omit<BadgeProps, 'decorative' | 'children'> & {
  children: ReactNode
  /** Name the actual removal Button, including when the content is rich. */
  removeLabel: string
  onRemove(event: MouseEvent<HTMLButtonElement>): void
  disabled?: boolean
  pending?: boolean
  parts?: { remove?: PartStyle }
}
/** Removable content uses the real Badge span and a real, named Button. */
export function Tag({
  removeLabel,
  onRemove,
  disabled = false,
  pending = false,
  parts,
  className,
  children,
  ...props
}: TagProps) {
  requireAccessibleName('Tag removal', { 'aria-label': removeLabel })
  return (
    <Badge
      {...props}
      decorative={false}
      data-slot={joinIds('tag', props['data-slot'])}
      className={cn('gap-[var(--rad-tag-gap,0.25rem)]', className)}
    >
      <span className="min-w-0 break-words">{children}</span>
      <Button
        type="button"
        variant="ghost"
        tone={props.tone ?? 'neutral'}
        controlSize="small"
        motion="off"
        iconOnly
        aria-label={removeLabel}
        disabled={disabled}
        pending={pending}
        data-slot="tag-remove"
        className={cn('size-6 min-h-0 shrink-0 p-0', parts?.remove?.className)}
        style={parts?.remove?.style}
        onClick={onRemove}
      >
        <span aria-hidden="true">×</span>
      </Button>
    </Badge>
  )
}
