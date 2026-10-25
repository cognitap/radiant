// sRGB ↔ Oklab matrices: https://bottosson.github.io/posts/oklab/
// Transfer functions: https://www.w3.org/TR/css-color-4/#color-conversion-code
// This mapper deliberately reduces chroma at fixed L/h; it is not browser gamut mapping.
type Triple = readonly [number, number, number]
export interface OklchColor {
  readonly value: string
  readonly L: number
  readonly C: number
  readonly h: number
}
export const clamp = (n: number, low = 0, high = 1) => Math.max(low, Math.min(high, n))
export const wrapHue = (h: number) => ((h % 360) + 360) % 360
export const hueDifference = (a: number, b: number) => wrapHue(a - b + 180) - 180
const linear = (n: number) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4)
const encoded = (n: number) =>
  n <= 0.0031308 ? 12.92 * n : 1.055 * Math.max(0, n) ** (1 / 2.4) - 0.055

export function measureHex(hex: string): OklchColor {
  const [r, g, b] = [1, 3, 5].map(i => linear(parseInt(hex.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.hypot(a, bAxis)
  return { value: hex, L, C, h: C < 1e-6 ? 0 : wrapHue((Math.atan2(bAxis, a) * 180) / Math.PI) }
}

function linearRgb(L: number, C: number, h: number): Triple {
  const angle = (h * Math.PI) / 180
  const a = C * Math.cos(angle),
    b = C * Math.sin(angle)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ]
}

/** Per-generation caches: bounded by this wall, without history-dependent global state. */
export function srgbMapper() {
  const chromas = new Map<string, number>(),
    cusps = new Map<number, number>()
  function maxChroma(L: number, h: number): number {
    if (L <= 0 || L >= 1) return 0
    const key = `${L},${h}`
    const cached = chromas.get(key)
    if (cached !== undefined) return cached
    let low = 0,
      high = 0.5
    for (let i = 0; i < 25; i++) {
      const mid = (low + high) / 2
      if (linearRgb(L, mid, h).every(n => n >= -1e-8 && n <= 1 + 1e-8)) low = mid
      else high = mid
    }
    chromas.set(key, low)
    return low
  }
  function cuspLightness(h: number): number {
    const cached = cusps.get(h)
    if (cached !== undefined) return cached
    let bestL = 0.7,
      bestC = 0
    // Fixed sample locations and tie order are part of algorithm version 1.
    for (let i = 20; i <= 98; i++) {
      const L = i / 100,
        C = maxChroma(L, h)
      if (C > bestC) {
        bestC = C
        bestL = L
      }
    }
    cusps.set(h, bestL)
    return bestL
  }
  function map(L: number, C: number, h: number): OklchColor {
    const rgb = linearRgb(clamp(L), Math.min(C, maxChroma(L, h)), h)
    const value =
      '#' +
      rgb
        .map(n =>
          Math.round(clamp(encoded(n)) * 255)
            .toString(16)
            .padStart(2, '0')
        )
        .join('')
        .toUpperCase()
    return measureHex(value)
  }
  return { maxChroma, cuspLightness, map }
}
