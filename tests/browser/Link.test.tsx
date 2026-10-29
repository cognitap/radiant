import {
  act,
  createElement,
  createRef,
  Fragment,
  type MouseEvent,
  type ReactNode,
  type Ref
} from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Link, ThemeScope, type LinkRenderProps } from '../../src/index.js'
import { glass } from '../../src/examples/index.js'
import { MotionProvider, MotionLink } from '../../src/motion/react.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
const originalURL = location.href

async function mount(children: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  mounted.push({ root, host })
  await act(async () => root.render(<MotionProvider>{children}</MotionProvider>))
  return { root, host }
}

afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  history.replaceState(history.state, '', originalURL)
})

// A consumer router owns interception. Link supplies resolved native props;
// the adapter calls the consumer once and leaves browser-owned activations alone.
function RouterAnchor({
  navigate,
  onClick,
  href,
  target,
  download,
  children,
  ...props
}: LinkRenderProps & {
  navigate: (href: string) => void
}) {
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
          new URL(href, event.currentTarget.ownerDocument.baseURI).origin !== location.origin
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

const cases = [
  { Anchor: Link, family: 'Link' },
  { Anchor: MotionLink, family: 'MotionLink' }
].flatMap(action => (['light', 'dark'] as const).map(mode => ({ ...action, mode })))

for (const { Anchor, family, mode } of cases) {
  test(`${family} ${mode}: native and adapted action links keep click, Enter, Space and form semantics`, async () => {
    const submitted = vi.fn()
    for (const variant of ['inline', 'solid'] as const) {
      for (const render of [
        undefined,
        (props: LinkRenderProps) => <a {...props}>{props.children}</a>
      ]) {
        const clicked = vi.fn()
        const { host, root } = await mount(
          <ThemeScope
            theme={glass}
            mode={mode}
          >
            <form
              onSubmit={event => {
                event.preventDefault()
                submitted()
              }}
            >
              <Anchor
                href="#link-destination"
                variant={variant}
                onClick={clicked}
                render={render}
              >
                Guide
              </Anchor>
            </form>
            <section
              id="link-destination"
              tabIndex={-1}
            >
              Guide content
            </section>
          </ThemeScope>
        )
        const anchor = host.querySelector('a')!
        expect(host.querySelectorAll('button')).toHaveLength(0)
        await act(async () => userEvent.click(anchor))
        await expect.poll(() => location.hash).toBe('#link-destination')
        expect(clicked).toHaveBeenCalledTimes(1)
        history.replaceState(history.state, '', originalURL)
        anchor.focus()
        await act(async () => userEvent.keyboard(' '))
        expect(location.hash).toBe(new URL(originalURL).hash)
        expect(clicked).toHaveBeenCalledTimes(1)
        await act(async () => userEvent.keyboard('{Enter}'))
        await expect.poll(() => location.hash).toBe('#link-destination')
        expect(clicked).toHaveBeenCalledTimes(2)
        expect(document.activeElement).toBe(host.querySelector('section'))
        history.replaceState(history.state, '', originalURL)
        // Avoid duplicate destination IDs while retaining normal cleanup.
        await act(async () => root.render(null))
      }
    }
    expect(submitted).not.toHaveBeenCalled()
  })

  test(`${family} ${mode}: router adapters preserve cancellation, current handlers and keyboard activation`, async () => {
    const navigate = vi.fn()
    const cancelled = vi.fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault())
    const accepted = vi.fn()
    const tree = (onClick: LinkRenderProps['onClick']) => (
      <ThemeScope mode={mode}>
        <Anchor
          href="#router-destination"
          variant="outline"
          onClick={onClick}
          render={props => (
            <RouterAnchor
              {...props}
              navigate={navigate}
            />
          )}
        >
          Open guide
        </Anchor>
      </ThemeScope>
    )
    const { host, root } = await mount(tree(cancelled))
    const anchor = host.querySelector('a')!
    await act(async () => userEvent.click(anchor))
    expect(cancelled).toHaveBeenCalledTimes(1)
    expect(navigate).not.toHaveBeenCalled()
    expect(location.hash).toBe(new URL(originalURL).hash)
    await act(async () => root.render(<MotionProvider>{tree(accepted)}</MotionProvider>))
    await act(async () => userEvent.keyboard('{Enter}'))
    expect(accepted).toHaveBeenCalledTimes(1)
    expect(cancelled).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledExactlyOnceWith('#router-destination')
    expect(host.querySelector('a')).toBe(anchor)
    expect(location.hash).toBe(new URL(originalURL).hash)
  })

  test(`${family} ${mode}: modified and middle clicks, external targets and downloads stay browser-owned`, async () => {
    const navigate = vi.fn()
    const href = `${location.origin}/tests/browser/fixtures/navigation.html?mode=${mode}`
    const downloadHref = 'data:text/plain;charset=utf-8,Radiant%20guide'
    await mount(
      <ThemeScope mode={mode}>
        <Anchor
          href={href}
          variant="solid"
          data-testid="popup-link"
          render={props => (
            <RouterAnchor
              {...props}
              navigate={navigate}
            />
          )}
        >
          Guide
        </Anchor>
        <Anchor
          href={href}
          external
          data-testid="external-link"
          render={props => (
            <RouterAnchor
              {...props}
              navigate={navigate}
            />
          )}
        >
          External guide
        </Anchor>
        <Anchor
          href={downloadHref}
          download="guide.txt"
          data-testid="download-link"
          render={props => (
            <RouterAnchor
              {...props}
              navigate={navigate}
            />
          )}
        >
          Download guide
        </Anchor>
      </ThemeScope>
    )
    for (const activation of ['modified', 'middle'] as const) {
      const openedURL = await act(async () =>
        commands.observeLinkPopup('[data-testid="popup-link"]', activation)
      )
      expect(openedURL).toBe(href)
    }
    const externalURL = await act(async () =>
      commands.observeLinkPopup('[data-testid="external-link"]', 'target')
    )
    expect(externalURL).toBe(href)
    const download = await act(async () =>
      commands.observeLinkDownload('[data-testid="download-link"]')
    )
    expect(download).toEqual({ filename: 'guide.txt', url: downloadHref })
    expect(navigate).not.toHaveBeenCalled()
    expect(location.href).toBe(originalURL)
  })
}

test('adapted links keep resolved identity and consume presentation props', () => {
  const ref = createRef<HTMLAnchorElement>()
  const onClick = () => {}
  const style = { color: 'rebeccapurple', '--rad-button-radius': '1rem' }
  for (const variant of ['inline', 'subtle', 'solid', 'soft', 'outline', 'ghost'] as const) {
    let resolved: LinkRenderProps | undefined
    const props = {
      href: '/guide',
      variant,
      tone: 'warning' as const,
      controlSize: 'large' as const,
      external: true,
      download: 'guide.txt',
      ref,
      onClick,
      style,
      className: 'rounded-full',
      'aria-describedby': 'help',
      id: 'guide-link',
      'data-slot': 'pretend-button',
      'data-variant': 'primary',
      'data-tone': 'ghost',
      'data-control-size': 'default',
      'data-consumer': 'retained'
    }
    const native = renderToStaticMarkup(<Link {...props}>Guide</Link>)
    const adapted = renderToStaticMarkup(
      <Link
        {...props}
        render={anchorProps => {
          resolved = anchorProps
          return <a {...anchorProps}>{anchorProps.children}</a>
        }}
      >
        Guide
      </Link>
    )
    const anchor = new DOMParser().parseFromString(native, 'text/html').querySelector('a')!
    expect(adapted).toBe(native)
    expect(anchor.dataset.slot).toBe('link')
    expect(anchor.dataset.variant).toBe(variant)
    expect(anchor.dataset.tone).toBe('warning')
    expect(anchor.dataset.controlSize).toBe('large')
    expect(anchor.dataset.consumer).toBe('retained')
    expect(resolved?.ref).toBe(ref)
    expect(resolved?.onClick).toBe(onClick)
    expect(resolved?.style).toBe(style)
    expect(resolved?.target).toBe('_blank')
    expect(resolved?.rel).toBe('noopener noreferrer')
    for (const name of ['variant', 'tone', 'controlSize', 'external', 'render'] as const)
      expect(Object.hasOwn(resolved ?? {}, name)).toBe(false)
  }
})

test('a link replacement must return one anchor', () => {
  const anchor = createElement('a', { href: '/guide' }, 'Guide')
  for (const render of [
    () => null,
    () => 'Guide',
    () => [anchor],
    () => createElement(Fragment, null, anchor),
    () => createElement('button', null, 'Guide')
  ])
    expect(() => renderToStaticMarkup(createElement(Link, { render } as never))).toThrow(
      /Link.*render.*anchor/i
    )
})

test('default and router link refs stay on one anchor until replacement', async () => {
  function RouterAnchor(props: LinkRenderProps) {
    return (
      <a
        {...props}
        data-router=""
      >
        {props.children}
      </a>
    )
  }
  for (const render of [undefined, (props: LinkRenderProps) => <RouterAnchor {...props} />]) {
    const attached: Array<HTMLAnchorElement | null> = []
    const cleaned: HTMLAnchorElement[] = []
    const ref: Ref<HTMLAnchorElement> = anchor => {
      attached.push(anchor)
      return () => {
        if (anchor) cleaned.push(anchor)
      }
    }
    const { host, root } = await mount(
      <Link
        href="#guide"
        render={render}
        ref={ref}
        title="Original"
      >
        Guide
      </Link>
    )
    const anchor = host.querySelector('a')!
    expect(attached).toEqual([anchor])
    expect(host.querySelectorAll('a')).toHaveLength(1)
    await act(async () =>
      root.render(
        <MotionProvider>
          <Link
            href="#guide"
            render={render}
            ref={ref}
            title="Updated"
          >
            Guide
          </Link>
        </MotionProvider>
      )
    )
    expect(attached).toEqual([anchor])
    expect(cleaned).toEqual([])
    const nextRef = createRef<HTMLAnchorElement>()
    await act(async () =>
      root.render(
        <MotionProvider>
          <Link
            href="#guide"
            render={render}
            ref={nextRef}
          >
            Guide
          </Link>
        </MotionProvider>
      )
    )
    expect(cleaned).toEqual([anchor])
    expect(nextRef.current).toBe(anchor)
    await act(async () => root.render(null))
    expect(nextRef.current).toBeNull()
  }
})
