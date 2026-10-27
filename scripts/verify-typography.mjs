import assert from 'node:assert/strict'

const near = (actual, expected, label) =>
  assert.ok(
    Math.abs((actual === 'normal' ? 0 : parseFloat(actual)) - expected) < 0.06,
    `${label}: ${actual} vs ${expected}`
  )
// Accepted Source Serif profile, independently expressed at a 16px root.
const r = 21,
  q = 1.25
const expected = {
  'prose-title': [r * q ** 3, r * q ** 5, 600, 1.12, -0.025],
  'prose-heading': [r * q, r * q ** 2, 600, 1.25, -0.015],
  'prose-subheading': [r * 1.1, r * q, 600, 1.3, -0.01],
  'prose-body': [r, r, 400, 1.65, 0],
  'prose-lead': [r * 1.125, r * 1.125, 400, 1.5, 0],
  'prose-small': [r * 0.8, r * 0.8, 400, 1.5, 0],
  'prose-quote': [r * 1.25, r * 1.25, 400, 1.4, -0.01],
  'ui-title': [20, 20, 600, 1.3, -0.015],
  'ui-body': [16, 16, 400, 1.5, 0],
  'ui-label': [16, 16, 650, 1.4, 0],
  'ui-supporting': [15, 15, 400, 1.5, 0],
  'ui-caption': [14, 14, 400, 1.5, 0],
  'ui-metric': [32, 32, 600, 1.15, -0.03],
  'ui-eyebrow': [12, 12, 600, 1.4, 0.1],
  display: [r * q ** 3, r * q ** 6, 600, 1.06, -0.035],
  code: [14, 14, 400, 1.65, 0]
}
const size = (a, b, width, root = 16) =>
  Math.min(
    (b * root) / 16,
    Math.max((a * root) / 16, (a / 16 - ((b - a) / 512) * 24) * root + ((b - a) / 512) * width)
  )

export async function verifyTypography(page, route, output) {
  const cases = []
  for (const mode of ['light', 'dark']) {
    await page.getByLabel('Mode', { exact: true }).selectOption(mode)
    for (const width of [320, 390, 640, 800]) {
      await page
        .getByTestId('type-container')
        .evaluate((e, width) => (e.style.width = width + 'px'), width)
      for (const [role, [a, b, weight, leading, tracking]] of Object.entries(expected)) {
        const s = await page.getByTestId(`type-${role}`).evaluate(e => {
          const s = getComputedStyle(e)
          return {
            size: s.fontSize,
            weight: s.fontWeight,
            leading: s.lineHeight,
            tracking: s.letterSpacing,
            max: s.maxInlineSize
          }
        })
        const pixels = size(a, b, width)
        near(s.size, pixels, `${route}/${mode}/${width}/${role} size`)
        near(s.leading, pixels * leading, `${role} line height`)
        near(
          s.tracking,
          pixels * (role === 'ui-caption' && mode === 'dark' ? 0.02 : tracking),
          `${role} tracking`
        )
        assert.equal(Number(s.weight), weight)
        if (role.startsWith('ui-')) assert.equal(s.max, 'none', 'UI measure is layout-owned')
      }
      near(
        await page.getByTestId('type-fallback').evaluate(e => getComputedStyle(e).fontSize),
        r * q ** 3,
        'compact fallback outside opt-in container'
      )
      const prose = await page.getByTestId('type-prose').evaluate(e => ({
        width: e.getBoundingClientRect().width,
        scroll: e.scrollWidth,
        client: e.clientWidth,
        title: getComputedStyle(e.querySelector('h1')).fontSize,
        paragraph: getComputedStyle(e.querySelector('[data-testid=type-paragraph]'))
          .marginBlockStart,
        after: getComputedStyle(e.querySelector('[data-testid=type-after-heading]'))
          .marginBlockStart,
        code: getComputedStyle(e.querySelector('code')).fontSize
      }))
      near(prose.title, size(r * q ** 3, r * q ** 5, prose.width), 'nested prose container width')
      near(prose.paragraph, 21 * 1.25, 'prose flow')
      near(prose.after, 21 * 0.625, 'heading-after flow')
      near(prose.code, 21 * 0.9, 'inline code follows parent')
      assert.ok(prose.scroll <= prose.client + 1, 'long text and pre do not widen prose')
      near(
        await page.getByTestId('type-explicit').evaluate(e => getComputedStyle(e).fontSize),
        20,
        'explicit style beats automatic mapping'
      )
      near(
        await page.getByTestId('type-explicit-host').evaluate(e => getComputedStyle(e).fontSize),
        16,
        'explicit host role beats prose defaults'
      )
      const caller = await page.getByTestId('type-caller').evaluate(e => {
        const s = getComputedStyle(e)
        return {
          size: s.fontSize,
          leading: s.lineHeight,
          weight: s.fontWeight,
          max: s.maxInlineSize
        }
      })
      near(caller.size, 30, 'caller size')
      near(caller.leading, 60, 'caller leading')
      assert.equal(caller.weight, '700')
      assert.equal(caller.max, 'none')
      assert.equal(
        await page.getByTestId('type-button').evaluate(e => getComputedStyle(e).fontWeight),
        '775',
        'component exception preserved'
      )
      near(
        await page
          .getByTestId('type-mode')
          .locator('span')
          .evaluate(e => getComputedStyle(e).letterSpacing),
        14 * 0.02,
        'mode-only scope'
      )
      assert.equal(
        await page
          .getByTestId('type-reset')
          .locator('span')
          .evaluate(e => getComputedStyle(e).fontWeight),
        '500',
        'named reset clears role exception'
      )
      cases.push({ mode, width, result: 'pass', roles: 16 })
    }
  }
  // User spacing and enlarged-root probes are distinct from browser/AT conformance.
  await page.getByTestId('type-container').evaluate(e => (e.style.width = '320px'))
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'))
  near(
    await page.getByTestId('type-prose-body').evaluate(e => getComputedStyle(e).fontSize),
    42,
    'root text scaling'
  )
  assert.ok(
    await page.getByTestId('type-prose').evaluate(e => e.scrollWidth <= e.clientWidth + 1),
    'enlarged text reflows'
  )
  await page.evaluate(() => (document.documentElement.style.fontSize = ''))
  await page.addStyleTag({
    content:
      '[data-testid=type-prose] *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}[data-testid=type-prose] p{margin-bottom:2em!important}'
  })
  assert.ok(
    await page.getByTestId('type-prose').evaluate(e => e.scrollWidth <= e.clientWidth + 1),
    'text-spacing overrides reflow'
  )
  await page.getByTestId('typography-proof').screenshot({ path: `${output}/typography.png` })
  console.log(
    `${route}: typography passed ${cases.length} width/mode cases, 16 roles, nested scopes, caller overrides and text probes.`
  )
  return cases
}
