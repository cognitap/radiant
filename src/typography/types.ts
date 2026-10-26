/** Stable text styles; presentation is independent of the element's HTML semantics. */
export type TypographyRole =
  | 'prose-title'
  | 'prose-heading'
  | 'prose-subheading'
  | 'prose-body'
  | 'prose-lead'
  | 'prose-small'
  | 'prose-quote'
  | 'ui-title'
  | 'ui-body'
  | 'ui-label'
  | 'ui-supporting'
  | 'ui-caption'
  | 'ui-metric'
  | 'ui-eyebrow'
  | 'display'
  | 'code'

export type TypographyAssignment = 'body' | 'headings' | 'ui' | 'code'
export type TypographyProfile = 'inter' | 'source-serif-4' | 'plex-sans' | 'plex-mono' | 'manual'
export type TypographyPreset = 'inter' | 'source-serif' | 'plex'

export interface TypographyFont {
  /** CSS font-family list; choosing it never loads a font. */
  readonly family: string
  /** Explicit provenance of a studied font. Omitted for an unfamiliar/manual font. */
  readonly profile?: TypographyProfile
}
export interface TypographyProseRhythm {
  /** Reference pixels at a 16px root, emitted as rem. */
  readonly size: number
  readonly lineHeight: number
  readonly paragraphSpacing: number
  readonly measure: number
  readonly headingScale: number
}
export interface TypographyUIRhythm {
  readonly size: number
  readonly lineHeight: number
}
export interface TypographyStyle {
  readonly assignment: TypographyAssignment
  /** Reference pixels at a 16px root. */
  readonly narrow: number
  readonly wide: number
  readonly weight: number
  readonly lineHeight: number
  /** em; zero is deliberately not the old global negative tracking. */
  readonly tracking: number
  /** ch; zero means the layout owns measure. */
  readonly measure: number
}
export interface TypographyInput {
  readonly preset?: TypographyPreset
  readonly fonts?: Readonly<Partial<Record<TypographyAssignment, TypographyFont>>>
  /** Only manual settings belong here; omission keeps a profile-derived default live. */
  readonly prose?: Partial<TypographyProseRhythm>
  readonly ui?: Partial<TypographyUIRhythm>
  readonly styles?: Readonly<Partial<Record<TypographyRole, Partial<TypographyStyle>>>>
}
export interface TypographyRoleTokens {
  readonly family: string
  readonly size: string
  readonly fluidSize: string
  readonly weight: number | string
  readonly lineHeight: string
  readonly letterSpacing: string
  readonly measure: string
}
export interface TypographyTokens {
  readonly roles: Readonly<Record<TypographyRole, TypographyRoleTokens>>
  readonly flow: {
    readonly paragraph: string
    readonly headingBefore: string
    readonly headingAfter: string
  }
}
export interface TypographyResult {
  /** Replayable input retains manual/automatic ownership rather than pinning computed defaults. */
  readonly input: TypographyInput
  readonly prose: TypographyProseRhythm
  readonly ui: TypographyUIRhythm
  readonly styles: Readonly<Record<TypographyRole, TypographyStyle>>
  readonly tokens: TypographyTokens
  readonly recommendations: { readonly body: boolean; readonly ui: boolean }
  readonly warnings: readonly {
    readonly role: TypographyRole
    readonly requestedWeight: number
    readonly supportedWeights: readonly [number, number]
  }[]
}
