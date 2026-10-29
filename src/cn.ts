import { createCn } from 'cn/config'
import type { CnFunction } from 'cn'
import { typographyRoles } from './themes/tokens.js'

// Semantic hooks live in the components layer. For callers using token shorthand
// utilities, register non-color variables explicitly rather than guessing from names.
const roleClasses = (prefix: string, leaf: string) =>
  typographyRoles.map(role => `${prefix}-(--rad-typography-roles-${role}-${leaf})`)
export const cn: CnFunction = createCn({
  extend: {
    classGroups: {
      'font-family': [
        ...roleClasses('font', 'family'),
        'font-(--rad-combobox-font-family)',
        'font-(--rad-select-font-family)',
        'font-(--rad-textarea-font-family)',
        'font-(--rad-tabs-font-family)'
      ],
      'font-weight': [
        'font-(--rad-tooltip-font-weight)',
        ...roleClasses('font', 'weight'),
        'font-(--rad-combobox-font-weight)',
        'font-(--rad-select-font-weight)',
        'font-(--rad-textarea-font-weight)',
        'font-(--rad-tabs-font-weight)'
      ],
      'font-size': [
        'text-(--rad-tooltip-font-size)',
        ...roleClasses('text', 'size'),
        ...roleClasses('text', 'fluid-size'),
        'text-(--rad-combobox-font-size)',
        'text-(--rad-select-font-size)',
        'text-(--rad-textarea-font-size)',
        'text-(--rad-switch-label-size)',
        'text-(--rad-tabs-font-size)'
      ],
      h: [
        'h-(--rad-combobox-height)',
        'h-(--rad-select-height)',
        'h-(--rad-switch-height)',
        'h-(--rad-slider-height)',
        'h-(--rad-slider-length)'
      ],
      w: [
        'w-(--rad-popover-width)',
        'w-(--rad-switch-width)',
        'w-(--rad-slider-height)',
        'w-(--rad-slider-length)'
      ],
      'max-w': ['max-w-(--rad-tooltip-max-width)'],
      size: ['size-(--rad-slider-thumb-size)', 'size-(--rad-slider-track-size)'],
      gap: [
        'gap-(--rad-popover-gap)',
        'gap-(--rad-switch-gap)',
        'gap-(--rad-tabs-gap)',
        'gap-(--rad-tabs-list-gap)'
      ],
      'min-h': ['min-h-(--rad-textarea-min-height)', 'min-h-(--rad-tabs-trigger-height)'],
      py: ['py-(--rad-textarea-padding-block)'],
      px: [
        'px-(--rad-combobox-padding)',
        'px-(--rad-select-padding)',
        'px-(--rad-textarea-padding)',
        'px-(--rad-tabs-trigger-padding)'
      ],
      p: [
        'p-(--rad-tooltip-padding)',
        'p-(--rad-popover-padding)',
        'p-(--rad-combobox-content-padding)',
        'p-(--rad-select-content-padding)',
        'p-(--rad-tabs-list-padding)',
        'p-(--rad-tabs-content-padding)'
      ],
      rounded: [
        'rounded-(--rad-tooltip-radius)',
        'rounded-(--rad-popover-radius)',
        'rounded-(--rad-combobox-radius)',
        'rounded-(--rad-select-radius)',
        'rounded-(--rad-textarea-radius)',
        'rounded-(--rad-switch-radius)',
        'rounded-(--rad-switch-thumb-radius)',
        'rounded-(--rad-combobox-content-radius)',
        'rounded-(--rad-select-content-radius)',
        'rounded-(--rad-combobox-item-radius)',
        'rounded-(--rad-select-item-radius)',
        'rounded-(--rad-slider-track-radius)',
        'rounded-(--rad-slider-thumb-radius)',
        'rounded-(--rad-tabs-list-radius)',
        'rounded-(--rad-tabs-trigger-radius)',
        'rounded-(--rad-tabs-content-radius)'
      ],
      'border-w': [
        'border-(--rad-tooltip-border-width)',
        'border-(--rad-popover-border-width)',
        'border-(--rad-combobox-border-width)',
        'border-(--rad-select-border-width)',
        'border-(--rad-textarea-border-width)',
        'border-(--rad-switch-border-width)',
        'border-(--rad-slider-thumb-border-width)',
        'border-(--rad-tabs-trigger-border-width)'
      ],
      'border-style': [
        'border-(--rad-tooltip-border-style)',
        'border-(--rad-popover-border-style)',
        'border-(--rad-combobox-border-style)',
        'border-(--rad-select-border-style)',
        'border-(--rad-textarea-border-style)',
        'border-(--rad-switch-border-style)'
      ],
      shadow: [
        'shadow-(--rad-tooltip-shadow)',
        'shadow-(--rad-popover-shadow)',
        'shadow-(--rad-combobox-shadow)',
        'shadow-(--rad-select-shadow)',
        'shadow-(--rad-combobox-content-shadow)',
        'shadow-(--rad-select-content-shadow)',
        'shadow-(--rad-textarea-shadow)',
        'shadow-(--rad-slider-thumb-shadow)'
      ],
      'corner-shape': [
        '[corner-shape:var(--rad-popover-corner-shape)]',
        '[corner-shape:var(--rad-combobox-corner-shape)]',
        '[corner-shape:var(--rad-select-corner-shape)]',
        '[corner-shape:var(--rad-textarea-corner-shape)]',
        '[corner-shape:var(--rad-switch-corner-shape)]',
        '[corner-shape:var(--rad-slider-corner-shape)]',
        '[corner-shape:var(--rad-tabs-corner-shape)]'
      ],
      'outline-w': [
        'outline-(--rad-popover-focus-width)',
        'outline-(--rad-textarea-focus-width)',
        'outline-(--rad-switch-focus-width)',
        'outline-(--rad-slider-focus-width)',
        'outline-(--rad-tabs-focus-width)'
      ],
      'outline-offset': [
        'outline-offset-(--rad-popover-focus-offset)',
        'outline-offset-(--rad-textarea-focus-offset)',
        'outline-offset-(--rad-switch-focus-offset)',
        'outline-offset-(--rad-slider-focus-offset)',
        'outline-offset-(--rad-tabs-focus-offset)'
      ],
      'outline-style': [
        'outline-(--rad-popover-focus-style)',
        'outline-(--rad-textarea-focus-style)',
        'outline-(--rad-switch-focus-style)',
        'outline-(--rad-slider-focus-style)',
        'outline-(--rad-tabs-focus-style)'
      ],
      opacity: ['opacity-(--rad-tabs-disabled-opacity)'],
      'backdrop-filter': [
        '[backdrop-filter:var(--rad-popover-backdrop-filter)]',
        '[backdrop-filter:var(--rad-combobox-content-backdrop-filter)]',
        '[backdrop-filter:var(--rad-select-content-backdrop-filter)]'
      ],
      leading: roleClasses('leading', 'line-height'),
      tracking: roleClasses('tracking', 'letter-spacing'),
      'max-inline-size': roleClasses('max-inline', 'measure'),
      mbs: [
        'mbs-(--rad-typography-flow-paragraph)',
        'mbs-(--rad-typography-flow-heading-before)',
        'mbs-(--rad-typography-flow-heading-after)'
      ]
    }
  }
})
