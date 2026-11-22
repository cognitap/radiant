import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultTheme } from '../dist/library/index.js'
import { themes } from '../dist/library/examples/index.js'

// Linear sRGB and Oklab: https://bottosson.github.io/posts/oklab/
const toLinear = n => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4)
function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ].map(n => Math.min(1, Math.max(0, n)))
}
function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ]
}

const hexToLinear = value => {
  const hex = value.slice(1)
  const digits = hex.length === 3 ? [...hex].map(d => d + d).join('') : hex.slice(0, 6)
  return [0, 2, 4].map(i => toLinear(parseInt(digits.slice(i, i + 2), 16) / 255))
}

/**
 * Resolves hex, `rgb()`, `oklch()`, `var()` and two-stop `color-mix(in oklab, …)` to Oklab.
 * A translucent colour is flattened onto `backdrop`, one opaque colour behind the surface.
 */
function resolve(values, text, backdrop, depth = 0) {
  assert.ok(depth < 20, `cyclic value: ${text}`)
  const value = String(text).trim()
  const reference = /^var\((--[\w-]+)\)$/.exec(value)
  if (reference) return resolve(values, values[reference[1]], backdrop, depth + 1)
  if (value.startsWith('#')) return linearToOklab(hexToLinear(value))
  const rgb = /^rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/.exec(value)
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : Number(rgb[4])
    const behind = hexToLinear(backdrop)
    return linearToOklab(
      rgb.slice(1, 4).map((channel, i) => toLinear(channel / 255) * alpha + behind[i] * (1 - alpha))
    )
  }
  const oklch = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value)
  if (oklch) {
    const [L, C, h] = oklch.slice(1).map(Number)
    const angle = (h * Math.PI) / 180
    return linearToOklab(oklabToLinear([L, C * Math.cos(angle), C * Math.sin(angle)]))
  }
  const mix = /^color-mix\(\s*in oklab\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+)\)$/.exec(value)
  assert.ok(mix, `unsupported color value: ${value}`)
  const [first, second] = [mix[1], mix[3]].map(part => resolve(values, part, backdrop, depth + 1))
  const weight = Number(mix[2]) / 100
  return first.map((channel, i) => channel * weight + second[i] * (1 - weight))
}

const luminance = lab => {
  const [r, g, b] = oklabToLinear(lab)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (x, y) => {
  const [high, low] = [luminance(x), luminance(y)].sort((a, b) => b - a)
  return (high + 0.05) / (low + 0.05)
}

// Machado, Oliveira and Fernandes (2009) full-severity matrices, applied in linear sRGB.
const deficiencies = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998]
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881]
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039]
  ]
}
const simulate = (lab, matrix) => {
  const rgb = oklabToLinear(lab)
  return linearToOklab(
    matrix.map(row =>
      Math.min(
        1,
        Math.max(
          0,
          row.reduce((sum, k, i) => sum + k * rgb[i], 0)
        )
      )
    )
  )
}
const distance = (x, y) => Math.hypot(...x.map((channel, i) => channel - y[i]))

const series = Array.from({ length: 8 }, (_, index) => index + 1)
const cases = [...new Set([defaultTheme, ...themes])].flatMap(theme =>
  ['light', 'dark'].flatMap(mode => {
    const values = theme.modes[mode]
    const backdrops = String(values['--rad-surface-canvas']).match(/#[\da-f]{3,8}\b/gi) ?? [
      '#808080'
    ]
    return backdrops.map(backdrop => ({
      name: `${theme.id}/${mode} on ${backdrop}`,
      color: token => resolve(values, values[token], backdrop)
    }))
  })
)

test('series text reaches 4.5:1 on its soft fill and solids reach 3:1 on the surface', () => {
  for (const { name, color } of cases) {
    const surface = color('--rad-color-surface')
    for (const n of series) {
      const part = name => color(`--rad-series-${n}-${name}`)
      const text = contrast(part('text'), part('soft'))
      const solid = contrast(part('solid'), surface)
      assert.ok(text >= 4.5, `${name} series ${n} text on soft is ${text.toFixed(2)}:1`)
      assert.ok(solid >= 3, `${name} series ${n} solid on surface is ${solid.toFixed(2)}:1`)
    }
  }
})

// Series 1 to 6 reuse each theme's role colours, so only series 7 and 8 are held apart here.
test('series 7 and 8 stay apart from every series under simulated colour-vision deficiencies', () => {
  const minimum = 0.06
  for (const { name, color } of cases) {
    const solids = series.map(n => color(`--rad-series-${n}-solid`))
    for (const [deficiency, matrix] of [['typical', null], ...Object.entries(deficiencies)]) {
      const seen = matrix ? solids.map(solid => simulate(solid, matrix)) : solids
      for (const own of [6, 7])
        for (let other = 0; other < own; other++) {
          const gap = distance(seen[own], seen[other])
          assert.ok(
            gap >= minimum,
            `${name} ${deficiency}: series ${own + 1} and ${other + 1} are ${gap.toFixed(3)} apart`
          )
        }
    }
  }
})
