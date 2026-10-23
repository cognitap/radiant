import type { AnchorHTMLAttributes, ComponentProps, CSSProperties, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { buttonVariants, type ButtonRadius, type ButtonSize, type ButtonVariant } from './Button.js'
import { cn } from './cn.js'

const linkVariants = cva(
  [
    '[color:var(--_link-color)] [text-underline-offset:var(--link-underline-offset,0.1875rem)]',
    'transition-colors duration-[var(--link-color-duration,var(--button-color-duration,150ms))]',
    'hover:[color:var(--_link-hover)]',
    'focus-visible:outline-solid focus-visible:[outline-color:var(--link-focus-color,var(--color-focus))] focus-visible:[outline-width:var(--link-focus-width,var(--button-focus-width,2px))] focus-visible:[outline-offset:var(--link-focus-offset,var(--button-focus-offset,2px))] focus-visible:[outline-style:var(--link-focus-style,var(--button-focus-style,solid))]',
    'motion-reduce:transition-none'
  ],
  {
    variants: {
      variant: {
        inline:
          '[--_link-color:var(--link-color,var(--color-primary))] [--_link-hover:var(--link-hover-color,color-mix(in_oklch,var(--_link-color),black_18%))] underline [text-decoration-color:color-mix(in_oklch,var(--_link-color),transparent_40%)] [text-decoration-thickness:var(--link-decoration-thickness,0.0625rem)] hover:[text-decoration-thickness:var(--link-decoration-thickness-hover,0.125rem)]',
        subtle:
          '[--_link-color:var(--link-color,var(--color-foreground))] [--_link-hover:var(--link-hover-color,var(--color-primary))] no-underline hover:underline [text-decoration-thickness:0.0625rem]'
      }
    },
    defaultVariants: {
      variant: 'inline'
    }
  }
)

type LinkVariants = VariantProps<typeof linkVariants>

export type LinkVariant = NonNullable<LinkVariants['variant']> | 'button'

export type LinkRenderProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode
  'data-slot'?: string
  'data-variant'?: string
}

export type LinkProps = ComponentProps<'a'> & {
  variant?: LinkVariant
  tone?: ButtonVariant
  size?: ButtonSize
  radius?: ButtonRadius
  external?: boolean
  render?: (props: LinkRenderProps) => ReactNode
}

export type LinkTheme = {
  color?: string
  hoverColor?: string
  underlineOffset?: string
  decorationThickness?: string
  decorationThicknessHover?: string
  colorDuration?: string
  focusColor?: string
  focusWidth?: string
  focusOffset?: string
  focusStyle?: string
}

const linkThemeVariables: Record<keyof LinkTheme, string> = {
  color: '--link-color',
  hoverColor: '--link-hover-color',
  underlineOffset: '--link-underline-offset',
  decorationThickness: '--link-decoration-thickness',
  decorationThicknessHover: '--link-decoration-thickness-hover',
  colorDuration: '--link-color-duration',
  focusColor: '--link-focus-color',
  focusWidth: '--link-focus-width',
  focusOffset: '--link-focus-offset',
  focusStyle: '--link-focus-style'
}

export function linkTheme(theme: LinkTheme): CSSProperties {
  const style: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) {
      style[linkThemeVariables[key as keyof LinkTheme]] = value
    }
  }
  return style as CSSProperties
}

export function Link({
  variant = 'inline',
  tone = 'primary',
  size,
  radius,
  external = false,
  render,
  className,
  href,
  target,
  rel,
  children,
  ...props
}: LinkProps) {
  const anchorProps: LinkRenderProps = {
    href,
    target: target ?? (external ? '_blank' : undefined),
    rel: rel ?? (external ? 'noopener noreferrer' : undefined),
    className:
      variant === 'button'
        ? cn(buttonVariants({ variant: tone, size, radius }), className)
        : cn(linkVariants({ variant }), className),
    'data-slot': 'link',
    'data-variant': variant,
    ...props,
    children
  }
  if (render) {
    return render(anchorProps)
  }
  return <a {...anchorProps}>{children}</a>
}
