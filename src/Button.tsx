import type { ComponentProps, CSSProperties, MouseEvent } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn.js'

const buttonVariants = cva(
  [
    'relative box-border inline-flex shrink-0 select-none items-center justify-center border border-solid border-(--_btn-edge) text-center font-[family-name:inherit] antialiased',
    '[font-weight:var(--button-font-weight,550)] tracking-[var(--button-letter-spacing,-0.011em)]',
    'min-h-(--_btn-h) px-(--_btn-px) bg-(--_btn-bg) text-(--_btn-fg)',
    'bg-[linear-gradient(to_bottom,rgb(255_255_255/var(--_btn-sheen)),rgb(255_255_255/0))]',
    '[--_btn-corner:var(--button-corner-shape,squircle)] rounded-(--_btn-radius) [corner-shape:var(--_btn-corner)]',
    '[--_btn-radius-pressed:var(--button-radius-pressed,calc(var(--_btn-radius)*0.75))]',
    'shadow-(--_btn-shadow) inset-shadow-[0_1px_0_0_rgb(255_255_255/var(--_btn-highlight))] [backdrop-filter:var(--button-backdrop,none)]',
    '[--_btn-rd:var(--button-release-duration,450ms)] [--_btn-re:var(--button-release-ease,var(--ease-spring))]',
    '[--_btn-pd:var(--button-press-duration,120ms)] [--_btn-pe:var(--button-press-ease,var(--ease-snap))]',
    '[--_btn-cd:var(--button-color-duration,150ms)]',
    'cursor-pointer transition-[scale,translate,border-radius,corner-shape,box-shadow,background-color,color]',
    'duration-[var(--_btn-rd),var(--_btn-rd),var(--_btn-rd),var(--_btn-rd),var(--_btn-cd),var(--_btn-cd),var(--_btn-cd)]',
    'ease-[var(--_btn-re),var(--_btn-re),var(--_btn-re),var(--_btn-re),ease-out,ease-out,ease-out]',
    'active:duration-[var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd)]',
    'active:ease-[var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe)]',
    'enabled:not-aria-busy:hover:bg-[color-mix(in_oklch,var(--_btn-bg),var(--button-state-color,var(--_btn-hover-state))_var(--button-hover-layer,7%))] enabled:not-aria-busy:hover:translate-y-[var(--button-hover-lift,0px)]',
    'enabled:not-aria-busy:active:bg-[color-mix(in_oklch,var(--_btn-bg),var(--button-state-color,var(--_btn-press-state))_var(--button-press-layer,12%))]',
    'enabled:not-aria-busy:active:scale-[var(--button-press-scale,0.97)] enabled:not-aria-busy:active:translate-y-[var(--button-press-shift,0px)]',
    'enabled:not-aria-busy:active:rounded-(--_btn-radius-pressed) enabled:not-aria-busy:active:[corner-shape:var(--button-corner-shape-pressed,var(--_btn-corner))]',
    'enabled:not-aria-busy:active:[--_btn-highlight:0] enabled:not-aria-busy:active:shadow-[var(--button-shadow-pressed,var(--_btn-shadow-pressed))]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    'disabled:cursor-not-allowed disabled:opacity-[var(--button-disabled-opacity,0.45)]',
    'aria-busy:cursor-progress',
    'motion-reduce:transition-[background-color,color] motion-reduce:active:scale-100 motion-reduce:active:translate-y-0 motion-reduce:hover:translate-y-0',
    'forced-colors:border-[ButtonText] forced-colors:disabled:border-[GrayText] forced-colors:disabled:text-[GrayText] forced-colors:disabled:opacity-100'
  ],
  {
    variants: {
      variant: {
        primary:
          '[--_btn-bg:var(--color-primary)] [--_btn-edge:transparent] [--_btn-fg:var(--color-primary-foreground)] [--_btn-hover-state:var(--_btn-fg)] [--_btn-press-state:black] [--_btn-sheen:var(--button-sheen,0.1)] [--_btn-highlight:var(--button-highlight,0.14)] [--_btn-shadow:var(--button-shadow,0_0_0_1px_color-mix(in_oklch,var(--_btn-bg),black_30%),0_1px_2px_0_rgb(0_0_0/0.14),0_3px_8px_-3px_rgb(0_0_0/0.22)),0_6px_18px_-6px_color-mix(in_oklch,var(--_btn-bg)_var(--button-glow,0%),transparent)] [--_btn-shadow-pressed:0_0_0_1px_color-mix(in_oklch,var(--_btn-bg),black_30%)]',
        secondary:
          '[--_btn-bg:var(--color-secondary)] [--_btn-edge:transparent] [--_btn-fg:var(--color-secondary-foreground)] [--_btn-hover-state:var(--_btn-fg)] [--_btn-press-state:var(--_btn-fg)] [--_btn-sheen:0] [--_btn-highlight:0] [--_btn-shadow:var(--button-shadow,0_0_#0000)] [--_btn-shadow-pressed:0_0_#0000]',
        warning:
          '[--_btn-bg:var(--color-warning)] [--_btn-edge:transparent] [--_btn-fg:var(--color-warning-foreground)] [--_btn-hover-state:black] [--_btn-press-state:black] [--_btn-sheen:var(--button-sheen,0.1)] [--_btn-highlight:var(--button-highlight,0.3)] [--_btn-shadow:var(--button-shadow,0_0_0_1px_color-mix(in_oklch,var(--_btn-bg),black_18%),0_1px_2px_0_rgb(0_0_0/0.1),0_3px_8px_-3px_rgb(0_0_0/0.16)),0_6px_18px_-6px_color-mix(in_oklch,var(--_btn-bg)_var(--button-glow,0%),transparent)] [--_btn-shadow-pressed:0_0_0_1px_color-mix(in_oklch,var(--_btn-bg),black_18%)]',
        destructive:
          '[--_btn-bg:var(--color-destructive)] [--_btn-edge:transparent] [--_btn-fg:var(--color-destructive-foreground)] [--_btn-hover-state:black] [--_btn-press-state:black] [--_btn-sheen:var(--button-sheen,0.1)] [--_btn-highlight:var(--button-highlight,0.2)] [--_btn-shadow:var(--button-shadow,0_0_0_1px_color-mix(in_oklch,var(--_btn-bg),black_25%),0_1px_2px_0_rgb(0_0_0/0.12),0_3px_8px_-3px_rgb(0_0_0/0.2)),0_6px_18px_-6px_color-mix(in_oklch,var(--_btn-bg)_var(--button-glow,0%),transparent)] [--_btn-shadow-pressed:0_0_0_1px_color-mix(in_oklch,var(--_btn-bg),black_25%)]',
        outline:
          '[--_btn-bg:var(--color-background)] [--_btn-edge:var(--color-border)] [--_btn-fg:var(--color-foreground)] [--_btn-hover-state:var(--_btn-fg)] [--_btn-press-state:var(--_btn-fg)] [--_btn-sheen:0] [--_btn-highlight:0] [--_btn-shadow:var(--button-shadow,0_1px_2px_0_rgb(0_0_0/0.06))] [--_btn-shadow-pressed:0_0_#0000]',
        ghost:
          '[--_btn-bg:transparent] [--_btn-edge:transparent] [--_btn-fg:var(--color-foreground)] [--_btn-hover-state:var(--_btn-fg)] [--_btn-press-state:var(--_btn-fg)] [--_btn-sheen:0] [--_btn-highlight:0] [--_btn-shadow:0_0_#0000] [--_btn-shadow-pressed:0_0_#0000]'
      },
      size: {
        small:
          '[--_btn-h:var(--button-height-small,2rem)] [--_btn-px:var(--button-padding-small,0.75rem)] text-[0.8125rem] leading-5 [&_svg]:size-3.5',
        default:
          '[--_btn-h:var(--button-height,2.5rem)] [--_btn-px:var(--button-padding,1rem)] text-sm leading-5 [&_svg]:size-4',
        large:
          '[--_btn-h:var(--button-height-large,3rem)] [--_btn-px:var(--button-padding-large,1.375rem)] text-[0.9375rem] leading-6 [&_svg]:size-[1.125rem]'
      },
      radius: {
        none: '[--_btn-radius:0px]',
        small: '[--_btn-radius:0.375rem]',
        default: '[--_btn-radius:var(--button-radius,var(--radius-control))]',
        large: '[--_btn-radius:1rem]',
        full: '[--_btn-radius:calc(var(--_btn-h)/2)] [--_btn-corner:round]'
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
  sheen?: number
  glow?: string
  backdrop?: string
  stateColor?: string
  hoverLayer?: string
  pressLayer?: string
  hoverLift?: string
  pressScale?: number
  pressShift?: string
  pressDuration?: string
  pressEase?: string
  releaseDuration?: string
  releaseEase?: string
  colorDuration?: string
  disabledOpacity?: number
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
  sheen: '--button-sheen',
  glow: '--button-glow',
  backdrop: '--button-backdrop',
  stateColor: '--button-state-color',
  hoverLayer: '--button-hover-layer',
  pressLayer: '--button-press-layer',
  hoverLift: '--button-hover-lift',
  pressScale: '--button-press-scale',
  pressShift: '--button-press-shift',
  pressDuration: '--button-press-duration',
  pressEase: '--button-press-ease',
  releaseDuration: '--button-release-duration',
  releaseEase: '--button-release-ease',
  colorDuration: '--button-color-duration',
  disabledOpacity: '--button-disabled-opacity'
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
      <span className="size-[1.1em] animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
    </span>
  )
}
