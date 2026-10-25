import { cva } from 'class-variance-authority'

// Interactive boundaries need more contrast than passive surface dividers.
// Keep the derivation private so every control follows the same semantic palette.
export const controlBorderClass =
  '[--_rad-control-border:color-mix(in_oklch,var(--rad-color-border,oklch(0.885_0.005_286))_55%,var(--rad-color-foreground,oklch(0.21_0.006_286)))]'
export const controlMetrics = cva('', {
  variants: {
    controlSize: {
      small:
        '[--_rad-control-height:var(--rad-control-small-height,2rem)] [--_rad-control-padding:var(--rad-control-small-padding-inline,0.75rem)] [--_rad-control-font-size:var(--rad-control-small-font-size,0.8125rem)] [--_rad-control-indicator-size:var(--rad-control-small-indicator-size,1rem)]',
      medium:
        '[--_rad-control-height:var(--rad-control-medium-height,2.5rem)] [--_rad-control-padding:var(--rad-control-medium-padding-inline,1rem)] [--_rad-control-font-size:var(--rad-control-medium-font-size,0.875rem)] [--_rad-control-indicator-size:var(--rad-control-medium-indicator-size,1.125rem)]',
      large:
        '[--_rad-control-height:var(--rad-control-large-height,3rem)] [--_rad-control-padding:var(--rad-control-large-padding-inline,1.375rem)] [--_rad-control-font-size:var(--rad-control-large-font-size,0.9375rem)] [--_rad-control-indicator-size:var(--rad-control-large-indicator-size,1.25rem)]'
    }
  },
  defaultVariants: { controlSize: 'medium' }
})
