import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type AspectRatioProps = Omit<ComponentProps<'div'>, 'style'> & {
  /** Width divided by height. Must be finite and greater than zero. */
  ratio?: number
  style?: ThemeStyle
  'data-slot'?: string
}

/** Reserve a media box in CSS, including before its content loads. */
export function AspectRatio({ ratio = 1, className, style, ...props }: AspectRatioProps) {
  if (!Number.isFinite(ratio) || ratio <= 0)
    throw new TypeError('AspectRatio ratio must be a finite number greater than zero.')
  return (
    <div
      {...props}
      data-slot={joinIds('aspect-ratio', props['data-slot'])}
      className={cn('relative box-border w-full min-h-0 min-w-0 overflow-hidden', className)}
      style={{ aspectRatio: ratio, ...style }}
    />
  )
}
