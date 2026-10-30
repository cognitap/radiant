export type AccessibleName =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string }

/** Named composite hosts have the same explicit ownership in every family. */
export function requireAccessibleName(
  family: string,
  attributes: { 'aria-label'?: string; 'aria-labelledby'?: string }
) {
  if (!attributes['aria-label']?.trim() && !attributes['aria-labelledby']?.trim())
    throw new TypeError(`${family} requires aria-label or aria-labelledby.`)
}
