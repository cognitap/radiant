import { isSeriesNumber } from './series.js'

/** A `viewBox` in the content's own coordinates. */
export type RegionStageBox = { x: number; y: number; width: number; height: number }

/** Zoom factor and offset in viewBox units: content maps through `translate(x y) scale(zoom)`. */
export type RegionStageView = { zoom: number; x: number; y: number }

export const initialView: RegionStageView = { zoom: 1, x: 0, y: 0 }

/** Parses a `viewBox` string of four numbers with a positive width and height. */
export function parseViewBox(value: string): RegionStageBox {
  const parts =
    typeof value === 'string'
      ? value
          .trim()
          .split(/[\s,]+/)
          .map(Number)
      : []
  const [x, y, width, height] = parts
  if (parts.length !== 4 || !parts.every(Number.isFinite) || !(width! > 0) || !(height! > 0))
    throw new TypeError(
      'RegionStageViewport requires a viewBox of four numbers with a positive width and height.'
    )
  return { x: x!, y: y!, width: width!, height: height! }
}

export function validateMaxZoom(maxZoom: number) {
  if (!Number.isFinite(maxZoom) || maxZoom < 1)
    throw new TypeError('RegionStage maxZoom must be a finite number of at least 1.')
}

export function validateSeries(series: unknown) {
  if (series !== undefined && !isSeriesNumber(series))
    throw new TypeError('RegionStageRegion series must be an integer from 1 to 8.')
}

/** Keeps zoom within 1 to `maxZoom` and the content covering the whole viewBox. */
export function clampView(
  view: RegionStageView,
  box: RegionStageBox,
  maxZoom: number
): RegionStageView {
  const zoom = Math.min(maxZoom, Math.max(1, view.zoom))
  const clamp = (value: number, origin: number, size: number) =>
    Math.min(-origin * (zoom - 1), Math.max(-origin * (zoom - 1) - size * (zoom - 1), value))
  // Adding zero turns -0 into 0.
  return { zoom, x: clamp(view.x, box.x, box.width) + 0, y: clamp(view.y, box.y, box.height) + 0 }
}

/** Scales by `factor` around `point`, in viewBox units, so the content under it stays put. */
export function zoomAt(
  view: RegionStageView,
  factor: number,
  point: { x: number; y: number },
  box: RegionStageBox,
  maxZoom: number
): RegionStageView {
  const zoom = Math.min(maxZoom, Math.max(1, view.zoom * factor))
  const ratio = zoom / view.zoom
  return clampView(
    { zoom, x: point.x - (point.x - view.x) * ratio, y: point.y - (point.y - view.y) * ratio },
    box,
    maxZoom
  )
}

/** Moves the content by `dx` and `dy` viewBox units. */
export function panBy(
  view: RegionStageView,
  dx: number,
  dy: number,
  box: RegionStageBox,
  maxZoom: number
): RegionStageView {
  return clampView({ ...view, x: view.x + dx, y: view.y + dy }, box, maxZoom)
}

export const center = (box: RegionStageBox) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2
})

/** The view that keeps zoom and centers `target` (content units) when part of it is out of view. */
export function revealBox(
  view: RegionStageView,
  target: RegionStageBox,
  box: RegionStageBox,
  maxZoom: number
): RegionStageView {
  const left = target.x * view.zoom + view.x,
    top = target.y * view.zoom + view.y
  const right = left + target.width * view.zoom,
    bottom = top + target.height * view.zoom
  if (left >= box.x && top >= box.y && right <= box.x + box.width && bottom <= box.y + box.height)
    return view
  const middle = center(box)
  return clampView(
    {
      zoom: view.zoom,
      x: middle.x - (target.x + target.width / 2) * view.zoom,
      y: middle.y - (target.y + target.height / 2) * view.zoom
    },
    box,
    maxZoom
  )
}

export const sameView = (a: RegionStageView, b: RegionStageView) =>
  Math.abs(a.zoom - b.zoom) < 1e-6 && Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6

/** Eases from `from` to `to`; `progress` runs from 0 to 1. */
export function blendView(from: RegionStageView, to: RegionStageView, progress: number) {
  const t = 1 - (1 - progress) ** 3
  return {
    zoom: from.zoom + (to.zoom - from.zoom) * t,
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t
  }
}

export const viewTransform = (view: RegionStageView) =>
  `translate(${round(view.x)} ${round(view.y)}) scale(${round(view.zoom)})`

const round = (value: number) => Math.round(value * 1e4) / 1e4
