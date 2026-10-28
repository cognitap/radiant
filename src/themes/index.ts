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
export { defaultTheme } from './default.js'

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
  ThemeMotionSection,
  ThemeTypographySection,
  ThemeFontAxis,
  ThemeFontMetadata
} from './themeDocument.js'
