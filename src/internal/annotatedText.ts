/** One of the eight categorical series colors. */
export type AnnotatedTextSeries = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type AnnotatedTextToken = {
  text: string
  /** Labels stacked below the token, in order, such as a gloss and a reading. */
  labels?: readonly string[]
}

/** Tokens `start` to `end`, both included and zero-based. */
export type AnnotatedTextSpan = {
  start: number
  end: number
  label: string
  series: AnnotatedTextSeries
}

/** A link from one token to another, drawn above the text with an arrowhead at `to`. */
export type AnnotatedTextArc = {
  from: number
  to: number
  label?: string
  series?: AnnotatedTextSeries
}

const isIndex = (value: unknown, count: number) =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) < count
const isSeries = (value: unknown) =>
  Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 8

/** Throws a TypeError naming the first token, span or arc outside the contract. */
export function validateAnnotatedText(
  tokens: readonly AnnotatedTextToken[],
  spans: readonly AnnotatedTextSpan[],
  arcs: readonly AnnotatedTextArc[]
) {
  if (!tokens.length) throw new TypeError('AnnotatedText needs at least one token.')
  tokens.forEach((token, index) => {
    if (typeof token?.text !== 'string' || !token.text.trim())
      throw new TypeError(`AnnotatedText token ${index} needs nonempty text.`)
    if (
      token.labels !== undefined &&
      (!Array.isArray(token.labels) || !token.labels.every(label => typeof label === 'string'))
    )
      throw new TypeError(`AnnotatedText token ${index} labels must be strings.`)
  })
  spans.forEach((span, index) => {
    if (!isIndex(span.start, tokens.length) || !isIndex(span.end, tokens.length))
      throw new TypeError(`AnnotatedText span ${index} must start and end on a token index.`)
    if (span.start > span.end)
      throw new TypeError(`AnnotatedText span ${index} must not end before it starts.`)
    if (typeof span.label !== 'string' || !span.label.trim())
      throw new TypeError(`AnnotatedText span ${index} needs a nonempty label.`)
    if (!isSeries(span.series))
      throw new TypeError(`AnnotatedText span ${index} series must be from 1 to 8.`)
  })
  arcs.forEach((arc, index) => {
    if (!isIndex(arc.from, tokens.length) || !isIndex(arc.to, tokens.length))
      throw new TypeError(`AnnotatedText arc ${index} must connect token indexes.`)
    if (arc.from === arc.to)
      throw new TypeError(`AnnotatedText arc ${index} must connect two different tokens.`)
    if (arc.series !== undefined && !isSeries(arc.series))
      throw new TypeError(`AnnotatedText arc ${index} series must be from 1 to 8.`)
  })
}

/**
 * Gives each interval the lowest row not taken by an overlapping one, shortest first, so a
 * nested interval sits nearer the text than the one around it. `touching` treats intervals
 * that only share an end as overlapping.
 */
function assignRows(intervals: readonly (readonly [number, number])[], touching: boolean) {
  const order = intervals
    .map(([start, end], index) => ({ start, end, index }))
    .sort((a, b) => a.end - a.start - (b.end - b.start) || a.start - b.start || a.index - b.index)
  const rows: { start: number; end: number }[][] = []
  const result: number[] = Array.from({ length: intervals.length }, () => 0)
  for (const interval of order) {
    const overlaps = (other: { start: number; end: number }) =>
      touching
        ? interval.start <= other.end && other.start <= interval.end
        : interval.start < other.end && other.start < interval.end
    // A row below an overlapping one is not enough for arcs: they must clear what they span.
    let row = 0
    if (touching) {
      while (rows[row]?.some(overlaps)) row++
    } else {
      for (let r = 0; r < rows.length; r++) if (rows[r]!.some(overlaps)) row = r + 1
    }
    ;(rows[row] ??= []).push(interval)
    result[interval.index] = row
  }
  return result
}

/** Zero-based lane of each span: overlapping spans never share one, nested spans sit inside. */
export const spanLanes = (spans: readonly AnnotatedTextSpan[]) =>
  assignRows(
    spans.map(span => [span.start, span.end] as const),
    true
  )

/** One-based height level of each arc: an arc clears every arc it overlaps or encloses. */
export const arcLevels = (arcs: readonly AnnotatedTextArc[]) =>
  assignRows(
    arcs.map(arc => [Math.min(arc.from, arc.to), Math.max(arc.from, arc.to)] as const),
    false
  ).map(row => row + 1)

/** The text an arc announces on both of its tokens. */
export type AnnotatedTextArcText = (arc: { from: string; to: string; label?: string }) => string

/**
 * Default arc text: the two token texts joined by a `→` symbol, then the label. Screen readers
 * read the symbol in the user's language.
 */
export const defaultArcText: AnnotatedTextArcText = ({ from, to, label }) =>
  label ? `${from} → ${to}: ${label}` : `${from} → ${to}`

/** What a token announces after its text: its labels, the spans it belongs to, and its arcs. */
export function describeToken(
  index: number,
  tokens: readonly AnnotatedTextToken[],
  spans: readonly AnnotatedTextSpan[],
  arcs: readonly AnnotatedTextArc[],
  arcText: AnnotatedTextArcText = defaultArcText
) {
  const parts: string[] = []
  const labels = (tokens[index]!.labels ?? []).map(label => label.trim()).filter(Boolean)
  if (labels.length) parts.push(labels.join(', '))
  for (const span of spans)
    if (span.start <= index && index <= span.end) parts.push(span.label.trim())
  for (const arc of arcs) {
    if (arc.from !== index && arc.to !== index) continue
    const label = arc.label?.trim()
    parts.push(
      arcText({
        from: tokens[arc.from]!.text,
        to: tokens[arc.to]!.text,
        ...(label ? { label } : {})
      })
    )
  }
  return parts.filter(part => part.trim()).join('. ')
}

/** A token's text box, relative to the arc layer. */
export type TokenBox = { left: number; top: number; width: number }

export type ArcGeometry = {
  /** One path for an arc within a line; two when the arc crosses a wrap. */
  paths: string[]
  arrow: string
  label: { x: number; y: number } | null
}

/**
 * Draws each arc from the measured token boxes. Tokens whose tops match share a line. An arc
 * between lines leaves the earlier token toward the line end and enters the later token from
 * the start of the later token's line, both in reading direction. An arc whose ends are three
 * or more lines apart draws only those two end pieces, nothing on the lines between.
 */
export function layoutArcs(
  arcs: readonly AnnotatedTextArc[],
  boxes: readonly TokenBox[],
  frame: { start: number; end: number; step: number }
): ArcGeometry[] {
  const levels = arcLevels(arcs)
  const sameLine = (a: number, b: number) => Math.abs(boxes[a]!.top - boxes[b]!.top) < 2
  const edgeFor = (arc: AnnotatedTextArc, end: 'from' | 'to') => {
    const self = arc[end],
      other = end === 'from' ? arc.to : arc.from
    if (sameLine(self, other)) return null
    return self < other ? frame.end : frame.start
  }
  // Ends meeting one token spread across its text so no arc rises through a lower arc's top:
  // ends going left come first with the lowest arc leftmost, then ends going right with the
  // highest arc first and the lowest rightmost.
  const anchors = new Map<string, number>()
  const byToken = new Map<number, { key: string; toward: number; level: number }[]>()
  arcs.forEach((arc, index) => {
    for (const end of ['from', 'to'] as const) {
      const other = end === 'from' ? arc.to : arc.from
      const box = boxes[other]!
      const toward = edgeFor(arc, end) ?? box.left + box.width / 2
      const list = byToken.get(arc[end]) ?? []
      list.push({ key: `${index}:${end}`, toward, level: levels[index]! })
      byToken.set(arc[end], list)
    }
  })
  for (const [token, ends] of byToken) {
    const box = boxes[token]!
    const center = box.left + box.width / 2
    const rank = (end: { toward: number; level: number }) =>
      end.toward < center ? end.level : Number.MAX_SAFE_INTEGER / 2 - end.level
    ends.sort((a, b) => rank(a) - rank(b) || a.toward - b.toward)
    ends.forEach((end, order) =>
      anchors.set(end.key, box.left + (box.width * (order + 1)) / (ends.length + 1))
    )
  }
  return arcs.map((arc, index) => {
    const level = levels[index]!
    const fromX = anchors.get(`${index}:from`)!,
      toX = anchors.get(`${index}:to`)!
    const fromY = boxes[arc.from]!.top - 1,
      toY = boxes[arc.to]!.top - 1
    const rise = (level - 0.5) * frame.step
    const arrow = `M${toX - 3.5} ${toY - 6}L${toX + 3.5} ${toY - 6}L${toX} ${toY}Z`
    if (sameLine(arc.from, arc.to)) {
      const apex = fromY - rise
      return {
        paths: [bracket(fromX, toX, fromY, apex)],
        arrow,
        label: { x: (fromX + toX) / 2, y: apex }
      }
    }
    const pieces = (['from', 'to'] as const).map(end => {
      const x = end === 'from' ? fromX : toX,
        y = end === 'from' ? fromY : toY
      const edge = edgeFor(arc, end)!
      return { x, y, edge, apex: y - rise }
    })
    const longer = pieces.reduce((a, b) =>
      Math.abs(b.edge - b.x) > Math.abs(a.edge - a.x) ? b : a
    )
    return {
      paths: pieces.map(piece => hook(piece.x, piece.y, piece.apex, piece.edge)),
      arrow,
      label: { x: (longer.x + longer.edge) / 2, y: longer.apex }
    }
  })
}

const round = (value: number) => Math.round(value * 10) / 10

/** Up from one end, across at the apex, and down to the other end. */
function bracket(x1: number, x2: number, y: number, apex: number) {
  const sign = x2 >= x1 ? 1 : -1
  const r = Math.min(6, Math.abs(x2 - x1) / 2, y - apex)
  return [
    `M${round(x1)} ${round(y)}`,
    `V${round(apex + r)}`,
    `Q${round(x1)} ${round(apex)} ${round(x1 + sign * r)} ${round(apex)}`,
    `H${round(x2 - sign * r)}`,
    `Q${round(x2)} ${round(apex)} ${round(x2)} ${round(apex + r)}`,
    `V${round(y)}`
  ].join('')
}

/** Up from a token and across to a line edge. */
function hook(x: number, y: number, apex: number, edge: number) {
  const sign = edge >= x ? 1 : -1
  const r = Math.min(6, Math.abs(edge - x), y - apex)
  return [
    `M${round(x)} ${round(y)}`,
    `V${round(apex + r)}`,
    `Q${round(x)} ${round(apex)} ${round(x + sign * r)} ${round(apex)}`,
    `H${round(edge)}`
  ].join('')
}
