export type Axis = { readonly name: string; readonly values: readonly unknown[] }
export type Combination = Readonly<Record<string, unknown>>

/**
 * Deterministic greedy all-pairs reduction: every value of every axis meets every value of every
 * other axis in at least one combination. One axis yields each value once; none yields `{}`.
 */
export function allPairs(axes: readonly Axis[]): Combination[] {
  if (axes.length === 0) return [{}]
  if (axes.length === 1) return axes[0]!.values.map(value => ({ [axes[0]!.name]: value }))

  const key = (a: number, i: number, b: number, j: number) => `${a}:${i}|${b}:${j}`
  const uncovered = new Set<string>()
  for (let a = 0; a < axes.length; a++)
    for (let b = a + 1; b < axes.length; b++)
      for (let i = 0; i < axes[a]!.values.length; i++)
        for (let j = 0; j < axes[b]!.values.length; j++) uncovered.add(key(a, i, b, j))

  const rows: number[][] = []
  while (uncovered.size > 0) {
    // Seed the row with the first uncovered pair, then fill each other axis with the value that
    // covers the most remaining pairs against the axes chosen so far.
    const [first] = uncovered
    const [[a, i], [b, j]] = first!.split('|').map(part => part.split(':').map(Number)) as [
      [number, number],
      [number, number]
    ]
    const row: number[] = axes.map(() => -1)
    row[a] = i
    row[b] = j
    for (let axis = 0; axis < axes.length; axis++) {
      if (row[axis] !== -1) continue
      let best = 0
      let bestGain = -1
      for (let value = 0; value < axes[axis]!.values.length; value++) {
        let gain = 0
        for (let other = 0; other < axes.length; other++) {
          if (row[other] === -1 || other === axis) continue
          const pair =
            other < axis
              ? key(other, row[other]!, axis, value)
              : key(axis, value, other, row[other]!)
          if (uncovered.has(pair)) gain++
        }
        if (gain > bestGain) [best, bestGain] = [value, gain]
      }
      row[axis] = best
    }
    for (let x = 0; x < axes.length; x++)
      for (let y = x + 1; y < axes.length; y++) uncovered.delete(key(x, row[x]!, y, row[y]!))
    rows.push(row)
  }
  return rows.map(row =>
    Object.fromEntries(axes.map((axis, n) => [axis.name, axis.values[row[n]!]]))
  )
}
