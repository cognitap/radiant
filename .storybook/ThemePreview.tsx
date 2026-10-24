import { useMemo, useSyncExternalStore } from 'react'
import type { PropsWithChildren } from 'react'
import type { Decorator } from '@storybook/react-vite'
import { DocsContainer } from '@storybook/addon-docs/blocks'
import type { DocsContainerProps } from '@storybook/addon-docs/blocks'
import { GLOBALS_UPDATED } from 'storybook/internal/core-events'
import { ThemeScope, themes } from '../src/index.js'
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

/** Canvas and Docs stories consume the same public theme/mode contract as an application. */
export const withTheme: Decorator = (Story, context) => (
  <ThemeScope
    {...selection(context.globals)}
    className="radiant-preview"
    data-rad-preview="story"
  >
    <Story />
  </ThemeScope>
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
