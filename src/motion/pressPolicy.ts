import type { CSSProperties } from 'react'
export function callerOwnsPress(style: CSSProperties | undefined, className: string | undefined) {
  return (
    style?.scale !== undefined ||
    /(?:^|[\s:!])(?:-?scale-|\[scale:|transition-all(?:$|[\s!])|transition-\[[^\]]*(?:\bscale\b|\ball\b))/.test(
      className ?? ''
    ) ||
    /\b(?:scale|all)\b/.test(`${style?.transition ?? ''} ${style?.transitionProperty ?? ''}`)
  )
}
export const springPressClass =
  'transition-[translate,border-radius,corner-shape,box-shadow,background-color,color] not-disabled:not-aria-busy:motion-safe:active:scale-100'
export const offPressClass =
  'not-disabled:not-aria-busy:motion-safe:active:scale-100 not-disabled:not-aria-busy:motion-safe:active:translate-0 not-disabled:not-aria-busy:motion-safe:hover:translate-0'
