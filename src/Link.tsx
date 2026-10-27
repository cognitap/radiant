import { Fragment, isValidElement, type ComponentProps, type ReactElement } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonVariant, ControlSize, Tone } from './presentation.js'
import { actionTone, actionVariants } from './actionStyles.js'
import { cn } from './cn.js'
import type { ThemeStyle } from './themes/defineTheme.js'

const linkVariants = cva(
  [
    '[color:var(--_link-color)] [text-underline-offset:var(--rad-link-underline-offset,0.1875rem)]',
    'transition-colors duration-[var(--rad-link-color-duration,var(--rad-motion-color-duration,150ms))]',
    'hover:[color:var(--_link-hover)]',
    'focus-visible:outline-solid focus-visible:[outline-color:var(--rad-link-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))] focus-visible:[outline-width:var(--rad-link-focus-width,var(--rad-focus-width,2px))] focus-visible:[outline-offset:var(--rad-link-focus-offset,var(--rad-focus-offset,2px))] focus-visible:[outline-style:var(--rad-link-focus-style,var(--rad-focus-style,solid))]',
    'motion-reduce:transition-none'
  ],
  {
    variants: {
      variant: {
        inline:
          '[--_link-color:var(--rad-link-color,var(--_action-ink))] [--_link-hover:var(--rad-link-hover-color,color-mix(in_oklch,var(--_link-color),black_18%))] underline [text-decoration-color:color-mix(in_oklch,var(--_link-color),transparent_40%)] [text-decoration-thickness:var(--rad-link-decoration-thickness,0.0625rem)] hover:[text-decoration-thickness:var(--rad-link-decoration-thickness-hover,0.125rem)]',
        subtle:
          '[--_link-color:var(--rad-link-color,var(--_action-ink))] [--_link-hover:var(--rad-link-hover-color,color-mix(in_oklch,var(--_link-color),black_18%))] no-underline hover:underline [text-decoration-thickness:0.0625rem]'
      }
    },
    defaultVariants: {
      variant: 'inline'
    }
  }
)

type LinkVariants = VariantProps<typeof linkVariants>

export type LinkVariant = NonNullable<LinkVariants['variant']> | ButtonVariant

export type LinkRenderProps = Omit<ComponentProps<'a'>, 'style'> & {
  style?: ThemeStyle
  'data-slot': 'link'
  'data-variant': LinkVariant
  'data-tone': Tone
  'data-control-size': ControlSize
}

export type LinkProps = Omit<ComponentProps<'a'>, 'style'> & {
  style?: ThemeStyle
  variant?: LinkVariant
  tone?: Tone
  controlSize?: ControlSize
  external?: boolean
  render?: (props: LinkRenderProps) => ReactElement
}

export function Link({
  variant = 'inline',
  tone = 'accent',
  controlSize = 'medium',
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
    ...props,
    href,
    target: target ?? (external ? '_blank' : undefined),
    rel: rel ?? (external ? 'noopener noreferrer' : undefined),
    className:
      variant === 'inline' || variant === 'subtle'
        ? cn(actionTone({ tone }), linkVariants({ variant }), className)
        : cn(actionVariants({ variant, tone, controlSize }), className),
    'data-slot': 'link',
    'data-variant': variant,
    'data-tone': tone,
    'data-control-size': controlSize,
    children
  }
  if (render) {
    const element = render(anchorProps)
    if (
      !isValidElement(element) ||
      element.type === Fragment ||
      (typeof element.type === 'string' && element.type !== 'a')
    ) {
      throw new Error(
        'Link render must return one anchor or a component that forwards props to an anchor.'
      )
    }
    return element
  }
  return <a {...anchorProps}>{children}</a>
}
