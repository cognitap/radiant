'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { DistributiveOmit } from '../../internal/types.js'
import type { PartStyle } from '../../presentation.js'
import { useControllableState } from '../../react/useControllableState.js'
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
  type CollapsibleProps
} from '../Collapsible/Collapsible.js'

export type SpoilerProps = DistributiveOmit<CollapsibleProps, 'name' | 'onToggle'> & {
  /** Maximum height of the collapsed preview in CSS pixels. */
  maxHeight?: number
  showMoreLabel?: string
  showLessLabel?: string
  parts?: { trigger?: PartStyle; content?: PartStyle }
}

export function Spoiler({
  maxHeight = 96,
  open,
  defaultOpen,
  onOpenChange,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  motion,
  className,
  parts,
  children,
  ...props
}: SpoilerProps) {
  if (!Number.isFinite(maxHeight) || maxHeight < 0) {
    throw new RangeError('Spoiler maxHeight must be a nonnegative number of pixels.')
  }
  const state = useControllableState({
    name: 'Spoiler',
    value: open,
    defaultValue: defaultOpen,
    initialValue: false,
    onChange: onOpenChange
  })
  const contentRef = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState<boolean | null>(null)
  useLayoutEffect(() => {
    const node = contentRef.current!
    const win = node.ownerDocument.defaultView!
    const measure = () => node.scrollHeight > maxHeight
    // oxlint-disable-next-line react/set-state-in-effect -- Read external layout before showing a preview.
    setOverflows(measure())
    const observer = new win.ResizeObserver(() => setOverflows(measure()))
    observer.observe(node)
    return () => observer.disconnect()
  }, [maxHeight])
  const clipped = overflows === true && !state.value

  return (
    <CollapsibleRoot
      {...props}
      data-slot={joinIds('spoiler', props['data-slot'])}
      className={cn('gap-0 [&::details-content]:row-start-1', className)}
      open={!clipped}
      onOpenChange={state.request}
      motion={overflows === null ? 'off' : motion}
      previewHeight={maxHeight}
    >
      <CollapsibleTrigger
        data-slot="spoiler-trigger"
        hidden={!overflows}
        className={cn('row-start-2 py-2 [&[hidden]]:hidden', parts?.trigger?.className)}
        style={parts?.trigger?.style}
      >
        {clipped ? showMoreLabel : showLessLabel}
      </CollapsibleTrigger>
      <CollapsibleContent
        ref={contentRef}
        data-slot="spoiler-content"
        className={cn(
          'flow-root pt-[var(--rad-collapsible-content-padding,var(--rad-collapsible-padding,var(--rad-surface-padding,1.5rem)))]',
          parts?.content?.className
        )}
        style={parts?.content?.style}
      >
        <div
          inert={clipped}
          aria-hidden={clipped || undefined}
        >
          {children}
        </div>
      </CollapsibleContent>
    </CollapsibleRoot>
  )
}
