import { Link } from '@cognitap/radiant'

export default function HomePage() {
  return (
    <div className="home">
      <p className="eyebrow">A language for interfaces</p>
      <h1>
        Make room for
        <br />
        what matters.
      </h1>
      <p className="lede">
        React components with native behavior, shared design tokens, and room for your own
        expression.
      </p>
      <Link
        href="/docs/button/"
        variant="solid"
        controlSize="large"
      >
        Explore Button <span aria-hidden="true">↗</span>
      </Link>
      <p className="source-note">
        You’re viewing the current repository source. These APIs may differ from the published npm
        package.
      </p>
    </div>
  )
}
