'use client'

import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { createContext, useContext, useState } from 'react'
import { cn } from './cn.js'
import { composeAction } from './internal/events.js'
import { isItemOpen, nextSelection, sameSelection, type Selection } from './internal/selection.js'
import { useControllableState } from './react/useControllableState.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible.js'
import type {
  CollapsibleContentProps,
  CollapsibleProps,
  CollapsibleTriggerProps
} from './Collapsible.js'

const accordionClass =
  'grid w-full gap-[var(--rad-accordion-gap,var(--rad-spacing-group-gap,0.75rem))]'
const triggerClass =
  'in-[[data-slot~=field][data-disabled]]:[--_rad-disabled-opacity:1] data-disabled:cursor-not-allowed data-disabled:opacity-[var(--_rad-disabled-opacity,var(--rad-state-disabled-opacity,0.5))] forced-colors:data-disabled:opacity-100'
const headingClass = 'm-0 min-w-0 [font:inherit]'

const headingTag = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6'
} as const

export type AccordionHeadingLevel = keyof typeof headingTag

type AccordionBaseProps = Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> & {
  disabled?: boolean
}

type AccordionSingleProps = AccordionBaseProps & {
  type?: 'single'
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
}

type AccordionMultipleProps = AccordionBaseProps & {
  type: 'multiple'
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps

export type AccordionItemProps = Omit<
  CollapsibleProps,
  'open' | 'defaultOpen' | 'onOpenChange' | 'name'
> & {
  value: string
  disabled?: boolean
}

export type AccordionTriggerProps = CollapsibleTriggerProps & {
  level?: AccordionHeadingLevel | null
}

export type AccordionContentProps = CollapsibleContentProps

export type AccordionValue = Selection

export type AccordionState = {
  type: 'single' | 'multiple'
  value: AccordionValue
  disabled: boolean
  setItemOpen: (value: string, open: boolean) => void
}

export type AccordionTheme = NonNullable<ThemeComponentOverrides['accordion']>

type AccordionItemState = {
  value: string
  disabled: boolean
}

const AccordionContext = createContext<AccordionState | null>(null)
const AccordionItemContext = createContext<AccordionItemState | null>(null)

export function accordionTheme(theme: AccordionTheme): CSSProperties {
  return flattenComponents({ accordion: theme }) as CSSProperties
}

export function useAccordion(): AccordionState | null {
  return useContext(AccordionContext)
}

function useAccordionContext() {
  const accordion = useAccordion()
  if (!accordion) throw new Error('Accordion parts must render inside Accordion.')
  return accordion
}

function useAccordionItemContext() {
  const item = useContext(AccordionItemContext)
  if (!item) throw new Error('Accordion triggers must render inside AccordionItem.')
  return item
}

function TriggerHeading({
  level,
  children
}: {
  level: AccordionHeadingLevel | null
  children: ReactNode
}) {
  if (level === null) return children
  const Tag = headingTag[level]
  return <Tag className={headingClass}>{children}</Tag>
}

export function Accordion(allProps: AccordionProps) {
  const {
    type = 'single',
    value,
    defaultValue,
    onValueChange: _onValueChange,
    disabled = false,
    className,
    children,
    ...props
  } = allProps
  const [initialType] = useState(type)
  if (type !== initialType)
    throw new TypeError('Accordion cannot change type during a mount. Remount with a new key.')
  const { value: current, request } = useControllableState<AccordionValue>({
    name: 'Accordion',
    value,
    defaultValue,
    initialValue: type === 'multiple' ? [] : null,
    equal: sameSelection,
    onChange: next => {
      if (allProps.type === 'multiple' && Array.isArray(next)) allProps.onValueChange?.(next)
      else if (allProps.type !== 'multiple' && !Array.isArray(next)) allProps.onValueChange?.(next)
    }
  })
  if ((type === 'multiple') !== Array.isArray(current)) {
    throw new TypeError('Accordion selection must match its single or multiple type.')
  }

  const setItemOpen = (itemValue: string, open: boolean) => {
    if (disabled) return
    request(current => nextSelection(current, itemValue, open))
  }

  return (
    <AccordionContext.Provider value={{ type, value: current, disabled, setItemOpen }}>
      <div
        {...props}
        className={cn(accordionClass, className)}
        data-disabled={disabled ? '' : undefined}
        data-slot="accordion"
        data-type={type}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

export function AccordionItem({
  value,
  disabled = false,
  className,
  children,
  ...props
}: AccordionItemProps) {
  const accordion = useAccordionContext()
  const itemDisabled = accordion.disabled || disabled
  return (
    <AccordionItemContext.Provider value={{ value, disabled: itemDisabled }}>
      <Collapsible
        {...props}
        className={className}
        data-disabled={itemDisabled ? '' : undefined}
        data-value={value}
        open={isItemOpen(accordion.value, value)}
        onOpenChange={next => {
          if (itemDisabled) return
          accordion.setItemOpen(value, next)
        }}
      >
        {children}
      </Collapsible>
    </AccordionItemContext.Provider>
  )
}

export function AccordionTrigger({
  level = 3,
  className,
  children,
  tabIndex,
  onClick,
  onKeyDown,
  ...props
}: AccordionTriggerProps) {
  const item = useAccordionItemContext()
  return (
    <CollapsibleTrigger
      {...props}
      aria-disabled={item.disabled || undefined}
      className={cn(triggerClass, className)}
      data-disabled={item.disabled ? '' : undefined}
      tabIndex={item.disabled ? -1 : tabIndex}
      onClick={composeAction(onClick, undefined, () => item.disabled)}
      onKeyDown={composeAction(
        onKeyDown,
        undefined,
        event => item.disabled && (event.key === 'Enter' || event.key === ' ')
      )}
    >
      <TriggerHeading level={level}>{children}</TriggerHeading>
    </CollapsibleTrigger>
  )
}

export function AccordionContent(props: AccordionContentProps) {
  useAccordionContext()
  return <CollapsibleContent {...props} />
}
