import type { ThemeComponentOverrides, ThemeTokens } from './defineTheme.js'

/** One existing token group, with independently authored mode layers. */
export interface ThemeSection<T> {
  readonly values?: T
  readonly modes?: { readonly light?: T; readonly dark?: T }
}

export type ThemeColorStop = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

export interface ThemeBrandSource {
  /** Unmodified source text. A mapped fallback never replaces this value. */
  readonly value: string
  readonly gamut: 'srgb' | 'display-p3'
  readonly srgbFallback?: string
}

export interface ThemePalette {
  readonly id: string
  readonly name: string
  readonly swatches: readonly {
    readonly stop: ThemeColorStop
    readonly value: string
    readonly srgbFallback?: string
  }[]
}

export interface ThemeColorSection extends ThemeSection<ThemeTokens['color']> {
  readonly brand?: ThemeBrandSource
  /** Defaults to anchored when a brand is present. Generation belongs to the color engine. */
  readonly fidelity?: 'anchored' | 'unanchored'
  readonly palettes?: readonly ThemePalette[]
  /** Optional until generation; references the exact original, never its fallback. */
  readonly anchor?: { readonly paletteId: string; readonly stop: ThemeColorStop }
}

/** Portable descriptors only. The consuming application owns loading and local availability. */
export interface ThemeFontMetadata {
  readonly id: string
  readonly family: string
  readonly source: 'system' | 'catalog' | 'local'
  readonly weights?: readonly number[]
  readonly styles?: readonly ('normal' | 'italic')[]
}

export interface ThemeTypographySection extends ThemeSection<ThemeTokens['typography']> {
  readonly fonts?: readonly ThemeFontMetadata[]
}

/** Token groups are the extension seams for richer typesetting and spring authoring. */
export type ThemeSections = {
  readonly [K in keyof ThemeTokens]?: K extends 'color'
    ? ThemeColorSection
    : K extends 'typography'
      ? ThemeTypographySection
      : ThemeSection<ThemeTokens[K]>
} & {
  readonly components?: ThemeSection<ThemeComponentOverrides>
}
export type ThemeSectionName = keyof ThemeSections

export interface ThemeDocument {
  readonly kind: 'radiant-theme'
  readonly version: 1
  readonly id: string
  readonly name: string
  readonly sections: ThemeSections
}

/** A selective export has no identity and cannot accidentally replace an entire document. */
export interface ThemeSectionExport {
  readonly kind: 'radiant-theme-sections'
  readonly version: 1
  readonly sections: ThemeSections
}
