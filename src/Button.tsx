import type { ComponentProps, CSSProperties, MouseEvent } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'

export const buttonVariants = cva(
  [
    'relative box-border inline-flex shrink-0 select-none items-center justify-center [border-style:var(--rad-button-border-style,var(--rad-control-border-style,solid))] [border-width:var(--rad-button-border-width,var(--rad-control-border-width,1px))] [border-color:var(--rad-button-border-color,var(--_btn-edge))] text-center [font-family:var(--rad-button-font-family,var(--rad-typography-family,system-ui,sans-serif))] [text-transform:var(--rad-button-text-transform,none)] antialiased',
    '[font-weight:var(--rad-button-font-weight,var(--rad-typography-label-weight,550))] [letter-spacing:var(--rad-button-letter-spacing,var(--rad-typography-letter-spacing,-0.011em))] [font-size:var(--_btn-fs)]',
    'min-h-(--_btn-h) px-(--_btn-px) bg-(--_btn-bg) text-(--_btn-fg)',
    'bg-[linear-gradient(to_bottom,rgb(255_255_255/var(--_btn-sheen)),rgb(255_255_255/0))]',
    '[--_btn-corner:var(--rad-button-corner-shape,var(--rad-control-corner-shape,round))] rounded-(--_btn-radius) [corner-shape:var(--_btn-corner)]',
    '[--_btn-radius-pressed:var(--rad-button-radius-pressed,var(--_btn-radius))]',
    '[--_btn-glow:var(--rad-button-glow,0%)] shadow-(--_btn-shadow) inset-shadow-[0_1px_0_0_rgb(255_255_255/var(--_btn-highlight))] [backdrop-filter:var(--rad-button-backdrop,none)]',
    '[--_btn-rd:var(--rad-button-release-duration,var(--rad-motion-release-duration,160ms))] [--_btn-re:var(--rad-button-release-ease,var(--rad-motion-release-ease,cubic-bezier(0.2,0.8,0.2,1)))]',
    '[--_btn-pd:var(--rad-button-press-duration,var(--rad-motion-press-duration,80ms))] [--_btn-pe:var(--rad-button-press-ease,var(--rad-motion-press-ease,cubic-bezier(0.3,0,0,1)))]',
    '[--_btn-cd:var(--rad-button-color-duration,var(--rad-motion-color-duration,150ms))]',
    'cursor-pointer transition-[scale,translate,border-radius,corner-shape,box-shadow,background-color,color]',
    'duration-[var(--_btn-rd),var(--_btn-rd),var(--_btn-rd),var(--_btn-rd),var(--_btn-cd),var(--_btn-cd),var(--_btn-cd)]',
    'ease-[var(--_btn-re),var(--_btn-re),var(--_btn-re),var(--_btn-re),ease-out,ease-out,ease-out]',
    'active:duration-[var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd)]',
    'active:ease-[var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe)]',
    'not-disabled:not-aria-busy:hover:bg-[color-mix(in_oklch,var(--_btn-bg),var(--rad-button-state-color,var(--_btn-hover-state))_var(--rad-button-hover-layer,5%))]',
    'not-disabled:not-aria-busy:motion-safe:hover:translate-y-[var(--rad-button-hover-lift,0px)]',
    'not-disabled:not-aria-busy:active:bg-[color-mix(in_oklch,var(--_btn-bg),var(--rad-button-state-color,var(--_btn-press-state))_var(--rad-button-press-layer,8%))]',
    'not-disabled:not-aria-busy:motion-safe:active:scale-[var(--rad-button-press-scale,0.97)] not-disabled:not-aria-busy:motion-safe:active:translate-y-[var(--rad-button-press-shift,0px)] not-disabled:not-aria-busy:motion-safe:active:translate-x-[var(--rad-button-press-shift-x,0px)]',
    'not-disabled:not-aria-busy:active:rounded-(--_btn-radius-pressed) not-disabled:not-aria-busy:active:[corner-shape:var(--rad-button-corner-shape-pressed,var(--_btn-corner))]',
    'not-disabled:not-aria-busy:active:[--_btn-highlight:0] not-disabled:not-aria-busy:active:[--_btn-sheen:0] not-disabled:not-aria-busy:active:shadow-[var(--rad-button-shadow-pressed,var(--_btn-shadow-pressed))]',
    'focus-visible:outline-solid focus-visible:[outline-color:var(--rad-button-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))] focus-visible:[outline-width:var(--rad-button-focus-width,var(--rad-focus-width,2px))] focus-visible:[outline-offset:var(--rad-button-focus-offset,var(--rad-focus-offset,2px))] focus-visible:[outline-style:var(--rad-button-focus-style,var(--rad-focus-style,solid))]',
    'in-[[data-slot~=field][data-disabled]]:[--_rad-disabled-opacity:1]',
    'disabled:cursor-not-allowed disabled:opacity-[var(--_rad-disabled-opacity,var(--rad-button-disabled-opacity,var(--rad-state-disabled-opacity,0.5)))]',
    'aria-busy:cursor-progress',
    'motion-reduce:transition-[background-color,color]',
    'forced-colors:border-[ButtonText] forced-colors:disabled:border-[GrayText] forced-colors:disabled:text-[GrayText] forced-colors:disabled:opacity-100'
  ],
  {
    variants: {
      variant: {
        primary:
          '[--_btn-bg:var(--rad-color-accent,oklch(0.21_0.006_286))] [--_btn-edge:color-mix(in_oklch,var(--_btn-bg),black_16%)] [--_btn-fg:var(--rad-color-accent-foreground,oklch(0.985_0_0))] [--_btn-hover-state:white] [--_btn-press-state:black] [--_btn-sheen:var(--rad-button-sheen,0)] [--_btn-highlight:var(--rad-button-highlight,0)] [--_btn-shadow:var(--rad-button-shadow,0_1px_2px_0_rgb(0_0_0/0.06)),0_10px_26px_-10px_color-mix(in_oklch,var(--_btn-bg)_var(--_btn-glow),transparent)] [--_btn-shadow-pressed:var(--rad-button-shadow-pressed,0_1px_2px_0_rgb(0_0_0/0.06))]',
        secondary:
          '[--_btn-bg:var(--rad-color-neutral,oklch(0.955_0.004_286))] [--_btn-edge:var(--rad-color-border,oklch(0.885_0.005_286))] [--_btn-fg:var(--rad-color-neutral-foreground,oklch(0.21_0.006_286))] [--_btn-hover-state:var(--_btn-fg)] [--_btn-press-state:var(--_btn-fg)] [--_btn-sheen:var(--rad-button-sheen,0)] [--_btn-highlight:var(--rad-button-highlight,0)] [--_btn-shadow:var(--rad-button-shadow,0_1px_2px_0_rgb(0_0_0/0.06))] [--_btn-shadow-pressed:var(--rad-button-shadow-pressed,0_1px_2px_0_rgb(0_0_0/0.06))]',
        warning:
          '[--_btn-bg:var(--rad-color-warning,oklch(0.8_0.14_78))] [--_btn-edge:color-mix(in_oklch,var(--_btn-bg),black_12%)] [--_btn-fg:var(--rad-color-warning-foreground,oklch(0.3_0.07_55))] [--_btn-hover-state:black] [--_btn-press-state:black] [--_btn-sheen:var(--rad-button-sheen,0)] [--_btn-highlight:var(--rad-button-highlight,0)] [--_btn-shadow:var(--rad-button-shadow,0_1px_2px_0_rgb(0_0_0/0.06)),0_10px_26px_-10px_color-mix(in_oklch,var(--_btn-bg)_var(--_btn-glow),transparent)] [--_btn-shadow-pressed:var(--rad-button-shadow-pressed,0_1px_2px_0_rgb(0_0_0/0.06))]',
        destructive:
          '[--_btn-bg:var(--rad-color-danger,oklch(0.56_0.19_25))] [--_btn-edge:color-mix(in_oklch,var(--_btn-bg),black_16%)] [--_btn-fg:var(--rad-color-danger-foreground,oklch(0.99_0_0))] [--_btn-hover-state:black] [--_btn-press-state:black] [--_btn-sheen:var(--rad-button-sheen,0)] [--_btn-highlight:var(--rad-button-highlight,0)] [--_btn-shadow:var(--rad-button-shadow,0_1px_2px_0_rgb(0_0_0/0.06)),0_10px_26px_-10px_color-mix(in_oklch,var(--_btn-bg)_var(--_btn-glow),transparent)] [--_btn-shadow-pressed:var(--rad-button-shadow-pressed,0_1px_2px_0_rgb(0_0_0/0.06))]',
        outline:
          '[--_btn-bg:var(--rad-color-surface,oklch(1_0_0))] [--_btn-edge:var(--rad-color-border,oklch(0.885_0.005_286))] [--_btn-fg:var(--rad-color-foreground,oklch(0.21_0.006_286))] [--_btn-hover-state:var(--_btn-fg)] [--_btn-press-state:var(--_btn-fg)] [--_btn-sheen:var(--rad-button-sheen,0)] [--_btn-highlight:var(--rad-button-highlight,0)] [--_btn-shadow:var(--rad-button-shadow,0_1px_2px_0_rgb(0_0_0/0.06))] [--_btn-shadow-pressed:var(--rad-button-shadow-pressed,0_1px_2px_0_rgb(0_0_0/0.06))]',
        ghost:
          '[--_btn-bg:transparent] [--_btn-edge:transparent] [--_btn-fg:var(--rad-color-foreground,oklch(0.21_0.006_286))] [--_btn-hover-state:var(--_btn-fg)] [--_btn-press-state:var(--_btn-fg)] [--_btn-sheen:var(--rad-button-sheen,0)] [--_btn-highlight:var(--rad-button-highlight,0)] [--_btn-shadow:var(--rad-button-ghost-shadow,0_0_#0000)] [--_btn-shadow-pressed:var(--rad-button-ghost-shadow-pressed,0_0_#0000)]'
      },
      size: {
        small:
          '[--_btn-h:var(--rad-button-height-small,var(--rad-control-small-height,2rem))] [--_btn-px:var(--rad-button-padding-small,var(--rad-control-small-padding-inline,0.75rem))] [--_btn-fs:var(--rad-button-font-size-small,var(--rad-control-small-font-size,0.8125rem))] [&_svg]:size-3.5',
        default:
          '[--_btn-h:var(--rad-button-height,var(--rad-control-medium-height,2.5rem))] [--_btn-px:var(--rad-button-padding,var(--rad-control-medium-padding-inline,1rem))] [--_btn-fs:var(--rad-button-font-size,var(--rad-control-medium-font-size,0.875rem))] [&_svg]:size-4',
        large:
          '[--_btn-h:var(--rad-button-height-large,var(--rad-control-large-height,3rem))] [--_btn-px:var(--rad-button-padding-large,var(--rad-control-large-padding-inline,1.375rem))] [--_btn-fs:var(--rad-button-font-size-large,var(--rad-control-large-font-size,0.9375rem))] [&_svg]:size-[1.125rem]'
      },
      radius: {
        none: '[--_btn-radius:0px]',
        small: '[--_btn-radius:0.375rem]',
        default: '[--_btn-radius:var(--rad-button-radius,var(--rad-control-radius,0.5rem))]',
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

export type ButtonTheme = NonNullable<ThemeComponentOverrides['button']> & {
  /** @deprecated This legacy setting has no rendering effect. */
  glowHover?: string
}

export function buttonTheme(theme: ButtonTheme): CSSProperties {
  return flattenComponents({ button: theme }) as CSSProperties
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
