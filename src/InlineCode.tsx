import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type InlineCodeProps = Omit<ComponentProps<'code'>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
/** Native inline code; highlighting and content belong to the application. */
export function InlineCode({ className, ...props }: InlineCodeProps) {
  return (
    <code
      {...props}
      data-slot={joinIds('inline-code', props['data-slot'])}
      className={cn(
        'box-border break-words rounded-[var(--rad-inline-code-radius,0.25rem)] px-[var(--rad-inline-code-padding-inline,0.25em)] py-[var(--rad-inline-code-padding-block,0.125em)]',
        'bg-[var(--rad-inline-code-background,var(--rad-color-neutral))] [color:var(--rad-inline-code-color,var(--rad-color-foreground))]',
        'font-[family-name:var(--rad-typography-roles-code-family,ui-monospace,monospace)] text-[length:var(--rad-inline-code-font-size,0.875em)]',
        'forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
        className
      )}
    />
  )
}
