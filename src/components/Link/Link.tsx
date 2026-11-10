import { Fragment, isValidElement, type ComponentProps, type ReactElement } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonVariant, ControlSize, Tone } from '../../presentation.js'
import { actionTone, actionVariants } from '../shared/actionStyles.js'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { focusRingClass } from '../shared/focusStyles.js'

const linkVariants = cva(
  [
    '[color:var(--_link-color)] [text-underline-offset:var(--rad-link-underline-offset,0.1875rem)]',
    'transition-colors duration-[var(--rad-link-color-duration,var(--rad-motion-color-duration,150ms))]',
    'hover:[color:var(--_link-hover)]',
    focusRingClass,
    'focus-visible:[--_rad-focus-color:var(--rad-link-focus-color)] focus-visible:[--_rad-focus-width:var(--rad-link-focus-width)] focus-visible:[--_rad-focus-offset:var(--rad-link-focus-offset)] focus-visible:[--_rad-focus-style:var(--rad-link-focus-style)]',
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
  'data-slot': string
  'data-variant': LinkVariant
  'data-tone': Tone
  'data-control-size': ControlSize
}

export type LinkProps = Omit<ComponentProps<'a'>, 'style'> & {
  style?: ThemeStyle
  /** Additional composed identities; the link token is always retained. */
  'data-slot'?: string
  /** Inline/subtle inherit text metrics; action treatments share Button's presentation. */
  variant?: LinkVariant
  /** Semantic palette, independent of treatment. */
  tone?: Tone
  /** Shared action dimensions; inline/subtle keep their surrounding text size. */
  controlSize?: ControlSize
  /** Default target to _blank and rel to noopener noreferrer; explicit native values win. */
  external?: boolean
  /** Forward every resolved prop, ref and child to one native or router anchor. */
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
  'data-slot': slot,
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
    'data-slot': joinIds('link', slot) ?? 'link',
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
