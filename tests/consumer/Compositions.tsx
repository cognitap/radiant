'use client'

import { useEffect, useState } from 'react'
import { Button, defaultTheme, ThemeScope } from '@cognitap/radiant'
import { themes } from '@cognitap/radiant/examples'
import { ProfileExample, type FormOwner, type FormPlacement } from './ProfileForm.js'
import { WorkspaceSettings } from './WorkspaceSettings.js'

/** A private installed-consumer harness around the unchanged canonical recipes. */
export function Compositions() {
  const [theme, setTheme] = useState('default')
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [owner, setOwner] = useState<FormOwner>('native')
  const [placement, setPlacement] = useState<FormPlacement | 'workspace'>('workspace')
  const [mounted, setMounted] = useState(true)
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true'
  }, [])
  return (
    <ThemeScope
      theme={themes.find(candidate => candidate.id === theme)}
      mode={mode}
      style={{ minHeight: '100vh', padding: '1rem', '--rad-input-radius': '18px' }}
    >
      <main style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
        <h1>Installed workspace settings</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <label>
            Theme{' '}
            <select
              aria-label="Theme"
              value={theme}
              onChange={event => setTheme(event.target.value)}
            >
              {themes.map(candidate => (
                <option
                  key={candidate.id}
                  value={candidate.id}
                >
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mode{' '}
            <select
              aria-label="Mode"
              value={mode}
              onChange={event => setMode(event.target.value as typeof mode)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Form owner{' '}
            <select
              aria-label="Form owner"
              value={owner}
              onChange={event => setOwner(event.target.value as FormOwner)}
            >
              <option value="native">Native</option>
              <option value="tanstack">TanStack</option>
            </select>
          </label>
          <label>
            Composition{' '}
            <select
              aria-label="Composition"
              value={placement}
              onChange={event => setPlacement(event.target.value as typeof placement)}
            >
              {['workspace', 'standalone', 'card', 'dialog'].map(value => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            onClick={() => setMounted(value => !value)}
          >
            {mounted ? 'Unmount examples' : 'Mount examples'}
          </Button>
        </div>
        <section
          aria-label="Recipe"
          key={`${owner}-${placement}`}
        >
          {mounted &&
            (placement === 'workspace' ? (
              <WorkspaceSettings owner={owner} />
            ) : (
              <ProfileExample
                owner={owner}
                placement={placement}
              />
            ))}
        </section>
        <ThemeScope
          theme={defaultTheme}
          mode="light"
        >
          <Button data-testid="nested-default">Independent default scope</Button>
        </ThemeScope>
      </main>
    </ThemeScope>
  )
}
