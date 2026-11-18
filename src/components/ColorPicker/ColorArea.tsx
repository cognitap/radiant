'use client'

import { useLayoutEffect, useRef, type PointerEvent } from 'react'
import { cn } from 'cn'
import { clamp, srgbMapper } from '../../color/oklch.js'
import { formatColor, type ColorChannels } from '../../color/colorValue.js'
import type { PartStyle } from '../../presentation.js'

const width = 56
const height = 48

/** The pointer area and the two keyboard sliders share the same color channels. */
export function ColorArea({
  color,
  maxChroma,
  disabled,
  part,
  onChange
}: {
  color: ColorChannels
  maxChroma: number
  disabled?: boolean
  part?: PartStyle
  onChange(color: ColorChannels): void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const hue = color.h
  useLayoutEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context) return
    const pixels = context.createImageData(width, height)
    const mapper = srgbMapper()
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const hex = mapper.map(1 - y / (height - 1), (x / (width - 1)) * maxChroma, hue).value
        const offset = (y * width + x) * 4
        pixels.data[offset] = parseInt(hex.slice(1, 3), 16)
        pixels.data[offset + 1] = parseInt(hex.slice(3, 5), 16)
        pixels.data[offset + 2] = parseInt(hex.slice(5, 7), 16)
        pixels.data[offset + 3] = 255
      }
    }
    context.putImageData(pixels, 0, 0)
  }, [hue, maxChroma])

  function pick(event: PointerEvent<HTMLDivElement>) {
    const node = event.currentTarget
    const { left, top, width, height } = node.getBoundingClientRect()
    if (!width || !height || disabled || node.closest('fieldset:disabled')) return
    const rtl = node.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl'
    const x = clamp((event.clientX - left) / width)
    const y = clamp((event.clientY - top) / height)
    onChange({ ...color, L: 1 - y, C: (rtl ? 1 - x : x) * maxChroma })
  }

  return (
    <div
      aria-hidden="true"
      data-slot="color-picker-area"
      className={cn(
        'relative isolate h-36 overflow-hidden rounded-[var(--rad-control-radius,0.5rem)] [corner-shape:var(--rad-control-corner-shape,round)]',
        disabled ? 'cursor-not-allowed' : 'touch-none cursor-crosshair',
        part?.className
      )}
      style={part?.style}
      onPointerDown={event => {
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          disabled ||
          event.currentTarget.closest('fieldset:disabled')
        )
          return
        event.currentTarget.setPointerCapture(event.pointerId)
        pick(event)
      }}
      onPointerMove={event => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) pick(event)
      }}
    >
      <canvas
        ref={canvas}
        width={width}
        height={height}
        className="absolute inset-0 size-full rtl:-scale-x-100"
      />
      <span
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_black] rtl:translate-x-1/2"
        data-slot="color-picker-marker"
        style={{
          insetInlineStart: `${(color.C / maxChroma) * 100}%`,
          top: `${(1 - color.L) * 100}%`,
          background: formatColor({ ...color, alpha: 1 }, 'oklch')
        }}
      />
    </div>
  )
}
