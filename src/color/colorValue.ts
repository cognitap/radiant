import { clamp, rgbToOklch, srgbMapper, wrapHue, type OklchColor } from './oklch.js'

export type ColorFormat = 'oklch' | 'hex' | 'rgb'
export type ColorChannels = Omit<OklchColor, 'value'> & { alpha: number }

const number = '[+-]?(?:[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+)(?:e[+-]?[0-9]+)?'
const numeric = new RegExp('^(' + number + ')(%)?$', 'i')
const angle = new RegExp('^(' + number + ')(deg|grad|rad|turn)?$', 'i')
const angleScale = { deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 }

function scalar(token: string, fullScale: number): number {
  const parts = numeric.exec(token)
  if (!parts) return NaN
  const value = Number(parts[1])
  return parts[2] ? (value / 100) * fullScale : value
}

function hexColor(value: string): ColorChannels | null {
  if (!/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)) return null
  const hex =
    value.length <= 5
      ? value
          .slice(1)
          .split('')
          .map(digit => digit.repeat(2))
          .join('')
      : value.slice(1)
  const [r, g, b] = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
  return { ...rgbToOklch(r, g, b), alpha: hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1 }
}

export function parseColor(value: string): ColorChannels | null {
  const text = value.trim().toLowerCase()
  if (text.startsWith('#')) return hexColor(text)
  const match = /^(oklch|rgb|rgba)\(\s*(.*?)\s*\)$/.exec(text)
  if (!match) return null
  const rgb = match[1] !== 'oklch'
  const [body, opacity, extra] = match[2].split('/')
  if (extra !== undefined) return null
  const commaSeparated = body.includes(',')
  if (commaSeparated && (!rgb || opacity !== undefined)) return null
  const values = commaSeparated
    ? body.split(',').map(token => token.trim())
    : body.trim().split(/\s+/)
  const alphaToken = commaSeparated ? values.splice(3, 1)[0] : opacity?.trim()
  if (values.length !== 3) return null
  const alpha = alphaToken === undefined ? 1 : scalar(alphaToken, 1)
  if (!Number.isFinite(alpha)) return null

  if (rgb) {
    const channels = values.map(token => scalar(token, 255))
    if (!channels.every(Number.isFinite)) return null
    const [r, g, b] = channels.map(channel => clamp(channel / 255))
    return { ...rgbToOklch(r, g, b), alpha: clamp(alpha) }
  }

  const L = scalar(values[0], 1)
  const C = scalar(values[1], 0.4)
  const degrees = angle.exec(values[2])
  const unit = (degrees?.[2] ?? 'deg') as keyof typeof angleScale
  const hue = degrees ? Number(degrees[1]) * angleScale[unit] : NaN
  if (![L, C, hue].every(Number.isFinite)) return null
  return { L: clamp(L), C: Math.max(0, C), h: wrapHue(hue), alpha: clamp(alpha) }
}

function formatNumber(value: number, places: number) {
  return Number(value.toFixed(places)).toString()
}

export function formatColor(color: ColorChannels, format: ColorFormat): string {
  if (format === 'oklch') {
    const tail = color.alpha === 1 ? '' : ' / ' + formatNumber(color.alpha, 4)
    return `oklch(${formatNumber(color.L * 100, 4)}% ${formatNumber(color.C, 5)} ${formatNumber(wrapHue(color.h), 3)}${tail})`
  }
  const hex = srgbMapper().map(color.L, color.C, color.h).value
  if (format === 'hex') {
    const suffix =
      color.alpha === 1
        ? ''
        : Math.round(color.alpha * 255)
            .toString(16)
            .padStart(2, '0')
            .toUpperCase()
    return hex + suffix
  }
  const rgb = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)).join(' ')
  const tail = color.alpha === 1 ? '' : ' / ' + formatNumber(color.alpha, 4)
  return `rgb(${rgb}${tail})`
}
