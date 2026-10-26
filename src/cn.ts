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
      'font-family': roleClasses('font', 'family'),
      'font-weight': roleClasses('font', 'weight'),
      'font-size': [...roleClasses('text', 'size'), ...roleClasses('text', 'fluid-size')],
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
