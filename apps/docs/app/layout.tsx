import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Link, ThemeScope } from '@cognitap/radiant'
import '@cognitap/radiant/styles.css'
import './styles.css'

export const metadata: Metadata = {
  title: { default: 'Radiant', template: '%s · Radiant' },
  description: 'React interaction components and presentation primitives.',
  robots: { index: false, follow: false }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeScope
          mode="system"
          className="docs-shell"
        >
          <a
            className="skip-link"
            href="#content"
          >
            Skip to content
          </a>
          <header className="site-header">
            <Link
              href="/"
              className="wordmark"
            >
              Radiant<span aria-hidden="true"> ✳</span>
            </Link>
            <span className="preview-label">Current source preview</span>
          </header>
          <main id="content">{children}</main>
          <footer className="site-footer">Built with Radiant · Experimental documentation</footer>
        </ThemeScope>
      </body>
    </html>
  )
}
