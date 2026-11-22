import type { ComponentProps, ReactNode } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { PartStyle, Tone } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { actionTone } from '../shared/actionStyles.js'

type TimelinePart<Host extends 'ol' | 'li'> = Omit<ComponentProps<Host>, 'role' | 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}

export type TimelineProps = TimelinePart<'ol'>

export type TimelineItemProps = Omit<TimelinePart<'li'>, 'aria-current' | 'title'> & {
  label: ReactNode
  /** Machine-readable value forwarded to the native time element. */
  dateTime: string
  /** Formatted timestamp shown alongside the label. */
  time: ReactNode
  /** Decorative. Include its meaning in the event label or content. */
  icon?: ReactNode
  tone?: Tone
  active?: boolean
  parts?: {
    indicator?: PartStyle
    connector?: PartStyle
    label?: PartStyle
    time?: PartStyle
    body?: PartStyle
  }
}

export function Timeline({ className, ...props }: TimelineProps) {
  return (
    <ol
      {...props}
      // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops list semantics when markers are hidden.
      role="list"
      data-slot={joinIds('timeline', props['data-slot'])}
      className={cn(
        'grid min-w-0 list-none p-0 text-start [color:var(--rad-color-foreground)] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] [--_rad-timeline-marker:var(--rad-timeline-marker-size,2rem)]',
        className
      )}
    />
  )
}

export function TimelineItem({
  label,
  dateTime,
  time,
  icon,
  tone = 'neutral',
  active = false,
  parts,
  className,
  children,
  ...props
}: TimelineItemProps) {
  const nativeProps = { ...props, role: undefined }
  return (
    <li
      {...nativeProps}
      aria-current={active ? true : undefined}
      data-slot={joinIds('timeline-item', props['data-slot'])}
      data-active={active ? '' : undefined}
      data-tone={tone}
      className={cn(
        'group/timeline-item relative grid min-w-0 grid-cols-[var(--_rad-timeline-marker)_minmax(0,1fr)] items-start gap-x-3 pb-5 last:pb-0',
        actionTone({ tone }),
        className
      )}
    >
      <span
        aria-hidden="true"
        data-slot="timeline-connector"
        className={cn(
          'pointer-events-none absolute start-[calc(var(--_rad-timeline-marker)/2)] top-[calc(var(--_rad-timeline-marker)_+_0.25rem)] bottom-1 w-px [background:var(--rad-color-border)] group-last/timeline-item:hidden forced-colors:[background:CanvasText]',
          parts?.connector?.className
        )}
        style={parts?.connector?.style}
      />
      <span
        aria-hidden="true"
        data-slot="timeline-indicator"
        className={cn(
          'relative grid size-[var(--_rad-timeline-marker)] place-items-center rounded-[var(--rad-control-radius,0.5rem)] [corner-shape:var(--rad-control-corner-shape,round)] [border-width:var(--rad-control-border-width,1px)] [border-style:var(--rad-control-border-style,solid)] [border-color:var(--_action-edge)] bg-[var(--_action-soft)] [color:var(--_action-ink)] [&_svg]:size-4 forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
          active &&
            '[border-color:var(--_action-color)] bg-[var(--_action-color)] [color:var(--_action-on-color)] forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
          parts?.indicator?.className
        )}
        style={parts?.indicator?.style}
      >
        {icon ?? (
          <span className={cn('rounded-full bg-current', active ? 'size-2.5' : 'size-1.5')} />
        )}
      </span>
      <div className="grid min-w-0 gap-1 pt-0.5 [overflow-wrap:anywhere]">
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span
            data-slot="timeline-label"
            className={cn(
              'font-semibold',
              active && 'underline decoration-2 underline-offset-3',
              parts?.label?.className
            )}
            style={parts?.label?.style}
          >
            {label}
          </span>
          <time
            dateTime={dateTime}
            data-slot="timeline-time"
            className={cn(
              'text-xs tabular-nums [color:var(--rad-color-muted-foreground)]',
              parts?.time?.className
            )}
            style={parts?.time?.style}
          >
            {time}
          </time>
        </div>
        {children != null && (
          <div
            data-slot="timeline-body"
            className={cn(
              'text-sm [color:var(--rad-color-muted-foreground)]',
              parts?.body?.className
            )}
            style={parts?.body?.style}
          >
            {children}
          </div>
        )}
      </div>
    </li>
  )
}
