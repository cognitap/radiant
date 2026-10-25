import { generateColorWall, type ColorWall, type ColorWallInput } from '@cognitap/radiant/color'
import { updateThemeDocument, themeDocumentFromDefinition } from '@cognitap/radiant'
const input: ColorWallInput = { brand: '#7C3AED', vividness: 0.7, neutralHue: -105 }
const wall: ColorWall = generateColorWall(input)
generateColorWall(wall.input)
updateThemeDocument(
  themeDocumentFromDefinition({ id: 'color', name: 'Color' }),
  { color: wall.color },
  'replace'
)
// @ts-expect-error Only sRGB is supported by algorithm version 1.
generateColorWall({ brand: '#7C3AED', gamut: 'display-p3' })
// @ts-expect-error Fidelity never silently adjusts the source.
generateColorWall({ brand: '#7C3AED', fidelity: 'adjusted' })
// @ts-expect-error Inputs contain data, not runtime generators.
generateColorWall({ brand: '#7C3AED', vividness: () => 0.5 })
// @ts-expect-error Known generator version only.
generateColorWall({ brand: '#7C3AED', version: 2 })
// @ts-expect-error Generated color data is deeply readonly.
wall.color.palettes[0].swatches.push({ stop: 500, value: '#ffffff' })

import {
  recommendColorPalette,
  type ColorPalette,
  type ColorPaletteOptions
} from '@cognitap/radiant/color'
const options: ColorPaletteOptions = {
  working: { support: 'teal' },
  modes: { dark: { focus: '#ABCDEF' } }
}
const palette: ColorPalette = recommendColorPalette(wall, options)
updateThemeDocument(themeDocumentFromDefinition({ id: 'palette', name: 'Palette' }), {
  color: palette.color,
  surface: palette.surface
})
// @ts-expect-error Working roles are explicit; family IDs are validated against the wall at runtime.
recommendColorPalette(wall, { working: { extra: 'blue' } })
// @ts-expect-error Only light and dark are authored modes.
recommendColorPalette(wall, { modes: { system: {} } })
// @ts-expect-error Unknown semantic roles fail type checking.
recommendColorPalette(wall, { modes: { light: { activePink: '#ffffff' } } })
// @ts-expect-error Recommendations are deeply readonly.
palette.color.modes.light.accent = '#ffffff'
