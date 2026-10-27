'use client'

import { createContext, useContext } from 'react'
import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { defaultTheme } from './themes/default.js'
import { modeStyle } from './themes/tokens.js'
import type { Theme, ThemeMode, ThemeStyle } from './themes/defineTheme.js'

type ScopeState = { theme: Theme; overrides: ThemeStyle }
const ThemeContext = createContext<ScopeState | null>(null)
const variables = new Set(Object.keys(defaultTheme.modes.light))
const scopeClass =
  '[background:var(--rad-surface-canvas)] [color:var(--rad-color-foreground)] font-[family-name:var(--rad-typography-roles-ui-body-family)] text-[length:var(--rad-typography-roles-ui-body-size)] font-[number:var(--rad-typography-roles-ui-body-weight)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing)] leading-[var(--rad-typography-roles-ui-body-line-height)]'

export type ThemeScopeProps = Omit<ComponentProps<'div'>, 'style'> & {
  theme?: Theme
  mode?: ThemeMode
  style?: ThemeStyle
}

/** Optional subtree configuration. The stylesheet supplies a provider-free baseline. */
export function ThemeScope({ theme, mode, style, className, children, ...props }: ThemeScopeProps) {
  const parent = useContext(ThemeContext)
  if (mode !== undefined && mode !== 'light' && mode !== 'dark' && mode !== 'system') {
    throw new TypeError('Theme mode must be light, dark or system.')
  }
  if (theme !== undefined && (!theme.id || !theme.modes?.light || !theme.modes?.dark)) {
    throw new TypeError('ThemeScope needs a theme created with defineTheme.')
  }
  const selected = theme ?? parent?.theme ?? defaultTheme
  const establishesScope = theme !== undefined || mode !== undefined
  // A named theme deliberately clears ancestor exceptions. A mode-only scope
  // preserves explicit inline token exceptions while resolving the same theme.
  const overrides: ThemeStyle = theme === undefined ? { ...parent?.overrides } : {}
  for (const [key, value] of Object.entries(style ?? {})) {
    if (variables.has(key) && value !== undefined) overrides[key as `--${string}`] = value
  }
  const resolved: ThemeStyle = establishesScope
    ? { ...modeStyle(selected.modes.light, selected.modes.dark), ...overrides }
    : {}

  return (
    <ThemeContext.Provider value={{ theme: selected, overrides }}>
      <div
        {...props}
        data-rad-theme={theme?.id}
        data-rad-mode={mode}
        className={cn(scopeClass, className)}
        style={{
          ...resolved,
          ...(mode === undefined
            ? parent === null
              ? { colorScheme: 'light dark' }
              : {}
            : { colorScheme: mode === 'system' ? 'light dark' : mode }),
          ...style
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
