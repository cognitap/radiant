import { cva } from 'class-variance-authority'

// Palette and readable ink are shared by actions, text links and inline feedback. Ink is
// mixed toward the scope foreground so pale warning/accent fills stay readable
// on an unfilled surface in either mode. Neutral preserves the quiet palette.
const tones = {
  accent:
    '[--_action-color:var(--rad-color-accent,oklch(0.21_0.006_286))] [--_action-on-color:var(--rad-color-accent-foreground,oklch(0.985_0_0))] [--_action-ink:color-mix(in_oklab,var(--_action-color)_25%,var(--rad-color-foreground,oklch(0.21_0.006_286)))] [--_action-soft:color-mix(in_oklab,var(--_action-color)_12%,var(--rad-color-surface,white))] [--_action-edge:color-mix(in_oklab,var(--_action-ink)_45%,var(--rad-color-border,oklch(0.885_0.005_286)))] [--_action-solid-state:white]',
  neutral:
    '[--_action-color:var(--rad-color-neutral,oklch(0.955_0.004_286))] [--_action-on-color:var(--rad-color-neutral-foreground,oklch(0.21_0.006_286))] [--_action-ink:var(--rad-color-neutral-foreground,oklch(0.21_0.006_286))] [--_action-soft:var(--rad-color-neutral,oklch(0.955_0.004_286))] [--_action-edge:var(--rad-color-border,oklch(0.885_0.005_286))] [--_action-solid-state:var(--_action-on-color)]',
  warning:
    '[--_action-color:var(--rad-color-warning,oklch(0.8_0.14_78))] [--_action-on-color:var(--rad-color-warning-foreground,oklch(0.3_0.07_55))] [--_action-ink:color-mix(in_oklab,var(--_action-color)_25%,var(--rad-color-foreground,oklch(0.21_0.006_286)))] [--_action-soft:color-mix(in_oklab,var(--_action-color)_12%,var(--rad-color-surface,white))] [--_action-edge:color-mix(in_oklab,var(--_action-ink)_45%,var(--rad-color-border,oklch(0.885_0.005_286)))] [--_action-solid-state:black]',
  danger:
    '[--_action-color:var(--rad-color-danger,oklch(0.56_0.19_25))] [--_action-on-color:var(--rad-color-danger-foreground,oklch(0.99_0_0))] [--_action-ink:color-mix(in_oklab,var(--_action-color)_25%,var(--rad-color-foreground,oklch(0.21_0.006_286)))] [--_action-soft:color-mix(in_oklab,var(--_action-color)_12%,var(--rad-color-surface,white))] [--_action-edge:color-mix(in_oklab,var(--_action-ink)_45%,var(--rad-color-border,oklch(0.885_0.005_286)))] [--_action-solid-state:black]'
}

// Actions embedded in a field or chip keep its voice and stay flat, whatever the theme gives Button.
export const inlineActionClass =
  '[--rad-button-shadow:none] [--rad-button-shadow-pressed:none] [--rad-button-ghost-shadow:none] [--rad-button-ghost-shadow-pressed:none] [--rad-button-border-color:transparent] [--rad-button-backdrop:none] [--rad-button-radius-pressed:var(--_btn-radius)] [--rad-button-corner-shape-pressed:var(--_btn-corner)] [--rad-button-text-transform:none] [--rad-button-letter-spacing:normal] [--rad-button-font-family:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)]'

export const actionTone = cva('', {
  variants: { tone: tones },
  defaultVariants: { tone: 'accent' }
})

export const actionVariants = cva(
  [
    'relative box-border inline-flex shrink-0 select-none items-center justify-center [border-style:var(--rad-button-border-style,var(--rad-control-border-style,solid))] [border-width:var(--rad-button-border-width,var(--rad-control-border-width,1px))] [border-color:var(--_btn-selected-edge,var(--rad-button-border-color,var(--_btn-edge)))] text-center font-[family-name:var(--rad-button-font-family,var(--rad-control-action-font-family,var(--rad-typography-roles-ui-label-family,system-ui,sans-serif)))] [text-transform:var(--rad-button-text-transform,var(--rad-control-action-text-transform,none))] antialiased',
    'font-[number:var(--rad-button-font-weight,var(--rad-control-action-font-weight,var(--rad-typography-roles-ui-label-weight,550)))] tracking-[var(--rad-button-letter-spacing,var(--rad-control-action-letter-spacing,var(--rad-typography-roles-ui-label-letter-spacing,-0.011em)))] text-[length:var(--_btn-fs)] leading-[var(--rad-typography-roles-ui-label-line-height,1.4)]',
    'min-h-(--_btn-h) px-(--_btn-px) bg-(--_btn-fill) text-[color:var(--_btn-selected-fg,var(--_btn-fg))] no-underline',
    '[--_btn-fill:var(--_btn-selected-bg,var(--_btn-bg))]',
    'bg-[linear-gradient(to_bottom,rgb(255_255_255/var(--_btn-sheen)),rgb(255_255_255/0))]',
    '[--_btn-corner:var(--rad-button-corner-shape,var(--rad-control-corner-shape,round))] rounded-(--_btn-radius) [corner-shape:var(--_btn-corner)]',
    '[--_btn-radius:var(--rad-button-radius,var(--rad-control-radius,0.5rem))] [--_btn-radius-pressed:var(--rad-button-radius-pressed,var(--rad-control-action-radius-pressed,var(--_btn-radius)))]',
    '[--_btn-glow:var(--rad-button-glow,0%)] shadow-[var(--_btn-selected-shadow,var(--_btn-shadow))] inset-shadow-[0_1px_0_0_rgb(255_255_255/var(--_btn-highlight))] [backdrop-filter:var(--rad-button-backdrop,none)]',
    '[--_btn-rd:var(--rad-button-release-duration,var(--rad-motion-release-duration,160ms))] [--_btn-re:var(--rad-button-release-ease,var(--rad-motion-release-ease,cubic-bezier(0.2,0.8,0.2,1)))]',
    '[--_btn-pd:var(--rad-button-press-duration,var(--rad-motion-press-duration,80ms))] [--_btn-pe:var(--rad-button-press-ease,var(--rad-motion-press-ease,cubic-bezier(0.3,0,0,1)))]',
    '[--_btn-cd:var(--rad-button-color-duration,var(--rad-motion-color-duration,150ms))]',
    'cursor-pointer transition-[scale,translate,border-radius,corner-shape,box-shadow,background-color,color]',
    'duration-[var(--_btn-rd),var(--_btn-rd),var(--_btn-rd),var(--_btn-rd),var(--_btn-cd),var(--_btn-cd),var(--_btn-cd)]',
    'ease-[var(--_btn-re),var(--_btn-re),var(--_btn-re),var(--_btn-re),ease-out,ease-out,ease-out]',
    'active:duration-[var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd),var(--_btn-pd)]',
    'active:ease-[var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe),var(--_btn-pe)]',
    'hover:bg-[color-mix(in_oklch,var(--_btn-fill),var(--rad-button-state-color,var(--_btn-hover-state))_var(--rad-button-hover-layer,5%))]',
    'not-disabled:not-aria-busy:motion-safe:hover:translate-y-[var(--rad-button-hover-lift,var(--rad-motion-hover-lift,0px))]',
    'active:bg-[color-mix(in_oklch,var(--_btn-fill),var(--rad-button-state-color,var(--_btn-press-state))_var(--rad-button-press-layer,8%))]',
    'disabled:bg-(--_btn-fill) aria-busy:bg-(--_btn-fill)',
    // A theme's selected role restyles pressed toggles and current pages; unset, each keeps its variant.
    'aria-pressed:[--_btn-selected-bg:var(--rad-control-selected-background)] aria-pressed:[--_btn-selected-fg:var(--rad-control-selected-foreground)] aria-pressed:[--_btn-selected-edge:var(--rad-control-selected-border-color)] aria-pressed:[--_btn-selected-shadow:var(--rad-control-selected-shadow)]',
    'aria-[current=page]:[--_btn-selected-bg:var(--rad-control-selected-background)] aria-[current=page]:[--_btn-selected-fg:var(--rad-control-selected-foreground)] aria-[current=page]:[--_btn-selected-edge:var(--rad-control-selected-border-color)] aria-[current=page]:[--_btn-selected-shadow:var(--rad-control-selected-shadow)]',
    'aria-[current=true]:[--_btn-selected-bg:var(--rad-control-selected-background)] aria-[current=true]:[--_btn-selected-fg:var(--rad-control-selected-foreground)] aria-[current=true]:[--_btn-selected-edge:var(--rad-control-selected-border-color)] aria-[current=true]:[--_btn-selected-shadow:var(--rad-control-selected-shadow)]',
    'not-disabled:not-aria-busy:motion-safe:active:scale-[var(--rad-button-press-scale,var(--rad-motion-press-scale,0.97))] not-disabled:not-aria-busy:motion-safe:active:translate-y-[var(--rad-button-press-shift,var(--rad-motion-press-shift-y,0px))] not-disabled:not-aria-busy:motion-safe:active:translate-x-[var(--rad-button-press-shift-x,var(--rad-motion-press-shift-x,0px))]',
    'not-disabled:not-aria-busy:active:rounded-(--_btn-radius-pressed) not-disabled:not-aria-busy:active:[corner-shape:var(--rad-button-corner-shape-pressed,var(--rad-control-action-corner-shape-pressed,var(--_btn-corner)))]',
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
        solid:
          '[--_btn-bg:var(--_action-color)] [--_btn-edge:var(--rad-control-action-border-color,color-mix(in_oklch,var(--_btn-bg),black_16%))] [--_btn-fg:var(--_action-on-color)] [--_btn-hover-state:var(--_action-solid-state)] [--_btn-press-state:black] [--_btn-sheen:var(--rad-button-sheen,var(--rad-control-action-sheen,0))] [--_btn-highlight:var(--rad-button-highlight,var(--rad-control-action-highlight,0))] [--_btn-shadow:var(--rad-button-shadow,var(--rad-control-action-shadow,0_1px_2px_0_rgb(0_0_0/0.06))),0_10px_26px_-10px_color-mix(in_oklch,var(--_btn-bg)_var(--_btn-glow),transparent)] [--_btn-shadow-pressed:var(--rad-button-shadow-pressed,var(--rad-control-action-shadow-pressed,0_1px_2px_0_rgb(0_0_0/0.06)))]',
        soft: '[--_btn-bg:var(--_action-soft)] [--_btn-edge:var(--rad-control-action-border-color,var(--_action-edge))] [--_btn-fg:var(--_action-ink)] [--_btn-hover-state:var(--_btn-fg)] [--_btn-press-state:var(--_btn-fg)] [--_btn-sheen:var(--rad-button-sheen,var(--rad-control-action-sheen,0))] [--_btn-highlight:var(--rad-button-highlight,var(--rad-control-action-highlight,0))] [--_btn-shadow:var(--rad-button-shadow,var(--rad-control-action-shadow,0_1px_2px_0_rgb(0_0_0/0.06)))] [--_btn-shadow-pressed:var(--rad-button-shadow-pressed,var(--rad-control-action-shadow-pressed,0_1px_2px_0_rgb(0_0_0/0.06)))]',
        outline:
          '[--_btn-bg:var(--rad-color-surface,oklch(1_0_0))] [--_btn-edge:var(--rad-control-action-border-color,var(--_action-edge))] [--_btn-fg:var(--_action-ink)] [--_btn-hover-state:var(--_btn-fg)] [--_btn-press-state:var(--_btn-fg)] [--_btn-sheen:var(--rad-button-sheen,var(--rad-control-action-sheen,0))] [--_btn-highlight:var(--rad-button-highlight,var(--rad-control-action-highlight,0))] [--_btn-shadow:var(--rad-button-shadow,var(--rad-control-action-shadow,0_1px_2px_0_rgb(0_0_0/0.06)))] [--_btn-shadow-pressed:var(--rad-button-shadow-pressed,var(--rad-control-action-shadow-pressed,0_1px_2px_0_rgb(0_0_0/0.06)))]',
        ghost:
          '[--_btn-bg:transparent] [--_btn-edge:transparent] [--_btn-fg:var(--_action-ink)] [--_btn-hover-state:var(--_btn-fg)] [--_btn-press-state:var(--_btn-fg)] [--_btn-sheen:var(--rad-button-sheen,var(--rad-control-action-sheen,0))] [--_btn-highlight:var(--rad-button-highlight,var(--rad-control-action-highlight,0))] [--_btn-shadow:var(--rad-button-ghost-shadow,0_0_#0000)] [--_btn-shadow-pressed:var(--rad-button-ghost-shadow-pressed,0_0_#0000)]'
      },
      tone: tones,
      controlSize: {
        small:
          '[--_btn-h:var(--rad-button-height-small,var(--rad-control-small-height,2rem))] [--_btn-px:var(--rad-button-padding-small,var(--rad-control-small-padding-inline,0.75rem))] [--_btn-fs:var(--rad-button-font-size-small,var(--rad-control-small-font-size,0.8125rem))] [&_svg]:size-3.5',
        medium:
          '[--_btn-h:var(--rad-button-height,var(--rad-control-medium-height,2.5rem))] [--_btn-px:var(--rad-button-padding,var(--rad-control-medium-padding-inline,1rem))] [--_btn-fs:var(--rad-button-font-size,var(--rad-control-medium-font-size,0.875rem))] [&_svg]:size-4',
        large:
          '[--_btn-h:var(--rad-button-height-large,var(--rad-control-large-height,3rem))] [--_btn-px:var(--rad-button-padding-large,var(--rad-control-large-padding-inline,1.375rem))] [--_btn-fs:var(--rad-button-font-size-large,var(--rad-control-large-font-size,0.9375rem))] [&_svg]:size-[1.125rem]'
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
      variant: 'solid',
      tone: 'accent',
      controlSize: 'medium',
      iconOnly: false,
      fullWidth: false
    }
  }
)
