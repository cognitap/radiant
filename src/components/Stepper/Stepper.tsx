'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from 'cn'
import { requireAccessibleName, type AccessibleName } from '../../internal/accessibleName.js'
import { joinIds } from '../../internal/ids.js'
import type { ControlSize, PartStyle } from '../../presentation.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { Button } from '../Button/Button.js'
import { controlBorderClass, controlMetrics } from '../shared/controlStyles.js'
import { focusRingClass } from '../shared/focusStyles.js'
import { scrollbarClass } from '../shared/scrollbarStyles.js'

export type StepperStep = {
  /** Stable, unique identifier. */
  value: string
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
  /** Overrides completion inferred from order in linear mode. */
  completed?: boolean
  /** Visible details when this step needs attention. */
  error?: ReactNode
}

const statusText = {
  current: 'Current',
  completed: 'Completed',
  upcoming: 'Upcoming',
  error: 'Needs attention'
} as const

type StepStatus = keyof typeof statusText

export type StepperProps = Omit<
  ComponentProps<'nav'>,
  'children' | 'role' | 'style' | 'aria-current' | 'dangerouslySetInnerHTML'
> &
  AccessibleName &
  ValueOwner<string | null> & {
    steps: readonly StepperStep[]
    onValueChange?: (value: string) => void
    /** Linear mode permits prior steps and the next enabled step. */
    navigation?: 'linear' | 'free'
    orientation?: 'horizontal' | 'vertical'
    controlSize?: ControlSize
    statusLabels?: Partial<Record<StepStatus, string>>
    style?: ThemeStyle
    parts?: {
      list?: PartStyle
      step?: PartStyle
      indicator?: PartStyle
      label?: PartStyle
      description?: PartStyle
      status?: PartStyle
      error?: PartStyle
      connector?: PartStyle
    }
    'data-slot'?: string
  }

const markerClass =
  'box-border grid size-[var(--_rad-control-height)] shrink-0 place-items-center [border-width:var(--rad-control-border-width,1px)] [border-style:var(--rad-control-border-style,solid)] [border-color:var(--_rad-control-border)] rounded-[var(--rad-control-radius,0.5rem)] [corner-shape:var(--rad-control-corner-shape,round)] bg-[var(--rad-control-field-background,var(--rad-color-surface))] font-semibold tabular-nums forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]'

function hasText(content: ReactNode) {
  return content != null && typeof content !== 'boolean' && content !== ''
}

/** A named, ordered navigation list whose selected step is owned by the flow. */
export function Stepper({
  steps,
  value,
  defaultValue,
  onValueChange,
  navigation = 'linear',
  orientation = 'horizontal',
  controlSize = 'medium',
  statusLabels,
  parts,
  className,
  ...props
}: StepperProps) {
  requireAccessibleName('Stepper', props)
  const stepValues = new Set(steps.map(step => step.value))
  if (
    stepValues.size !== steps.length ||
    steps.some(step => typeof step.value !== 'string' || !step.value.trim())
  ) {
    throw new TypeError('Stepper steps must have unique, nonempty values.')
  }
  const firstEnabled = steps.find(step => !step.disabled)?.value
  const selection = useControllableState<string | null>({
    name: 'Stepper value',
    value,
    defaultValue,
    initialValue: firstEnabled ?? null,
    onChange: next => {
      if (next !== null) onValueChange?.(next)
    }
  })
  const id = useId()
  const linear = navigation === 'linear'
  const horizontal = orientation === 'horizontal'
  const currentIndex = steps.findIndex(step => step.value === selection.value)
  const nextIndex = steps.findIndex((step, index) => index > currentIndex && !step.disabled)
  const nativeProps = {
    ...props,
    role: undefined,
    'aria-current': undefined,
    dangerouslySetInnerHTML: undefined
  }

  return (
    <nav
      {...nativeProps}
      data-slot={joinIds('stepper', props['data-slot'])}
      data-orientation={orientation}
      data-navigation={navigation}
      className={cn(
        'min-w-0 max-w-full [color:var(--rad-color-foreground)] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--_rad-control-font-size)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
        controlMetrics({ controlSize }),
        controlBorderClass,
        className
      )}
    >
      <ol
        data-slot="stepper-list"
        className={cn(
          'm-0 min-w-0 list-none p-0',
          horizontal ? 'flex items-stretch overflow-x-auto px-1 py-2' : 'grid px-1',
          horizontal && scrollbarClass,
          parts?.list?.className
        )}
        style={parts?.list?.style}
      >
        {steps.map((step, index) => {
          const current = index === currentIndex
          const error = hasText(step.error)
          const completed =
            !error && (step.completed ?? (linear && index < currentIndex && !step.disabled))
          const blocked = step.disabled || (linear && index > currentIndex && index !== nextIndex)
          const status: StepStatus = error
            ? 'error'
            : completed
              ? 'completed'
              : current
                ? 'current'
                : 'upcoming'
          const labelId = id + '-label-' + index
          const statusId = id + '-status-' + index
          const descriptionId = hasText(step.description) ? id + '-description-' + index : undefined
          const errorId = error ? id + '-error-' + index : undefined
          return (
            <li
              key={step.value}
              data-slot="stepper-item"
              data-value={step.value}
              data-state={status}
              data-current={current ? '' : undefined}
              data-completed={completed ? '' : undefined}
              className={cn(
                'relative min-w-0',
                horizontal
                  ? 'min-w-22 flex-1'
                  : 'min-h-[calc(var(--_rad-control-height)_+_1rem)] ps-[calc(var(--_rad-control-height)_+_0.75rem)] pb-4'
              )}
            >
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  data-slot="stepper-connector"
                  className={cn(
                    'pointer-events-none absolute [background:var(--rad-color-border)] forced-colors:[background:CanvasText]',
                    horizontal
                      ? 'start-[calc(50%_+_var(--_rad-control-height)/2_+_0.375rem)] top-[calc(0.125rem_+_var(--_rad-control-height)/2)] h-px w-[calc(100%_-_var(--_rad-control-height)_-_0.75rem)]'
                      : 'start-[calc(0.25rem_+_var(--_rad-control-height)/2)] top-[calc(var(--_rad-control-height)_+_0.5rem)] bottom-0 w-px',
                    completed &&
                      '[background:var(--rad-control-selected-border-color,var(--rad-color-accent))]',
                    parts?.connector?.className
                  )}
                  style={parts?.connector?.style}
                />
              )}
              <Button
                type="button"
                variant="ghost"
                tone="neutral"
                controlSize={controlSize}
                disabled={blocked}
                motion="off"
                aria-current={current ? 'step' : undefined}
                aria-labelledby={labelId}
                aria-describedby={joinIds(
                  status === 'current' ? undefined : statusId,
                  descriptionId,
                  errorId
                )}
                data-slot="stepper-step"
                data-state={status}
                data-current={current ? '' : undefined}
                data-completed={completed ? '' : undefined}
                style={parts?.step?.style}
                render={resolved => (
                  <button
                    {...resolved}
                    className={cn(
                      'relative flex w-full min-w-0 [&>span]:min-w-0 rounded-[var(--rad-control-radius,0.5rem)] [corner-shape:var(--rad-control-corner-shape,round)] bg-transparent px-1 text-inherit enabled:cursor-pointer enabled:hover:[&_[data-slot=stepper-label]]:underline disabled:cursor-default',
                      horizontal
                        ? 'justify-center pt-[calc(var(--_rad-control-height)_+_0.625rem)] text-center'
                        : "pt-0.5 text-start before:absolute before:end-[calc(100%_+_0.5rem)] before:top-0.5 before:size-[var(--_rad-control-height)] before:content-['']",
                      focusRingClass,
                      parts?.step?.className
                    )}
                  />
                )}
                onClick={() => selection.request(step.value)}
              >
                <span
                  id={labelId}
                  data-slot="stepper-label"
                  className={cn(
                    'min-w-0 font-semibold [overflow-wrap:anywhere]',
                    parts?.label?.className
                  )}
                  style={parts?.label?.style}
                >
                  {step.label}
                </span>
              </Button>
              <span
                aria-hidden="true"
                data-slot="stepper-indicator"
                className={cn(
                  markerClass,
                  'pointer-events-none absolute top-0.5',
                  horizontal ? 'left-1/2 -translate-x-1/2' : 'start-1',
                  completed &&
                    'border-[color:var(--rad-control-selected-border-color,var(--rad-color-accent))] bg-[var(--rad-control-selected-background,var(--rad-color-neutral))] [color:var(--rad-control-selected-foreground,var(--rad-color-foreground))]',
                  current &&
                    'border-[color:var(--rad-color-accent)] bg-[var(--rad-color-accent)] [color:var(--rad-color-accent-foreground)] forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
                  error &&
                    'border-[color:var(--rad-color-invalid)] bg-[var(--rad-control-field-background,var(--rad-color-surface))] [color:var(--rad-color-invalid)] forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
                  parts?.indicator?.className
                )}
                style={parts?.indicator?.style}
              >
                {error ? '!' : completed && !current ? '✓' : index + 1}
              </span>
              <div
                className={cn(
                  'grid min-w-0 gap-0.5 px-1 pt-0.5 [overflow-wrap:anywhere]',
                  horizontal && 'text-center'
                )}
              >
                <span
                  id={statusId}
                  data-slot="stepper-status"
                  className={cn(
                    'text-xs [color:var(--rad-color-muted-foreground)]',
                    current && !error && 'font-medium [color:var(--rad-color-foreground)]',
                    error && 'font-semibold [color:var(--rad-color-invalid)]',
                    parts?.status?.className
                  )}
                  style={parts?.status?.style}
                >
                  {current && status !== 'current' && (
                    <span aria-hidden="true">{statusLabels?.current || statusText.current} · </span>
                  )}
                  {statusLabels?.[status] || statusText[status]}
                </span>
                {descriptionId && (
                  <span
                    id={descriptionId}
                    data-slot="stepper-description"
                    className={cn(
                      'text-xs [color:var(--rad-color-muted-foreground)]',
                      parts?.description?.className
                    )}
                    style={parts?.description?.style}
                  >
                    {step.description}
                  </span>
                )}
                {errorId && (
                  <span
                    id={errorId}
                    data-slot="stepper-error"
                    className={cn(
                      'text-xs [color:var(--rad-color-invalid)]',
                      parts?.error?.className
                    )}
                    style={parts?.error?.style}
                  >
                    {step.error}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
