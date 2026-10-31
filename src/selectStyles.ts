import { controlBorderClass } from './controlStyles.js'

export const selectTriggerClass = [
  controlBorderClass,
  'relative box-border flex w-full min-w-0 cursor-pointer select-none items-center justify-between gap-2 text-start',
  '[&>span:first-child]:w-full [&>span:first-child]:min-w-0 [&>span:first-child]:justify-between',
  'h-[var(--rad-select-height,var(--_rad-control-height))] px-[var(--rad-select-padding,var(--_rad-control-padding))]',
  'font-[family-name:var(--rad-select-font-family,var(--rad-typography-roles-ui-body-family,system-ui,sans-serif))] text-[length:var(--rad-select-font-size,var(--_rad-control-font-size))] font-[number:var(--rad-select-font-weight,var(--rad-typography-roles-ui-body-weight,400))] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)]',
  '[color:var(--rad-select-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] bg-[var(--rad-select-background,var(--rad-control-field-background,var(--rad-color-surface,white)))]',
  '[border-width:var(--rad-select-border-width,var(--rad-control-border-width,1px))] [border-style:var(--rad-select-border-style,var(--rad-control-border-style,solid))] [border-color:var(--rad-select-border-color,var(--rad-control-field-border-color,var(--_rad-control-border)))]',
  'rounded-[var(--rad-select-radius,var(--rad-control-radius,0.5rem))] [corner-shape:var(--rad-select-corner-shape,var(--rad-control-corner-shape,round))] [box-shadow:var(--rad-select-shadow,var(--rad-control-field-shadow,none))] [backdrop-filter:var(--rad-control-field-backdrop-filter,none)]',
  'focus-visible:outline-solid focus-visible:[outline-color:var(--rad-select-focus-color,var(--rad-color-focus))] focus-visible:[outline-width:var(--rad-focus-width,2px)] focus-visible:[outline-offset:var(--rad-focus-offset,2px)]',
  'data-invalid:[border-color:var(--rad-color-invalid)] disabled:cursor-not-allowed disabled:bg-[var(--rad-color-disabled-background)]',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:disabled:text-[GrayText]'
].join(' ')

export const selectContentClass = [
  'fixed right-auto bottom-auto m-0 box-border min-w-0 overflow-hidden overscroll-contain',
  'left-[var(--_rad-select-left,0px)] top-[var(--_rad-select-top,0px)] w-[var(--_rad-select-width,auto)] max-h-[var(--_rad-select-max-height,calc(100dvh-1rem))]',
  'p-[var(--rad-select-content-padding,0.25rem)] rounded-[var(--rad-select-content-radius,var(--rad-surface-radius,0.75rem))]',
  '[border-width:var(--rad-select-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-select-border-style,var(--rad-surface-border-style,solid))] [border-color:var(--rad-select-border-color,var(--rad-color-border))]',
  'bg-[var(--rad-select-content-background,var(--rad-color-surface,white))] [color:var(--rad-select-color,var(--rad-color-foreground))] [box-shadow:var(--rad-select-content-shadow,var(--rad-surface-overlay-shadow,0_8px_32px_#0003))]',
  '[backdrop-filter:var(--rad-select-content-backdrop-filter,none)]',
  'font-[family-name:var(--rad-select-font-family,var(--rad-typography-roles-ui-body-family,system-ui,sans-serif))] text-[length:var(--rad-select-font-size,var(--_rad-control-font-size))] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] font-[number:var(--rad-select-font-weight,var(--rad-typography-roles-ui-body-weight,400))]',
  'outline-none forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]'
].join(' ')

export const selectItemClass = [
  'relative flex min-w-0 cursor-default select-none items-center gap-2 break-words rounded-[var(--rad-select-item-radius,var(--rad-control-radius,0.5rem))]',
  'min-h-[var(--_rad-control-height,2.5rem)] px-[var(--_rad-control-padding,1rem)] py-2 outline-none',
  'focus:[background:var(--rad-select-item-background,var(--rad-color-accent))] focus:[color:var(--rad-select-item-color,var(--rad-color-accent-foreground))]',
  'data-disabled:opacity-[var(--rad-state-disabled-opacity,0.5)] data-disabled:cursor-not-allowed',
  'forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText] forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100'
].join(' ')
