import { useEffect, useId, useRef, useState } from 'react'
import {
  NavLink,
  NavLinkGroup,
  NavLinkGroupContent,
  NavLinkGroupTrigger,
  type NavLinkProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'

const pages = [
  { id: 'overview', label: 'Overview', text: 'See the latest workspace activity.' },
  { id: 'members', label: 'Members', text: 'See who has access to this workspace.' },
  { id: 'preferences', label: 'Preferences', text: 'Choose your workspace defaults.' }
] as const
type Page = (typeof pages)[number]

export function NavLinkExample({
  grouped = false,
  controlSize,
  dir
}: Pick<NavLinkProps, 'controlSize' | 'dir'> & { grouped?: boolean }) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const visited = useRef(false)
  const [current, setCurrent] = useState<Page>(pages[0])

  useEffect(() => {
    const view = root.current?.ownerDocument.defaultView
    if (!view) return
    const readLocation = () => {
      const page = pages.find(page => view.location.hash === `#${id}-${page.id}`)
      if (page) {
        visited.current = true
        setCurrent(page)
      } else if (!view.location.hash && visited.current) {
        setCurrent(pages[0])
      }
    }
    readLocation()
    view.addEventListener('hashchange', readLocation)
    view.addEventListener('popstate', readLocation)
    return () => {
      view.removeEventListener('hashchange', readLocation)
      view.removeEventListener('popstate', readLocation)
    }
  }, [id])

  useEffect(() => {
    if (visited.current) root.current?.ownerDocument.getElementById(`${id}-${current.id}`)?.focus()
  }, [id, current])

  const link = (page: Page) => (
    <NavLink
      href={`#${id}-${page.id}`}
      target="_self"
      controlSize={controlSize}
      active={page === current}
    >
      {page.label}
    </NavLink>
  )

  return (
    <MotionProvider>
      <div
        ref={root}
        dir={dir}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '1rem',
          width: 'min(20rem, 100%)',
          minWidth: 0
        }}
      >
        <nav
          aria-label="Workspace"
          style={{ display: 'grid', gap: '.25rem' }}
        >
          {link(pages[0])}
          {grouped ? (
            <NavLinkGroup>
              <NavLinkGroupTrigger controlSize={controlSize}>Settings</NavLinkGroupTrigger>
              <NavLinkGroupContent>
                <div style={{ display: 'grid', gap: '.25rem' }}>
                  {link(pages[1])}
                  {link(pages[2])}
                </div>
              </NavLinkGroupContent>
            </NavLinkGroup>
          ) : (
            link(pages[1])
          )}
        </nav>
        {pages.map(page => (
          <section
            key={page.id}
            id={`${id}-${page.id}`}
            aria-label="Workspace page"
            tabIndex={-1}
            hidden={page !== current}
          >
            <strong>{page.label}</strong>
            <p style={{ margin: 0 }}>{page.text}</p>
          </section>
        ))}
      </div>
    </MotionProvider>
  )
}
