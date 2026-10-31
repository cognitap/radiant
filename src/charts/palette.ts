import type { ColorPalette } from '../color/recommendColorPalette.js'
export function chartPalette(palette: ColorPalette) {
  const roles = ['primary', 'support', 'success', 'warning', 'danger', 'neutral'] as const
  const mode = (mode: 'light' | 'dark') =>
    Object.fromEntries(
      roles.map((role, index) => [
        `series${index + 1}`,
        role === 'neutral'
          ? palette.working[role][mode].foreground
          : palette.working[role][mode].background
      ])
    ) as {
      series1: string
      series2: string
      series3: string
      series4: string
      series5: string
      series6: string
    }
  return { light: mode('light'), dark: mode('dark') }
}
