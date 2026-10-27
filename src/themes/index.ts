import { radiant } from './radiant.js'
import { defaultTheme } from './default.js'
import { soft } from './soft-squircle.js'
import { expressive } from './expressive.js'
import { glass } from './glass.js'
import { sharp } from './sharp-3d.js'
import { jelly } from './jelly.js'
import { ticket } from './ticket.js'
import type { Theme } from './types.js'

export type {
  SharedTokens,
  Theme,
  ThemeComponentOverrides,
  ThemeDefinition,
  ThemeLayer,
  ThemeMode,
  ThemeStyle,
  ThemeTokens
} from './types.js'
export { defineTheme } from './defineTheme.js'
export { updateThemeAppearance } from './updateThemeAppearance.js'
export type { ThemeAppearanceSettings, ThemeGeometrySettings } from './updateThemeAppearance.js'
export { radiant, defaultTheme, soft, expressive, glass, sharp, jelly, ticket }

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

export {
  defineThemeDocument,
  parseThemeDocument,
  compileThemeDocument,
  updateThemeDocument,
  exportThemeSections,
  themeDocumentFromDefinition
} from './themeDocument.js'
export type {
  ThemeDocument,
  ThemeSectionExport,
  ThemeSections,
  ThemeSectionName,
  ThemeSection,
  ThemeColorSection,
  ThemeColorStop,
  ThemeBrandSource,
  ThemePalette,
  ThemeTypographySection,
  ThemeFontAxis,
  ThemeFontMetadata
} from './themeDocument.js'
