import { controlBorderClass } from './controlStyles.js'

export const comboboxInputClass = [
  controlBorderClass,
  'box-border w-full min-w-0 text-start pe-12',
  'h-[var(--rad-combobox-height,var(--_rad-control-height))] px-[var(--rad-combobox-padding,var(--_rad-control-padding))]',
  'font-[family-name:var(--rad-combobox-font-family,var(--rad-typography-roles-ui-body-family,system-ui,sans-serif))] text-[length:var(--rad-combobox-font-size,var(--_rad-control-font-size))] font-[number:var(--rad-combobox-font-weight,var(--rad-typography-roles-ui-body-weight,400))] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)]',
  '[color:var(--rad-combobox-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] bg-[var(--rad-combobox-background,var(--rad-color-surface,white))]',
  '[border-width:var(--rad-combobox-border-width,var(--rad-control-border-width,1px))] [border-style:var(--rad-combobox-border-style,var(--rad-control-border-style,solid))] [border-color:var(--rad-combobox-border-color,var(--_rad-control-border))]',
  'rounded-[var(--rad-combobox-radius,var(--rad-control-radius,0.5rem))] [corner-shape:var(--rad-combobox-corner-shape,var(--rad-control-corner-shape,round))] [box-shadow:var(--rad-combobox-shadow,none)]',
  'focus-visible:outline-solid focus-visible:[outline-color:var(--rad-combobox-focus-color,var(--rad-color-focus))] focus-visible:[outline-width:var(--rad-focus-width,2px)] focus-visible:[outline-offset:var(--rad-focus-offset,2px)]',
  'data-invalid:[border-color:var(--rad-color-invalid)] placeholder:[color:var(--rad-combobox-placeholder,var(--rad-color-placeholder))] disabled:cursor-not-allowed disabled:bg-[var(--rad-color-disabled-background)]',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:disabled:text-[GrayText]'
].join(' ')

export const comboboxContentClass = [
  'fixed right-auto bottom-auto m-0 box-border min-w-0 overflow-hidden overscroll-contain',
  'left-[var(--_rad-combobox-left,0px)] top-[var(--_rad-combobox-top,0px)] w-[var(--_rad-combobox-width,auto)] max-h-[var(--_rad-combobox-max-height,calc(100dvh-1rem))]',
  'p-[var(--rad-combobox-content-padding,0.25rem)] rounded-[var(--rad-combobox-content-radius,var(--rad-surface-radius,0.75rem))]',
  '[border-width:var(--rad-combobox-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-combobox-border-style,var(--rad-surface-border-style,solid))] [border-color:var(--rad-combobox-border-color,var(--rad-color-border))]',
  'bg-[var(--rad-combobox-content-background,var(--rad-color-surface,white))] [color:var(--rad-combobox-color,var(--rad-color-foreground))] [box-shadow:var(--rad-combobox-content-shadow,var(--rad-surface-overlay-shadow,0_8px_32px_#0003))]',
  '[backdrop-filter:var(--rad-combobox-content-backdrop-filter,none)]',
  'font-[family-name:var(--rad-combobox-font-family,var(--rad-typography-roles-ui-body-family,system-ui,sans-serif))] text-[length:var(--rad-combobox-font-size,var(--_rad-control-font-size))] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] font-[number:var(--rad-combobox-font-weight,var(--rad-typography-roles-ui-body-weight,400))]',
  'outline-none forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]'
].join(' ')

export const comboboxItemClass = [
  'relative flex min-w-0 cursor-default select-none items-center gap-2 break-words rounded-[var(--rad-combobox-item-radius,var(--rad-control-radius,0.5rem))]',
  'min-h-[var(--_rad-control-height,2.5rem)] px-[var(--_rad-control-padding,1rem)] py-2 outline-none',
  'data-highlighted:[background:var(--rad-combobox-item-background,var(--rad-color-accent))] data-highlighted:[color:var(--rad-combobox-item-color,var(--rad-color-accent-foreground))]',
  'data-disabled:opacity-[var(--rad-state-disabled-opacity,0.5)] data-disabled:cursor-not-allowed',
  'forced-colors:data-highlighted:bg-[Highlight] forced-colors:data-highlighted:text-[HighlightText] forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100'
].join(' ')

/** An input adornment keeps Button semantics without inheriting action presentation. */
export const comboboxActionClass = [
  'inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 [font:inherit]',
  '[color:var(--rad-combobox-color,var(--rad-color-foreground))] shadow-none cursor-pointer',
  'focus-visible:outline-solid focus-visible:[outline-color:var(--rad-combobox-focus-color,var(--rad-color-focus))] focus-visible:[outline-width:var(--rad-focus-width,2px)] focus-visible:[outline-offset:var(--rad-focus-offset,2px)]',
  'disabled:cursor-not-allowed forced-colors:text-[CanvasText] forced-colors:disabled:text-[GrayText]'
].join(' ')
