import type { ComponentProps } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'

const colorMotionClass =
  'transition-colors duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none'

const cardVariants = cva([
  colorMotionClass,
  '[font-family:var(--rad-typography-family,system-ui,sans-serif)] [letter-spacing:var(--rad-typography-letter-spacing,-0.011em)] [font-size:var(--rad-typography-body-size,0.875rem)] [font-weight:var(--rad-typography-body-weight,400)]',
  'box-border grid w-full gap-[var(--rad-card-gap,var(--rad-surface-gap,1rem))] text-start antialiased',
  'rounded-[var(--rad-card-radius,var(--rad-surface-radius,0.75rem))]',
  '[corner-shape:var(--rad-card-corner-shape,var(--rad-surface-corner-shape,round))]',
  '[border-width:var(--rad-card-border-width,var(--rad-surface-border-width,1px))]',
  '[border-style:var(--rad-card-border-style,var(--rad-surface-border-style,solid))]',
  '[border-color:var(--rad-card-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
  'bg-[var(--rad-card-background,var(--rad-color-surface,oklch(1_0_0)))]',
  '[color:var(--rad-card-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
  'p-[var(--rad-card-padding,var(--rad-surface-padding,1.5rem))]',
  '[box-shadow:var(--rad-card-shadow,var(--rad-surface-shadow,0_1px_2px_0_rgb(0_0_0/0.06)))]',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:shadow-none'
])

const cardHeaderVariants = cva([
  'grid min-w-0 gap-[var(--rad-card-header-gap,var(--rad-spacing-header-gap,0.375rem))]'
])

const cardTitleVariants = cva([
  colorMotionClass,
  'm-0 min-w-0 break-words leading-snug',
  '[font-size:var(--rad-card-title-size,var(--rad-typography-heading-size,1.125rem))]',
  '[font-weight:var(--rad-card-title-weight,var(--rad-typography-heading-weight,600))]',
  'forced-colors:text-[CanvasText]'
])

const cardDescriptionVariants = cva([
  colorMotionClass,
  'm-0 min-w-0 break-words leading-snug',
  '[color:var(--rad-card-description-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
  '[font-size:var(--rad-card-description-size,var(--rad-typography-small-size,0.8125rem))]',
  'forced-colors:text-[CanvasText]'
])

const cardContentVariants = cva(['min-w-0 break-words'])

const cardFooterVariants = cva([
  'flex min-w-0 flex-wrap items-center gap-[var(--rad-card-footer-gap,var(--rad-spacing-footer-gap,0.5rem))]'
])

const headingTag = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6'
} as const

export type CardHeadingLevel = keyof typeof headingTag

type CardPartProps<Host extends 'div' | 'h2' | 'p'> = Omit<ComponentProps<Host>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}

export type CardProps = CardPartProps<'div'>

export type CardHeaderProps = CardPartProps<'div'>

export type CardTitleProps = CardPartProps<'h2'> & {
  level?: CardHeadingLevel
}

export type CardDescriptionProps = CardPartProps<'p'>

export type CardContentProps = CardPartProps<'div'>

export type CardFooterProps = CardPartProps<'div'>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(cardVariants(), className)}
      data-slot={joinIds('card', props['data-slot'])}
    />
  )
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      {...props}
      className={cn(cardHeaderVariants(), className)}
      data-slot={joinIds('card-header', props['data-slot'])}
    />
  )
}

export function CardTitle({ level = 2, className, children, ...props }: CardTitleProps) {
  const Tag = headingTag[level]
  return (
    <Tag
      {...props}
      className={cn(cardTitleVariants(), className)}
      data-slot={joinIds('card-title', props['data-slot'])}
    >
      {children}
    </Tag>
  )
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      {...props}
      className={cn(cardDescriptionVariants(), className)}
      data-slot={joinIds('card-description', props['data-slot'])}
    />
  )
}

export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div
      {...props}
      className={cn(cardContentVariants(), className)}
      data-slot={joinIds('card-content', props['data-slot'])}
    />
  )
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      {...props}
      className={cn(cardFooterVariants(), className)}
      data-slot={joinIds('card-footer', props['data-slot'])}
    />
  )
}
