import {
  generateTypography,
  compileThemeDocument,
  defineThemeDocument,
  updateThemeDocument,
  type TypographyInput,
  type TypographyRole
} from '@cognitap/radiant'
import { generateTypography as pure, typographyPresets } from '@cognitap/radiant/typography'
const input: TypographyInput = {
  preset: 'source-serif',
  fonts: { headings: { family: 'Brand Heading' } },
  styles: { 'prose-title': { weight: 650, wide: 64 } }
}
const role: TypographyRole = 'prose-title'
const generated = pure(input)
const d = defineThemeDocument({
  kind: 'radiant-theme',
  version: 1,
  id: 'typed',
  name: 'Typed',
  sections: { typography: { typesetting: input, values: { roles: { [role]: { weight: 700 } } } } }
})
compileThemeDocument(updateThemeDocument(d, { typography: { typesetting: { ui: { size: 18 } } } }))
generateTypography(generated.input)
// @ts-expect-error Preset assignments are immutable, as is their runtime registry.
typographyPresets.inter.fonts.body = { ...typographyPresets.inter.fonts.body }
// @ts-expect-error Roles are closed.
generateTypography({ styles: { headline: { weight: 700 } } })
// @ts-expect-error Size inputs are numeric reference pixels, not arbitrary CSS.
generateTypography({ prose: { size: '20px' } })
// @ts-expect-error Only confirmed profiles can claim a studied starting point.
generateTypography({ fonts: { body: { family: 'Other', profile: 'ai' } } })
// @ts-expect-error Output is deeply readonly.
generated.tokens.roles['prose-body'].size = '2rem'
// @ts-expect-error Token lengths stay CSS strings.
updateThemeDocument(d, { typography: { values: { roles: { 'prose-title': { size: 64 } } } } })
