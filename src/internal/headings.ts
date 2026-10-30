/** Native heading semantics shared by presentation families. */
export const headings = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const
export type HeadingLevel = keyof typeof headings
