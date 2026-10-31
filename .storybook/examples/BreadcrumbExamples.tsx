import { useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  type BreadcrumbLinkRenderProps
} from '../../src/index.js'

/** Stands in for a framework router's Link: plain clicks route, modified clicks stay native. */
function RouterAnchor({
  navigate,
  onClick,
  href,
  children,
  ...props
}: BreadcrumbLinkRenderProps & { navigate: (href: string) => void }) {
  return (
    <a
      {...props}
      href={href}
      onClick={event => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return
        event.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </a>
  )
}

const routes = [
  { href: '/workspace', label: 'Workspace' },
  { href: '/workspace/projects', label: 'Projects' },
  { href: '/workspace/projects/radiant', label: 'Radiant' }
]

export function RoutedTrail() {
  const [route, setRoute] = useState(routes.at(-1)!.href)
  const trail = routes.slice(0, routes.findIndex(item => item.href === route) + 1)
  const current = trail.at(-1)!
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Breadcrumb>
        <BreadcrumbList>
          {trail.slice(0, -1).map(item => (
            <BreadcrumbItem key={item.href}>
              <BreadcrumbLink
                href={item.href}
                render={props => (
                  <RouterAnchor
                    {...props}
                    navigate={setRoute}
                  />
                )}
              >
                {item.label}
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </BreadcrumbItem>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage>{current.label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <output>Route: {route}</output>
      {route === routes.at(-1)!.href ? null : (
        <Button
          variant="outline"
          tone="neutral"
          onClick={() => setRoute(routes.at(-1)!.href)}
        >
          Back to Radiant
        </Button>
      )}
    </div>
  )
}
