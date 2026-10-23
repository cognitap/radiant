import type { ComponentProps, CSSProperties, MouseEvent } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn.js'

const buttonVariants = cva(
  [
    'relative box-border inline-flex shrink-0 select-none items-center justify-center border border-solid text-center font-[family-name:inherit]',
    '[font-weight:var(--button-font-weight,500)] tracking-[var(--button-letter-spacing,-0.01em)]',
    'min-h-(--_btn-h) px-(--_btn-px) bg-(--_btn-bg) text-(--_btn-fg) border-(--_btn-edge)',
    'rounded-(--_btn-radius) [corner-shape:var(--button-corner-shape,round)]',
    '[--_btn-radius-pressed:var(--button-radius-pressed,var(--_btn-radius))]',
    'shadow-(--_btn-shadow) inset-shadow-[0_1px_0_0_rgb(255_255_255/var(--_btn-highlight))] [backdrop-filter:var(--button-backdrop,none)]',
    'cursor-pointer transition-[scale,translate,border-radius,corner-shape,box-shadow,background-color,color]',
    'duration-[var(--button-release-duration,160ms)] ease-[var(--button-release-ease,cubic-bezier(0.2,0.8,0.2,1))]',
    'enabled:not-aria-busy:hover:bg-[color-mix(in_oklch,var(--_btn-bg),var(--_btn-fg)_var(--button-hover-layer,8%))] enabled:not-aria-busy:hover:translate-y-[var(--button-hover-lift,0px)]',
    'enabled:not-aria-busy:active:bg-[color-mix(in_oklch,var(--_btn-bg),var(--_btn-fg)_var(--button-press-layer,14%))]',
    'enabled:not-aria-busy:active:scale-[var(--button-press-scale,0.97)] enabled:not-aria-busy:active:translate-y-[var(--button-press-shift,0px)]',
    'enabled:not-aria-busy:active:rounded-(--_btn-radius-pressed) enabled:not-aria-busy:active:[corner-shape:var(--button-corner-shape-pressed,var(--button-corner-shape,round))]',
    'enabled:not-aria-busy:active:[--_btn-highlight:0] enabled:not-aria-busy:active:shadow-[var(--button-shadow-pressed,0_0_#0000)]',
    'active:duration-[var(--button-press-duration,80ms)] active:ease-[var(--button-press-ease,cubic-bezier(0.3,0,0.6,1))]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    'disabled:cursor-not-allowed disabled:[--_btn-bg:var(--color-disabled)] disabled:[--_btn-fg:var(--color-disabled-foreground)] disabled:[--_btn-highlight:0] disabled:shadow-none',
    'aria-busy:cursor-progress',
    'motion-reduce:transition-[background-color,color] motion-reduce:active:scale-100 motion-reduce:active:translate-y-0 motion-reduce:hover:translate-y-0',
    'forced-colors:border-[ButtonText] forced-colors:disabled:border-[GrayText] forced-colors:disabled:text-[GrayText]'
  ],
  {
    variants: {
      variant: {
        primary:
          '[--_btn-bg:var(--color-primary)] [--_btn-fg:var(--color-primary-foreground)] [--_btn-edge:transparent] [--_btn-highlight:var(--button-highlight,0.16)] [--_btn-shadow:var(--button-shadow,0_1px_2px_0_rgb(0_0_0/0.16)),0_6px_18px_-6px_color-mix(in_oklch,var(--_btn-bg)_var(--button-glow,0%),transparent)]',
        secondary:
          '[--_btn-bg:var(--color-secondary)] [--_btn-fg:var(--color-secondary-foreground)] [--_btn-edge:transparent] [--_btn-highlight:var(--button-highlight,0.16)] [--_btn-shadow:var(--button-shadow,0_1px_2px_0_rgb(0_0_0/0.08))]',
        warning:
          '[--_btn-bg:var(--color-warning)] [--_btn-fg:var(--color-warning-foreground)] [--_btn-edge:transparent] [--_btn-highlight:var(--button-highlight,0.16)] [--_btn-shadow:var(--button-shadow,0_1px_2px_0_rgb(0_0_0/0.16)),0_6px_18px_-6px_color-mix(in_oklch,var(--_btn-bg)_var(--button-glow,0%),transparent)]',
        destructive:
          '[--_btn-bg:var(--color-destructive)] [--_btn-fg:var(--color-destructive-foreground)] [--_btn-edge:transparent] [--_btn-highlight:var(--button-highlight,0.16)] [--_btn-shadow:var(--button-shadow,0_1px_2px_0_rgb(0_0_0/0.16)),0_6px_18px_-6px_color-mix(in_oklch,var(--_btn-bg)_var(--button-glow,0%),transparent)]',
        outline:
          '[--_btn-bg:var(--color-background)] [--_btn-fg:var(--color-foreground)] [--_btn-edge:var(--color-border)] [--_btn-highlight:0] [--_btn-shadow:0_1px_2px_0_rgb(0_0_0/0.05)] disabled:[--_btn-bg:transparent]',
        ghost:
          '[--_btn-bg:transparent] [--_btn-fg:var(--color-foreground)] [--_btn-edge:transparent] [--_btn-highlight:0] [--_btn-shadow:0_0_#0000] disabled:[--_btn-bg:transparent]'
      },
      size: {
        small:
          '[--_btn-h:var(--button-height-small,2rem)] [--_btn-px:var(--button-padding-small,0.75rem)] text-sm leading-5 [&_svg]:size-3.5',
        default:
          '[--_btn-h:var(--button-height,2.5rem)] [--_btn-px:var(--button-padding,1rem)] text-[length:inherit] leading-6 [&_svg]:size-4',
        large:
          '[--_btn-h:var(--button-height-large,3rem)] [--_btn-px:var(--button-padding-large,1.5rem)] text-base leading-6 [&_svg]:size-5'
      },
      radius: {
        none: '[--_btn-radius:0px]',
        small: '[--_btn-radius:0.25rem]',
        default: '[--_btn-radius:var(--button-radius,var(--radius-control))]',
        large: '[--_btn-radius:0.75rem]',
        full: '[--_btn-radius:calc(var(--_btn-h)/2)]'
      },
      iconOnly: {
        true: 'size-(--_btn-h) px-0',
        false: ''
      },
      fullWidth: {
        true: 'w-full',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      radius: 'default',
      iconOnly: false,
      fullWidth: false
    }
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

export type ButtonVariant = NonNullable<ButtonVariants['variant']>
export type ButtonSize = NonNullable<ButtonVariants['size']>
export type ButtonRadius = NonNullable<ButtonVariants['radius']>

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  radius?: ButtonRadius
  iconOnly?: boolean
  fullWidth?: boolean
  pending?: boolean
}

export type ButtonTheme = {
  radius?: string
  radiusPressed?: string
  cornerShape?: string
  cornerShapePressed?: string
  height?: string
  heightSmall?: string
  heightLarge?: string
  padding?: string
  paddingSmall?: string
  paddingLarge?: string
  fontWeight?: string | number
  letterSpacing?: string
  shadow?: string
  shadowPressed?: string
  highlight?: number
  glow?: string
  backdrop?: string
  hoverLayer?: string
  pressLayer?: string
  hoverLift?: string
  pressScale?: number
  pressShift?: string
  pressDuration?: string
  pressEase?: string
  releaseDuration?: string
  releaseEase?: string
}

const buttonThemeVariables: Record<keyof ButtonTheme, string> = {
  radius: '--button-radius',
  radiusPressed: '--button-radius-pressed',
  cornerShape: '--button-corner-shape',
  cornerShapePressed: '--button-corner-shape-pressed',
  height: '--button-height',
  heightSmall: '--button-height-small',
  heightLarge: '--button-height-large',
  padding: '--button-padding',
  paddingSmall: '--button-padding-small',
  paddingLarge: '--button-padding-large',
  fontWeight: '--button-font-weight',
  letterSpacing: '--button-letter-spacing',
  shadow: '--button-shadow',
  shadowPressed: '--button-shadow-pressed',
  highlight: '--button-highlight',
  glow: '--button-glow',
  backdrop: '--button-backdrop',
  hoverLayer: '--button-hover-layer',
  pressLayer: '--button-press-layer',
  hoverLift: '--button-hover-lift',
  pressScale: '--button-press-scale',
  pressShift: '--button-press-shift',
  pressDuration: '--button-press-duration',
  pressEase: '--button-press-ease',
  releaseDuration: '--button-release-duration',
  releaseEase: '--button-release-ease'
}

export function buttonTheme(theme: ButtonTheme): CSSProperties {
  const style: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) {
      style[buttonThemeVariables[key as keyof ButtonTheme]] = value
    }
  }
  return style as CSSProperties
}

export function Button({
  type = 'button',
  variant,
  size,
  radius,
  iconOnly,
  fullWidth,
  className,
  pending = false,
  onClick,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={pending || undefined}
      data-slot="button"
      data-variant={variant ?? 'primary'}
      data-size={size ?? 'default'}
      className={cn(buttonVariants({ variant, size, radius, iconOnly, fullWidth }), className)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (pending) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      {...props}
    >
      <span
        className={cn(
          'inline-flex items-center gap-[0.5em] [&_svg]:shrink-0',
          pending && 'opacity-0 motion-reduce:opacity-100'
        )}
      >
        {children}
      </span>
      {pending ? <PendingMark /> : null}
    </button>
  )
}

function PendingMark() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center motion-reduce:hidden"
    >
      <span className="size-[1em] animate-spin rounded-full border-2 border-current border-t-transparent" />
    </span>
  )
}
