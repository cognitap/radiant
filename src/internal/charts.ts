export type ChartDatum = {
  key: string
  label: string
  values: Readonly<Record<string, number | null>>
}
export type ChartSeries = { key: string; label: string }
export type ChartKind = 'line' | 'bar' | 'area' | 'pie'
export type ChartMark = {
  row: number
  series: number
  value: number
  x: number
  y: number
  path?: string
  width?: number
  height?: number
  top?: number
}
export function validateChart(
  data: readonly ChartDatum[],
  series: readonly ChartSeries[],
  pie = false
) {
  for (const [name, values] of [
    ['data', data],
    ['series', series]
  ] as const) {
    const keys = values.map(item => item.key)
    if (
      keys.some(key => !key.trim()) ||
      new Set(keys).size !== keys.length ||
      values.some(item => !item.label.trim())
    )
      throw new TypeError(`Chart ${name} needs unique nonempty keys and nonempty labels.`)
  }
  if (!series.length || series.length > 6 || (pie && series.length !== 1))
    throw new TypeError(pie ? 'PieChart needs one series.' : 'Charts need one to six series.')
  for (const row of data)
    for (const item of series) {
      const value = row.values[item.key]
      if (value != null && (!Number.isFinite(value) || (pie && value < 0)))
        throw new TypeError('Chart values must be finite; pie values must also be nonnegative.')
    }
}
const point = (x: number, y: number) => `${Number(x.toFixed(4))} ${Number(y.toFixed(4))}`
export function chartGeometry(
  kind: ChartKind,
  data: readonly ChartDatum[],
  series: readonly ChartSeries[],
  viewport?: { width: number; height: number } | null
) {
  validateChart(data, series, kind === 'pie')
  const width = Math.max(480, data.length * 72, viewport?.width ?? 0),
    height = Math.max(160, viewport?.height ?? 320),
    left = 48,
    right = 24,
    top = 24,
    bottom = 44,
    innerWidth = width - left - right,
    innerHeight = height - top - bottom
  const marks: ChartMark[] = [],
    paths: { series: number; line: string; area: string }[] = [],
    ticks: { value: number; y: number }[] = []
  if (kind === 'pie') {
    const values = data.map(row => row.values[series[0]!.key] ?? 0),
      magnitude = Math.max(1, ...values),
      total = values.reduce((sum, value) => sum + value / magnitude, 0),
      cx = width / 2,
      cy = (height - bottom) / 2,
      radius = Math.min(width / 2 - 32, (height - bottom) / 2 - 16)
    let start = -Math.PI / 2
    values.forEach((value, row) => {
      if (value <= 0 || total <= 0) return
      const angle = (value / magnitude / total) * Math.PI * 2,
        end = start + angle,
        middle = start + angle / 2,
        coords = (a: number) => point(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius)
      marks.push({
        row,
        series: 0,
        value,
        x: cx + Math.cos(middle) * radius * 0.65,
        y: cy + Math.sin(middle) * radius * 0.65,
        path: `M ${point(cx, cy)} L ${coords(start)} A ${radius} ${radius} 0 0 1 ${coords(middle)} A ${radius} ${radius} 0 0 1 ${coords(end)} Z`
      })
      start = end
    })
    return { width, height, marks, paths, ticks, zero: cy, labels: [] }
  }
  const values = data.flatMap(row => series.flatMap(item => row.values[item.key] ?? [])),
    magnitude = Math.max(1, ...values.map(Math.abs)),
    low = Math.min(0, ...values.map(value => value / magnitude)),
    rawHigh = Math.max(0, ...values.map(value => value / magnitude)),
    high = rawHigh === low ? low + 1 : rawHigh,
    span = high - low
  const y = (value: number) => top + ((high - value / magnitude) / span) * innerHeight,
    zero = y(0),
    step = innerWidth / Math.max(1, data.length)
  for (let i = 0; i < 5; i++) {
    const normalized = low + (span * i) / 4
    ticks.push({ value: normalized * magnitude, y: top + innerHeight - (innerHeight * i) / 4 })
  }
  series.forEach((item, seriesIndex) => {
    let segment: ChartMark[] = []
    const close = () => {
      if (!segment.length) return
      const line = segment
        .map((mark, index) => `${index ? 'L' : 'M'} ${point(mark.x, mark.y)}`)
        .join(' ')
      paths.push({
        series: seriesIndex,
        line,
        area: `${line} L ${point(segment.at(-1)!.x, zero)} L ${point(segment[0]!.x, zero)} Z`
      })
      segment = []
    }
    data.forEach((row, rowIndex) => {
      const value = row.values[item.key]
      if (value == null) {
        close()
        return
      }
      const x = left + step * (rowIndex + 0.5),
        barWidth = (step * 0.75) / series.length,
        barLeft = x - step * 0.375 + seriesIndex * barWidth
      const mark: ChartMark = {
        row: rowIndex,
        series: seriesIndex,
        value,
        x: kind === 'bar' ? barLeft + barWidth / 2 : x,
        y: y(value),
        width: barWidth * 0.9,
        height: Math.abs(y(value) - zero),
        top: Math.min(y(value), zero)
      }
      marks.push(mark)
      segment.push(mark)
    })
    close()
  })
  return {
    width,
    height,
    marks,
    paths,
    ticks,
    zero,
    labels: data.map((row, index) => ({ label: row.label, x: left + step * (index + 0.5) }))
  }
}
