import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type SeparatorProps = Omit<
  ComponentProps<'hr'>,
  | 'style'
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'role'
  | 'tabIndex'
  | 'aria-hidden'
  | 'aria-orientation'
> & {
  /** Hide purely visual divisions from assistive technology. */
  decorative?: boolean
  orientation?: 'horizontal' | 'vertical'
  style?: ThemeStyle
  'data-slot'?: string
}

export function Separator({
  decorative = false,
  orientation = 'horizontal',
  className,
  ...props
}: SeparatorProps) {
  const {
    children: _children,
    dangerouslySetInnerHTML: _html,
    ...attributes
  }: ComponentProps<'hr'> = props
  const nativeProps = { ...attributes, role: undefined, tabIndex: undefined }
  return (
    <hr
      {...nativeProps}
      aria-hidden={decorative ? true : undefined}
      aria-orientation={decorative ? undefined : orientation}
      data-slot={joinIds('separator', props['data-slot'])}
      data-orientation={orientation}
      data-decorative={decorative ? '' : undefined}
      className={cn(
        'box-border m-0 shrink-0 border-0 [border-style:var(--rad-separator-style,solid)] [border-color:var(--rad-separator-color,var(--rad-color-border))] forced-colors:[border-color:CanvasText]',
        orientation === 'vertical'
          ? 'h-auto w-0 self-stretch border-s-[length:var(--rad-separator-thickness,1px)] mx-[var(--rad-separator-spacing,0)]'
          : 'h-0 w-full max-w-full border-t-[length:var(--rad-separator-thickness,1px)] my-[var(--rad-separator-spacing,0)]',
        className
      )}
    />
  )
}
