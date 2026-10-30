import type { ReactElement } from 'react'
import { Link, type LinkProps, type LinkRenderProps } from './Link.js'
import { joinIds } from './internal/ids.js'
export type ComposedLinkRenderProps = Omit<LinkRenderProps, 'data-slot' | 'href'> & {
  'data-slot': string
  href: string
}
export type ComposedLinkProps = Omit<LinkProps, 'href' | 'render' | 'role'> & {
  href: string
  'data-slot'?: string
  render?: (props: ComposedLinkRenderProps) => ReactElement
}
export function ComposedLink({
  identity,
  href,
  render,
  'data-slot': slot,
  ...props
}: ComposedLinkProps & { identity: string }) {
  return (
    <Link
      {...props}
      href={href}
      render={native => {
        const resolved: ComposedLinkRenderProps = {
          ...native,
          href,
          role: undefined,
          'data-slot': joinIds('link', identity, slot) ?? 'link'
        }
        // oxlint-disable-next-line react/refs -- The adapter forwards resolved refs; it does not read ref.current.
        return render ? render(resolved) : <a {...resolved}>{resolved.children}</a>
      }}
    />
  )
}
