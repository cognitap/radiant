import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  compileThemeDocument,
  defaultTheme,
  generateColorWall,
  recommendColorPalette,
  seriesPalette,
  themeDocumentFromDefinition,
  updateThemeAppearance
} from '../dist/library/index.js'
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

const toEncoded = n => (n <= 0.0031308 ? 12.92 * n : 1.055 * n ** (1 / 2.4) - 0.055)
const hexChannels = value => {
  const hex = value.slice(1)
  const digits = hex.length <= 4 ? [...hex].map(d => d + d).join('') : hex
  const channels = [0, 2, 4, 6].map(i => parseInt(digits.slice(i, i + 2) || 'ff', 16) / 255)
  return { rgb: channels.slice(0, 3), alpha: channels[3] }
}

/** Composites encoded sRGB over the opaque backdrop, as browsers paint, and returns Oklab. */
function flatten(rgb, alpha, backdrop) {
  const behind = alpha < 1 ? hexChannels(backdrop).rgb : rgb
  return linearToOklab(rgb.map((channel, i) => toLinear(channel * alpha + behind[i] * (1 - alpha))))
}

function splitTopLevel(text) {
  const parts = ['']
  let depth = 0
  for (const character of text) {
    if (character === '(') depth++
    if (character === ')') depth--
    if (character === ',' && depth === 0) parts.push('')
    else parts[parts.length - 1] += character
  }
  return parts.map(part => part.trim())
}

/**
 * Resolves hex (with alpha), `rgb()`, `oklch()` (with alpha or `none`), `transparent`,
 * `var()` and nested two-stop `color-mix(in oklab, …)` to Oklab. A translucent colour is
 * flattened onto `backdrop`, the opaque hex colour behind it.
 */
function resolve(values, text, backdrop, depth = 0) {
  assert.ok(depth < 20, `cyclic value: ${text}`)
  const value = String(text).trim()
  const reference = /^var\((--[\w-]+)\)$/.exec(value)
  if (reference) return resolve(values, values[reference[1]], backdrop, depth + 1)
  if (value === 'transparent') return flatten([0, 0, 0], 0, backdrop)
  if (value.startsWith('#')) {
    const { rgb, alpha } = hexChannels(value)
    return flatten(rgb, alpha, backdrop)
  }
  const rgb = /^rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/.exec(value)
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : Number(rgb[4])
    return flatten(
      rgb.slice(1, 4).map(channel => channel / 255),
      alpha,
      backdrop
    )
  }
  const oklch =
    /^oklch\(\s*([\d.]+|none)\s+([\d.]+|none)\s+([\d.]+|none)\s*(?:\/\s*([\d.]+%?))?\s*\)$/.exec(
      value
    )
  if (oklch) {
    const [L, C, h] = oklch.slice(1, 4).map(channel => (channel === 'none' ? 0 : Number(channel)))
    const alphaText = oklch[4] ?? '1'
    const alpha = alphaText.endsWith('%') ? parseFloat(alphaText) / 100 : Number(alphaText)
    const angle = (h * Math.PI) / 180
    const linear = oklabToLinear([L, C * Math.cos(angle), C * Math.sin(angle)])
    return flatten(linear.map(toEncoded), alpha, backdrop)
  }
  const mix = /^color-mix\((.*)\)$/s.exec(value)
  assert.ok(mix, `unsupported color value: ${value}`)
  const [space, ...stops] = splitTopLevel(mix[1])
  assert.equal(space, 'in oklab', `unsupported color-mix space: ${value}`)
  assert.equal(stops.length, 2, `color-mix needs two stops: ${value}`)
  const parsed = stops.map(stop => {
    const weight = /\s+([\d.]+)%$/.exec(stop)
    return {
      color: resolve(values, weight ? stop.slice(0, weight.index) : stop, backdrop, depth + 1),
      weight: weight ? Number(weight[1]) / 100 : undefined
    }
  })
  const first = parsed[0].weight ?? (parsed[1].weight === undefined ? 0.5 : 1 - parsed[1].weight)
  const second = parsed[1].weight ?? 1 - first
  return parsed[0].color.map(
    (channel, i) => (channel * first + parsed[1].color[i] * second) / (first + second)
  )
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
const pairs = series.flatMap(a => series.filter(b => b > a).map(b => [a, b]))
const visions = [['typical vision', null], ...Object.entries(deficiencies)]

// Behind a translucent surface, and for charts placed on the canvas itself, every opaque
// canvas colour counts: gradient stops and the base. One-pixel grid lines are ignored.
function backdropsOf(canvas) {
  const value = String(canvas)
  return /gradient\(/.test(value) ? value.match(/#[\da-f]{3,8}\b/gi) : [value]
}

// Themes generated from the colour wall, with its neutral or any hue family as the neutral,
// take their series from seriesPalette. A vivid brand palette as the neutral is not covered.
const brands = [
  '#7c3aed',
  '#0ea5e9',
  '#16a34a',
  '#dc2626',
  '#f59e0b',
  '#ffff00',
  '#db2777',
  '#111111'
]
const palettes = ['classic', 'balanced', 'expressive'].flatMap(wallPreset =>
  brands.flatMap(brand => {
    const wall = generateColorWall({ brand, wallPreset })
    return wall.color.palettes
      .filter(({ id }) => id !== 'brand')
      .map(({ id: neutral }) => ({
        id: `${wallPreset} wall from ${brand} with ${neutral} neutral`,
        palette: recommendColorPalette(wall, { working: { neutral } })
      }))
  })
)
const themeFrom = palette => {
  const series = seriesPalette(palette)
  return compileThemeDocument(
    updateThemeAppearance(
      themeDocumentFromDefinition({
        id: 'wall',
        name: 'Wall',
        modes: {
          light: { tokens: { series: series.light } },
          dark: { tokens: { series: series.dark } }
        }
      }),
      { palette }
    )
  )
}
// A compiled theme per preset checks the shortcut below; the expressive one moves its dark solids.
const compiled = ['classic', 'balanced', 'expressive'].map(wallPreset => ({
  ...themeFrom(
    recommendColorPalette(generateColorWall({ brand: '#7c3aed', wallPreset }), {
      working: { neutral: 'lime' }
    })
  ),
  id: `compiled ${wallPreset} wall`
}))
// The rest set only the series, surface, canvas and foreground values the checks read, once per
// distinct set of those colours.
const seriesKeys = Object.keys(defaultTheme.modes.light).filter(key =>
  key.startsWith('--rad-series-')
)
const seen = new Set()
const generated = palettes.flatMap(({ id, palette }) => {
  const key = ['light', 'dark']
    .map(mode =>
      [
        palette.color.modes[mode].surface,
        palette.color.modes[mode].foreground,
        palette.surface.modes[mode].canvas
      ].join()
    )
    .join()
  if (seen.has(key)) return []
  seen.add(key)
  const series = seriesPalette(palette)
  assert.ok(series.pass, `${id} series checks fail`)
  const values = mode => ({
    ...Object.fromEntries(seriesKeys.map(key => [key, defaultTheme.modes[mode][key]])),
    ...Object.fromEntries(
      Object.entries(series[mode]).map(([n, { solid }]) => [`--rad-series-${n}-solid`, solid])
    ),
    '--rad-color-surface': palette.color.modes[mode].surface,
    '--rad-color-foreground': palette.color.modes[mode].foreground,
    '--rad-surface-canvas': palette.surface.modes[mode].canvas
  })
  return [{ id, modes: { light: values('light'), dark: values('dark') } }]
})

const cases = [...new Set([defaultTheme, ...themes]), ...compiled, ...generated].flatMap(theme =>
  ['light', 'dark'].flatMap(mode => {
    const values = theme.modes[mode]
    return backdropsOf(values['--rad-surface-canvas']).map(canvas => {
      const backdrop = canvas.startsWith('#') ? canvas : '#ffffff'
      return {
        theme: theme.id,
        mode,
        name: `${theme.id}/${mode} on ${canvas}`,
        canvas: resolve(values, canvas, backdrop),
        color: token => resolve(values, values[token], backdrop),
        ink: value => resolve(values, value, backdrop)
      }
    })
  })
)

test('series text reaches 4.5:1 on soft, and solids 3:1 on the surface and the canvas', () => {
  for (const { name, canvas, color } of cases) {
    const surface = color('--rad-color-surface')
    for (const n of series) {
      const part = variant => color(`--rad-series-${n}-${variant}`)
      const ratios = {
        'text on soft': [contrast(part('text'), part('soft')), 4.5],
        'solid on surface': [contrast(part('solid'), surface), 3],
        'solid on canvas': [contrast(part('solid'), canvas), 3]
      }
      for (const [pair, [ratio, target]] of Object.entries(ratios))
        assert.ok(ratio >= target, `${name} series ${n} ${pair} is ${ratio.toFixed(2)}:1`)
    }
  }
})

// Glass light keeps its solids dark enough for 3:1 on its brightest gradient stop, which
// leaves less room between them.
const minimumGap = ({ theme, mode }) => (theme === 'glass' && mode === 'light' ? 0.06 : 0.08)

test('every pair of series solids stays apart under simulated colour-vision deficiencies', () => {
  for (const testCase of cases) {
    const solids = series.map(n => testCase.color(`--rad-series-${n}-solid`))
    for (const [vision, matrix] of visions) {
      const seen = matrix ? solids.map(solid => simulate(solid, matrix)) : solids
      for (const [a, b] of pairs) {
        const gap = distance(seen[a - 1], seen[b - 1])
        assert.ok(
          gap >= minimumGap(testCase),
          `${testCase.name} ${vision}: series ${a} and ${b} are ${gap.toFixed(3)} apart in Oklab`
        )
      }
    }
  }
})

test('seriesPalette reports, without throwing, palettes it cannot fit', () => {
  const brandNeutral = seriesPalette(
    recommendColorPalette(generateColorWall({ brand: '#84cc16' }), {
      working: { neutral: 'brand' }
    })
  )
  assert.equal(brandNeutral.pass, false)
  assert.equal(brandNeutral.checks.dark.pass, false)
  assert.ok(brandNeutral.checks.dark.distance.distance < brandNeutral.checks.dark.distance.minimum)
  const darkForeground = seriesPalette({
    color: {
      modes: {
        light: { surface: '#FFFFFF', foreground: '#18181B' },
        dark: { surface: '#18181B', foreground: '#444444' }
      }
    },
    surface: { modes: { light: { canvas: '#F4F4F5' }, dark: { canvas: '#09090B' } } }
  })
  assert.equal(darkForeground.checks.light.pass, true)
  assert.equal(darkForeground.checks.dark.pass, false)
  assert.equal(darkForeground.checks.dark.contrast.pair, 'text on soft')
  assert.ok(darkForeground.checks.dark.contrast.ratio < 4.5)
})

// DragAndDrop draws its full message in this mix of danger and foreground on neutral.
const fullInk = 'color-mix(in oklab, var(--rad-color-danger) 79%, var(--rad-color-foreground))'

test('foreground text, and the danger ink in built-in themes, reach 4.5:1 on neutral', () => {
  const builtIn = new Set([defaultTheme, ...themes].map(theme => theme.id))
  const complete = new Set([...builtIn, ...compiled.map(theme => theme.id)])
  for (const { theme, name, color, ink } of cases.filter(({ theme }) => complete.has(theme))) {
    const neutral = color('--rad-color-neutral')
    const ratios = { foreground: contrast(color('--rad-color-foreground'), neutral) }
    if (builtIn.has(theme)) ratios['danger ink'] = contrast(ink(fullInk), neutral)
    for (const [pair, ratio] of Object.entries(ratios))
      assert.ok(ratio >= 4.5, `${name} ${pair} on neutral is ${ratio.toFixed(2)}:1`)
  }
})
