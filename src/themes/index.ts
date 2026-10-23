import { radiant, radiantTheme } from './radiant.js'
import { defaultTheme } from './default.js'
import { soft } from './soft-squircle.js'
import { expressive } from './expressive.js'
import { glass } from './glass.js'
import { sharp } from './sharp-3d.js'
import { jelly } from './jelly.js'
import { ticket } from './ticket.js'
import type { Theme } from './types.js'

export type { Theme } from './types.js'
export { radiantTheme }

export const themes: Theme[] = [
  radiant,
  defaultTheme,
  soft,
  expressive,
  glass,
  sharp,
  jelly,
  ticket
]
