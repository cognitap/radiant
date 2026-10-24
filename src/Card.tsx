import type { ComponentProps, CSSProperties } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'

const cardVariants = cva([
  'box-border grid w-full gap-[var(--card-gap,1rem)] text-start antialiased',
  'rounded-[var(--card-radius,var(--button-radius,0.75rem))]',
  '[corner-shape:var(--card-corner-shape,var(--button-corner-shape,unset))]',
  '[border-width:var(--card-border-width,1px)]',
  '[border-style:var(--card-border-style,solid)]',
  '[border-color:var(--card-border-color,var(--color-border))]',
  'bg-[var(--card-background,var(--color-background))]',
  '[color:var(--card-color,var(--color-foreground))]',
  'p-[var(--card-padding,1.25rem)]',
  '[box-shadow:var(--card-shadow,0_1px_2px_0_rgb(0_0_0/0.06))]',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:shadow-none'
])

const cardHeaderVariants = cva(['grid min-w-0 gap-[var(--card-header-gap,0.25rem)]'])

const cardTitleVariants = cva([
  'm-0 min-w-0 break-words leading-snug',
  '[font-size:var(--card-title-size,1.125rem)]',
  '[font-weight:var(--card-title-weight,550)]',
  'forced-colors:text-[CanvasText]'
])

const cardDescriptionVariants = cva([
  'm-0 min-w-0 break-words leading-snug',
  '[color:var(--card-description-color,color-mix(in_oklch,var(--color-foreground),transparent_35%))]',
  '[font-size:var(--card-description-size,0.8125rem)]',
  'forced-colors:text-[CanvasText]'
])

const cardContentVariants = cva(['min-w-0 break-words'])

const cardFooterVariants = cva([
  'flex min-w-0 flex-wrap items-center gap-[var(--card-footer-gap,0.75rem)]'
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

export type CardProps = ComponentProps<'div'>

export type CardHeaderProps = ComponentProps<'div'>

export type CardTitleProps = ComponentProps<'h2'> & {
  level?: CardHeadingLevel
}

export type CardDescriptionProps = ComponentProps<'p'>

export type CardContentProps = ComponentProps<'div'>

export type CardFooterProps = ComponentProps<'div'>

export type CardTheme = {
  radius?: string
  cornerShape?: string
  background?: string
  color?: string
  borderWidth?: string
  borderStyle?: string
  borderColor?: string
  padding?: string
  gap?: string
  headerGap?: string
  footerGap?: string
  shadow?: string
  titleSize?: string
  titleWeight?: number | string
  descriptionColor?: string
  descriptionSize?: string
}

const cardThemeVariables: Record<keyof CardTheme, string> = {
  radius: '--card-radius',
  cornerShape: '--card-corner-shape',
  background: '--card-background',
  color: '--card-color',
  borderWidth: '--card-border-width',
  borderStyle: '--card-border-style',
  borderColor: '--card-border-color',
  padding: '--card-padding',
  gap: '--card-gap',
  headerGap: '--card-header-gap',
  footerGap: '--card-footer-gap',
  shadow: '--card-shadow',
  titleSize: '--card-title-size',
  titleWeight: '--card-title-weight',
  descriptionColor: '--card-description-color',
  descriptionSize: '--card-description-size'
}

export function cardTheme(theme: CardTheme): CSSProperties {
  const style: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) {
      style[cardThemeVariables[key as keyof CardTheme]] = value
    }
  }
  return style as CSSProperties
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(cardVariants(), className)}
      data-slot="card"
    />
  )
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      {...props}
      className={cn(cardHeaderVariants(), className)}
      data-slot="card-header"
    />
  )
}

export function CardTitle({ level = 2, className, children, ...props }: CardTitleProps) {
  const Tag = headingTag[level]
  return (
    <Tag
      {...props}
      className={cn(cardTitleVariants(), className)}
      data-slot="card-title"
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
      data-slot="card-description"
    />
  )
}

export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div
      {...props}
      className={cn(cardContentVariants(), className)}
      data-slot="card-content"
    />
  )
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      {...props}
      className={cn(cardFooterVariants(), className)}
      data-slot="card-footer"
    />
  )
}
