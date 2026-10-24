'use client'

import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { createContext, useContext, useState } from 'react'
import { cn } from './cn.js'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible.js'
import type {
  CollapsibleContentProps,
  CollapsibleProps,
  CollapsibleTriggerProps
} from './Collapsible.js'

const accordionClass = 'grid w-full gap-[var(--accordion-gap,0.75rem)]'
const triggerClass = 'data-disabled:cursor-not-allowed data-disabled:opacity-60'
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

export type AccordionValue = string | null | string[]

export type AccordionState = {
  type: 'single' | 'multiple'
  value: AccordionValue
  disabled: boolean
  setItemOpen: (value: string, open: boolean) => void
}

export type AccordionTheme = {
  gap?: string
}

const accordionThemeVariables: Record<keyof AccordionTheme, string> = {
  gap: '--accordion-gap'
}

type AccordionItemState = {
  value: string
  disabled: boolean
}

const AccordionContext = createContext<AccordionState | null>(null)
const AccordionItemContext = createContext<AccordionItemState | null>(null)

export function accordionTheme(theme: AccordionTheme): CSSProperties {
  const style: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) {
      style[accordionThemeVariables[key as keyof AccordionTheme]] = value
    }
  }
  return style as CSSProperties
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

function isItemOpen(value: AccordionValue, itemValue: string) {
  return Array.isArray(value) ? value.includes(itemValue) : value === itemValue
}

function sameValue(left: AccordionValue, right: AccordionValue) {
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false
    return left.every((item, index) => item === right[index])
  }
  return left === right
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

export function Accordion({
  type = 'single',
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
  children,
  ...props
}: AccordionProps) {
  const [uncontrolled, setUncontrolled] = useState<AccordionValue>(() => {
    if (defaultValue !== undefined) return defaultValue
    return type === 'multiple' ? [] : null
  })
  const controlled = value !== undefined
  const selected = controlled ? value : uncontrolled
  const current: AccordionValue = selected ?? (type === 'multiple' ? [] : null)

  const setItemOpen = (itemValue: string, open: boolean) => {
    if (disabled) return
    const next =
      type === 'multiple'
        ? nextMultiple(Array.isArray(current) ? current : [], itemValue, open)
        : nextSingle(
            typeof current === 'string' || current === null ? current : null,
            itemValue,
            open
          )
    if (sameValue(current, next)) return
    if (type === 'multiple') {
      if (!Array.isArray(next)) return
      ;(onValueChange as ((nextValue: string[]) => void) | undefined)?.(next)
    } else {
      if (Array.isArray(next)) return
      ;(onValueChange as ((nextValue: string | null) => void) | undefined)?.(next)
    }
    if (!controlled) setUncontrolled(next)
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

function nextMultiple(current: string[], itemValue: string, open: boolean) {
  if (open) return current.includes(itemValue) ? current : [...current, itemValue]
  return current.filter(item => item !== itemValue)
}

function nextSingle(current: string | null, itemValue: string, open: boolean) {
  // A section reports closed when its open prop turns false after another
  // section opens. That report is not a request to clear the selection.
  if (open) return itemValue
  return current === itemValue ? null : current
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
      onClick={event => {
        onClick?.(event)
        if (item.disabled) event.preventDefault()
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (item.disabled && (event.key === 'Enter' || event.key === ' ')) event.preventDefault()
      }}
    >
      <TriggerHeading level={level}>{children}</TriggerHeading>
    </CollapsibleTrigger>
  )
}

export function AccordionContent(props: AccordionContentProps) {
  useAccordionContext()
  return <CollapsibleContent {...props} />
}
