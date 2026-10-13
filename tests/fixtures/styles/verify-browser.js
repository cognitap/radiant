// oxlint-disable-next-line no-unused-expressions -- Playwright CLI evaluates this entry function.
async page => {
  const origin = new URL(page.url()).origin
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const check = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const visit = async query => {
    await page.goto(`${origin}/${query}`)
    await page.locator('#default').waitFor()
  }
  const globals = () =>
    page.evaluate(() => {
      const heading = getComputedStyle(document.querySelector('h1'))
      const native = getComputedStyle(document.querySelector('#native'))
      return {
        bodyMargin: getComputedStyle(document.body).margin,
        headingMargin: heading.marginTop,
        headingFont: heading.fontSize,
        nativeBorder: native.borderTopStyle,
        nativeFont: native.fontSize
      }
    })
  const style = selector =>
    page.locator(selector).evaluate(element => {
      const css = getComputedStyle(element)
      return {
        background: css.backgroundColor,
        color: css.color,
        font: css.fontFamily,
        fontSize: css.fontSize,
        boxSizing: css.boxSizing,
        borderStyle: css.borderTopStyle,
        borderColor: css.borderTopColor,
        borderWidth: css.borderTopWidth,
        radius: css.borderRadius,
        outlineWidth: css.outlineWidth,
        outlineColor: css.outlineColor,
        outlineOffset: css.outlineOffset
      }
    })

  await visit('?unstyled')
  const before = await globals()
  const unstyled = await style('#default')
  check(unstyled.background === 'rgb(239, 239, 239)', 'Component imports must not inject CSS')

  await visit('')
  check(
    JSON.stringify(await globals()) === JSON.stringify(before),
    'Default CSS must not reset the page'
  )
  const button = await style('#default')
  check(button.background === 'rgb(30, 41, 59)', 'Primary background')
  check(button.color === 'rgb(255, 255, 255)', 'Primary foreground')
  check(
    button.font === 'Georgia, serif' && button.fontSize === '20px',
    'Application font inheritance'
  )
  check(
    button.boxSizing === 'border-box' && button.borderStyle === 'solid',
    'Reset-independent box/border'
  )
  check(button.radius === '8px', 'Default radius')
  check((await style('#themed')).background === 'rgb(157, 23, 77)', 'Subtree token override')
  check((await style('#custom')).radius === '0px', 'Ordinary CSS override')
  check((await page.locator('#default').getAttribute('type')) === 'button', 'Default native type')

  await page.locator('#default').hover()
  check((await style('#default')).background === 'rgb(15, 23, 42)', 'Hover state')
  await page.mouse.down()
  check((await style('#default')).background === 'rgb(2, 6, 23)', 'Active state')
  await page.mouse.up()
  check(
    (await page.locator('#default').textContent()) === 'Clicks: 1',
    'Client React click handler'
  )
  await page.locator('#disabled').hover()
  const disabled = await style('#disabled')
  check(
    disabled.background === 'rgb(226, 232, 240)' && disabled.color === 'rgb(71, 85, 105)',
    'Disabled wins over hover'
  )

  await visit('')
  await page.mouse.move(0, 0)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  check(
    await page.locator('#default').evaluate(element => element === document.activeElement),
    'Keyboard focus'
  )
  const focused = await style('#default')
  check(
    focused.outlineWidth === '3px' &&
      focused.outlineOffset === '3px' &&
      focused.outlineColor === 'rgb(37, 99, 235)',
    'Visible focus outline'
  )
  await page.keyboard.press('Space')
  check(
    (await page.locator('#default').textContent()) === 'Clicks: 1',
    'Native keyboard activation'
  )
  await page.keyboard.press('Tab')
  check(
    await page.locator('#themed').evaluate(element => element === document.activeElement),
    'Disabled button skips tab order'
  )

  await page.emulateMedia({ forcedColors: 'active' })
  const forced = await style('#default')
  const forcedDisabled = await style('#disabled')
  check(
    forced.borderWidth === '1px' && forced.borderColor !== 'rgba(0, 0, 0, 0)',
    'Forced-colors button border'
  )
  check(forcedDisabled.borderColor === forcedDisabled.color, 'Forced-colors disabled border/text')
  await page.emulateMedia({ forcedColors: 'none' })

  await visit('?reset')
  const reset = await globals()
  check(
    reset.bodyMargin === '0px' && reset.headingMargin === '0px' && reset.headingFont === '20px',
    'Explicit reset changes global defaults'
  )
  check(errors.length === 0, `Browser application errors: ${errors.join('; ')}`)
  return {
    browser: page.context().browser().version(),
    before,
    button,
    focused,
    reset,
    passed: true
  }
}
