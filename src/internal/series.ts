/** One of the eight categorical series colors, as every family's `series` prop takes it. */
export type SeriesNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export const isSeriesNumber = (value: unknown): value is SeriesNumber =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 8
