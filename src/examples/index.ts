import { defaultTheme } from '../themes/default.js'
import type { Theme, ThemeDefinition } from '../themes/types.js'
import { freezeTree } from '../themes/tokens.js'
import { radiant, radiantDefinition } from './radiant.js'
import { soft, softDefinition } from './soft-squircle.js'
import { expressive, expressiveDefinition } from './expressive.js'
import { glass, glassDefinition } from './glass.js'
import { sharp, sharpDefinition } from './sharp-3d.js'
import { jelly, jellyDefinition } from './jelly.js'
import { ticket, ticketDefinition } from './ticket.js'

export { radiant, soft, expressive, glass, sharp, jelly, ticket }

export const themes: readonly Theme[] = Object.freeze([
  radiant,
  defaultTheme,
  soft,
  expressive,
  glass,
  sharp,
  jelly,
  ticket
])

/** The source of each theme in `themes`, in the same order, for editors that start from one. */
export const themeDefinitions: readonly ThemeDefinition[] = freezeTree([
  radiantDefinition,
  { id: defaultTheme.id, name: defaultTheme.name },
  softDefinition,
  expressiveDefinition,
  glassDefinition,
  sharpDefinition,
  jellyDefinition,
  ticketDefinition
])
