import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { PropsWithChildren } from 'react'
import type { Decorator } from '@storybook/react-vite'
import { DocsContainer } from '@storybook/addon-docs/blocks'
import type { DocsContainerProps } from '@storybook/addon-docs/blocks'
import { GLOBALS_UPDATED } from 'storybook/internal/core-events'
import { ThemeScope } from '../src/index.js'
import { themes } from '../src/examples/index.js'
import type { ThemeMode } from '../src/index.js'

type Globals = Record<string, unknown>

function selection(globals: Globals) {
  const theme =
    themes.find(theme => theme.id === globals.theme) ??
    themes.find(theme => theme.id === 'radiant')!
  const mode: ThemeMode =
    globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'
  return { theme, mode }
}

function StoryTheme({
  globals,
  canvas,
  children
}: PropsWithChildren<{ globals: Globals; canvas: boolean }>) {
  const ref = useRef<HTMLDivElement>(null)
  const { theme, mode } = selection(globals)
  useLayoutEffect(() => {
    if (!canvas || !ref.current) return
    const node = ref.current
    const body = node.ownerDocument.body
    const previous = { background: body.style.background, colorScheme: body.style.colorScheme }
    // Paint the actual Canvas ancestor once, including behind translucent controls.
    // A pseudo-element looks right but axe cannot use it as the text's background.
    const styles = node.ownerDocument.defaultView!.getComputedStyle(node)
    body.style.colorScheme = styles.colorScheme
    body.style.background = styles.getPropertyValue('--rad-surface-canvas')
    return () => {
      body.style.background = previous.background
      body.style.colorScheme = previous.colorScheme
    }
  }, [canvas, theme, mode])
  return (
    <ThemeScope
      theme={theme}
      mode={mode}
      ref={ref}
      className="radiant-preview"
      data-rad-preview="story"
    >
      {children}
    </ThemeScope>
  )
}

/** Canvas and Docs stories consume the same public theme/mode contract as an application. */
export const withTheme: Decorator = (Story, context) => (
  <StoryTheme
    globals={context.globals}
    canvas={context.viewMode === 'story'}
  >
    <Story />
  </StoryTheme>
)

function docsGlobals(context: DocsContainerProps['context']): Globals {
  const story = context.componentStories()[0]
  return story
    ? context.getStoryContext(story).globals
    : (context.projectAnnotations.initialGlobals ?? {})
}

function docsGlobalStore(context: DocsContainerProps['context']) {
  let globals = docsGlobals(context)
  return {
    getSnapshot: () => globals,
    subscribe: (notify: () => void) => {
      const update = (event: { globals: Globals }) => {
        globals = event.globals
        notify()
      }
      context.channel.on(GLOBALS_UPDATED, update)
      globals = docsGlobals(context)
      return () => {
        context.channel.off(GLOBALS_UPDATED, update)
      }
    }
  }
}

/** Docs chrome is outside story decorators, so it needs its own root scope. */
export function ThemedDocsContainer({ context, children }: PropsWithChildren<DocsContainerProps>) {
  const store = useMemo(() => docsGlobalStore(context), [context])
  const globals = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  return (
    <ThemeScope
      {...selection(globals)}
      className="radiant-docs"
      data-rad-preview="docs"
    >
      <DocsContainer context={context}>{children}</DocsContainer>
    </ThemeScope>
  )
}
