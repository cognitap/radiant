import { useId, useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Checkbox,
  Link,
  type LinkProps,
  type LinkRenderProps
} from '../../src/index.js'
import { MotionProvider, MotionLink } from '../../src/motion/react.js'

/** Consumer routing: preserve every activation the browser owns. */
export function RouterAnchor({
  navigate,
  onClick,
  href,
  target,
  download,
  children,
  ...props
}: LinkRenderProps & { navigate: (href: string) => void }) {
  return (
    <a
      {...props}
      href={href}
      target={target}
      download={download}
      onClick={event => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (target && target !== '_self') ||
          (download !== undefined && download !== false) ||
          !href ||
          new URL(href, event.currentTarget.ownerDocument.baseURI).origin !==
            event.currentTarget.ownerDocument.location.origin
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

export function LinkPlayground(args: LinkProps) {
  const id = useId()
  const [saved, setSaved] = useState(false)
  const [off, setOff] = useState(false)
  const { variant = 'solid', tone = 'accent', controlSize = 'large' } = args
  return (
    <MotionProvider>
      <Card style={{ width: 'min(42rem, calc(100vw - 2rem))', maxWidth: '100%' }}>
        <CardHeader>
          <CardDescription>YOUR NEXT CHAPTER</CardDescription>
          <CardTitle>A destination worth exploring.</CardTitle>
          <CardDescription>
            Navigate with a link. Save something with a button. Both speak the same visual language.
          </CardDescription>
        </CardHeader>
        <CardContent style={{ display: 'grid', gap: '1.5rem' }}>
          <p style={{ margin: 0 }}>
            Start with a small idea and <Link href={`#${id}`}>read the launch notes</Link> before
            making your next move.
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              border: '1px dashed var(--rad-color-border)',
              borderRadius: 'var(--rad-control-radius)'
            }}
          >
            <MotionLink
              {...args}
              style={{ maxWidth: '100%', ...args.style }}
              href={args.href ?? `#${id}`}
              variant={variant}
              tone={tone}
              controlSize={controlSize}
              motion={off ? 'off' : 'inherit'}
            >
              {args.children}
              {args.external ? ' (opens in a new tab)' : ''}
            </MotionLink>
            <Button
              variant={variant === 'inline' || variant === 'subtle' ? 'ghost' : variant}
              tone={tone}
              controlSize={controlSize}
              motion={off ? 'off' : 'inherit'}
              aria-pressed={saved}
              onClick={() => setSaved(value => !value)}
            >
              Save for later
            </Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <Checkbox
              label="Turn off spatial motion"
              checked={off}
              onChange={event => setOff(event.target.checked)}
            />
            <output aria-live="polite">
              {saved ? 'Added to your reading list.' : 'Your reading list is clear.'}
            </output>
          </div>
          <CardDescription>
            Try Controls and the Theme/Mode toolbar. Enter follows a link; Space keeps native
            scrolling. System reduced motion takes priority.
          </CardDescription>
        </CardContent>
        <CardFooter>
          <section
            id={id}
            tabIndex={-1}
            aria-label="Launch notes"
            style={{ scrollMargin: '1rem' }}
          >
            <strong>Launch notes</strong>
            <p style={{ margin: '.5rem 0 0' }}>
              You arrived through a real anchor. Use Back to return, or keep exploring.
            </p>
          </section>
        </CardFooter>
      </Card>
    </MotionProvider>
  )
}

export function RoutedLinkExample(args: LinkProps) {
  const id = useId()
  const [route, setRoute] = useState<string | null>(null)
  return (
    <MotionProvider>
      <Card style={{ width: 'min(32rem, calc(100vw - 2rem))', maxWidth: '100%' }}>
        <CardHeader>
          <CardDescription>ROUTER ADAPTER</CardDescription>
          <CardTitle>One anchor, your router.</CardTitle>
          <CardDescription>
            The adapter forwards the real ref, children and handlers. Modified clicks, downloads and
            other targets remain native.
          </CardDescription>
        </CardHeader>
        <CardContent style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
          <MotionLink
            {...args}
            href={args.href ?? `#${id}`}
            render={
              args.render ??
              (props => (
                <RouterAnchor
                  {...props}
                  navigate={setRoute}
                />
              ))
            }
          />
          <section
            id={id}
            tabIndex={-1}
          >
            <output aria-live="polite">
              {route ? 'The installation guide is open.' : 'Choose a destination to begin.'}
            </output>
          </section>
        </CardContent>
      </Card>
    </MotionProvider>
  )
}
