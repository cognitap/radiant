import { act, type MouseEvent, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
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
