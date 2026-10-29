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
        'font-(--rad-select-font-family)',
        'font-(--rad-textarea-font-family)'
      ],
      'font-weight': [
        ...roleClasses('font', 'weight'),
        'font-(--rad-select-font-weight)',
        'font-(--rad-textarea-font-weight)'
      ],
      'font-size': [
        ...roleClasses('text', 'size'),
        ...roleClasses('text', 'fluid-size'),
        'text-(--rad-select-font-size)',
        'text-(--rad-textarea-font-size)'
      ],
      h: ['h-(--rad-select-height)'],
      'min-h': ['min-h-(--rad-textarea-min-height)'],
      py: ['py-(--rad-textarea-padding-block)'],
      px: ['px-(--rad-select-padding)', 'px-(--rad-textarea-padding)'],
      p: ['p-(--rad-select-content-padding)'],
      rounded: [
        'rounded-(--rad-select-radius)',
        'rounded-(--rad-textarea-radius)',
        'rounded-(--rad-select-content-radius)',
        'rounded-(--rad-select-item-radius)'
      ],
      'border-w': ['border-(--rad-select-border-width)', 'border-(--rad-textarea-border-width)'],
      'border-style': [
        'border-(--rad-select-border-style)',
        'border-(--rad-textarea-border-style)'
      ],
      shadow: [
        'shadow-(--rad-select-shadow)',
        'shadow-(--rad-select-content-shadow)',
        'shadow-(--rad-textarea-shadow)'
      ],
      'corner-shape': [
        '[corner-shape:var(--rad-select-corner-shape)]',
        '[corner-shape:var(--rad-textarea-corner-shape)]'
      ],
      'outline-w': ['outline-(--rad-textarea-focus-width)'],
      'outline-offset': ['outline-offset-(--rad-textarea-focus-offset)'],
      'outline-style': ['outline-(--rad-textarea-focus-style)'],
      'backdrop-filter': ['[backdrop-filter:var(--rad-select-content-backdrop-filter)]'],
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
