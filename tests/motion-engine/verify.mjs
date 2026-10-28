import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
export async function verify(baseURL, output) {
  await mkdir(output, { recursive: true })
  const browser = await chromium.launch()
  const cases = []
  const errors = []
  const context = await browser.newContext({
    viewport: { width: 1200, height: 1000 },
    reducedMotion: 'no-preference'
  })
  const page = await context.newPage()
  page.on('pageerror', e => errors.push(e.message))
  const record = (name, evidence) => cases.push({ name, status: 'passed', evidence })
  const state = name =>
    page.evaluate(name => {
      const v = window.proof.channels[name].value
      return {
        value: v.get(),
        velocity: typeof v.getVelocity === 'function' ? v.getVelocity() : v.velocity
      }
    }, name)
  const button = name => page.getByRole('button', { name, exact: true })
  try {
    await page.goto(baseURL)
    await button('Spring submit').waitFor()
    await page.waitForFunction(() => window.proof?.channels.dialog)
    assert.equal(
      await page.evaluate(() => window.proof.hosts.press === document.querySelector('form button')),
      true
    )
    assert.equal(
      await page.evaluate(() => window.proof.hosts.dialog === document.querySelector('dialog')),
      true
    )
    for (const engine of ['motion', 'spring']) {
      await page.evaluate(engine => window.proof.compare[engine](), engine)
      const name = `compare-${engine}`
      await page.waitForFunction(name => {
        const v = window.proof.channels[name].value.get()
        return v > 35 && v < 95
      }, name)
      const continuity = await page.evaluate(name => {
        const c = window.proof.channels[name],
          v = c.value
        const velocity = () => (typeof v.getVelocity === 'function' ? v.getVelocity() : v.velocity)
        const before = { value: v.get(), velocity: velocity() }
        c.to(0)
        return { before, after: { value: v.get(), velocity: velocity() } }
      }, name)
      assert.ok(
        Math.abs(continuity.after.value - continuity.before.value) < 3,
        `${engine}: subframe sampling stays continuous: ${JSON.stringify(continuity)}`
      )
      assert.ok(continuity.before.velocity > 0, `${engine}: interrupted while moving`)
      // Motion refreshes its sampled value when stopping the previous driver;
      // getVelocity() immediately afterwards is a frame estimate, not the new
      // spring's initial derivative. Prove carry-over in the visible trajectory:
      // a spring retargeted behind itself must first continue forwards.
      const carried = await page.evaluate(async name => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        return window.proof.channels[name].value.get()
      }, name)
      assert.ok(
        carried > continuity.after.value,
        `${engine}: carries forward momentum after reversing target: ${carried}, ${JSON.stringify(continuity)}`
      )
      record(`${engine}: momentum-aware retarget`, {
        ...continuity,
        firstTrajectorySample: carried
      })
      await page.evaluate(name => window.proof.channels[name].destroy(), name)
    }
    await button('Spring submit').focus()
    await page.keyboard.down('Space')
    await page.waitForFunction(() => window.proof.channels.press.value.get() < 0.98)
    assert.equal(await button('Spring submit').evaluate(n => n.style.transform), 'rotate(8deg)')
    await page.keyboard.up('Space')
    await page.waitForFunction(
      () => document.querySelector('section output').textContent === 'save'
    )
    record('native Space submit and caller transform', await state('press'))
    await button('Spring submit').press('Enter')
    assert.equal(
      await page.evaluate(() => window.proof.events.filter(e => e === 'submit').length),
      2
    )
    await page.getByLabel('Pending button', { exact: true }).check()
    await button('Spring submit').evaluate(n => n.click())
    assert.equal(
      await page.evaluate(() => window.proof.events.filter(e => e === 'submit').length),
      2
    )
    await page.getByLabel('Pending button', { exact: true }).uncheck()
    await page.getByLabel('Disabled button', { exact: true }).check()
    await button('Spring submit').evaluate(n => n.click())
    assert.equal(
      await page.evaluate(() => window.proof.events.filter(e => e === 'submit').length),
      2
    )
    await page.getByLabel('Disabled button', { exact: true }).uncheck()
    await page.waitForFunction(() => !window.proof.channels.press.value.isAnimating())
    await page.getByLabel('Caller prevents press', { exact: true }).check()
    await button('Spring submit').dispatchEvent('pointerdown', { pointerType: 'mouse', button: 0 })
    assert.equal((await state('press')).value, 1)
    await page.getByLabel('Caller prevents press', { exact: true }).uncheck()
    await button('Spring submit').dispatchEvent('pointerdown', { pointerType: 'mouse', button: 0 })
    await page.waitForFunction(() => window.proof.channels.press.value.get() < 0.98)
    await button('Spring submit').dispatchEvent('pointercancel', { pointerType: 'mouse' })
    await page.waitForFunction(() => !window.proof.channels.press.value.isAnimating())
    assert.equal((await state('press')).value, 1)
    record(
      'pending/disabled/caller cancellation/pointer cancellation',
      'native submit count retained; spring returns to neutral'
    )
    const trigger = page.locator('summary', { hasText: 'Spring disclosure' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () =>
        document.querySelector('details').open && window.proof.channels.disclosure.value.get() > 10
    )
    const openHeight = await state('disclosure')
    await trigger.press('Space')
    await page.waitForFunction(
      () =>
        !document.querySelector('details').open &&
        document.querySelector('[data-slot=collapsible-content]').inert
    )
    assert.equal(await page.locator('[data-slot="collapsible-content"]').getAttribute('inert'), '')
    assert.equal(
      await page.locator('[data-slot="collapsible-content"]').getAttribute('aria-hidden'),
      'true'
    )
    const closing = await state('disclosure')
    await trigger.press('Enter')
    await page.waitForFunction(() => document.querySelector('details').open)
    await page.waitForFunction(() => !window.proof.channels.disclosure.value.isAnimating())
    const smaller = (await state('disclosure')).value
    await button('Change content size').click()
    await page.waitForFunction(
      smaller => window.proof.channels.disclosure.value.get() > smaller + 15,
      smaller
    )
    record('native details reversal and changing size', {
      openHeight,
      closing,
      smaller,
      larger: await state('disclosure')
    })
    const commits = await page.evaluate(() => window.proof.commits)
    await button('Follow right').click()
    await page.waitForFunction(() => window.proof.channels.following.value.get() > 50)
    await button('Follow left').click()
    await page.waitForFunction(() => !window.proof.channels.following.value.isAnimating())
    assert.equal(await page.evaluate(() => window.proof.commits), commits)
    record('reactive values without React frame commits', {
      commits,
      final: await state('following')
    })
    const runtime = await page.evaluate(async () => {
      const start = performance.now(),
        commits = window.proof.commits
      const before = window.proof.trace.filter(e => e.name === 'following').length
      const frames = []
      for (let i = 0; i < 60; i++) {
        frames.push(await new Promise(resolve => requestAnimationFrame(resolve)))
        window.proof.channels.following.to(110 + Math.sin(i / 6) * 100)
      }
      const intervals = frames
        .slice(1)
        .map((t, i) => t - frames[i])
        .sort((a, b) => a - b)
      return {
        targetUpdates: 60,
        elapsedMs: performance.now() - start,
        changeCallbacks: window.proof.trace.filter(e => e.name === 'following').length - before,
        reactCommits: window.proof.commits - commits,
        medianFrameMs: intervals[Math.floor(intervals.length / 2)],
        p95FrameMs: intervals[Math.floor(intervals.length * 0.95)]
      }
    })
    assert.equal(runtime.reactCommits, 0)
    record('recorded reactive runtime work (not a portable performance guarantee)', runtime)
    const drag = button('Move spring marker')
    await drag.focus()
    await page.keyboard.press('ArrowRight')
    await page.waitForFunction(() => window.proof.channels.drag.value.get() > 10)
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !window.proof.channels.drag.value.isAnimating())
    assert.equal((await state('drag')).value, 0)
    await drag.scrollIntoViewIfNeeded()
    const box = await drag.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 105, box.y + box.height / 2, { steps: 10 })
    await page.mouse.up()
    await page.waitForFunction(() => !window.proof.channels.drag.value.isAnimating())
    assert.ok((await state('drag')).value > 0)
    record('pointer drag/release and keyboard snap', {
      final: await state('drag'),
      release: await page.evaluate(() =>
        window.proof.events.filter(e => e.dragVelocity !== undefined).at(-1)
      )
    })
    const alpha = page.locator('[data-item="Alpha"]')
    await button('Reverse list').scrollIntoViewIfNeeded()
    const layoutTrace = await page.evaluate(async () => {
      const node = document.querySelector('[data-item="Alpha"]')
      const start = node.getBoundingClientRect().top
      const end = document.querySelector('[data-item="Gamma"]').getBoundingClientRect().top
      const distance = end - start
      const sample = () => ({ time: performance.now(), y: node.getBoundingClientRect().top })
      const before = [sample()]
      window.proof.layout.reverse()
      let reversed = false
      for (let i = 0; i < 90; i++) {
        await new Promise(requestAnimationFrame)
        before.push(sample())
        const progress = (before.at(-1).y - start) / distance
        if (progress > 0.4 && progress < 0.75) {
          window.proof.layout.reverse()
          reversed = true
          break
        }
      }
      const after = []
      for (let i = 0; i < 35; i++) {
        await new Promise(requestAnimationFrame)
        after.push(sample())
      }
      return { start, end, distance, reversed, before, after }
    })
    assert.equal(layoutTrace.reversed, true, 'reverse a genuinely moving layout')
    const atReverse = layoutTrace.before.at(-1).y
    assert.ok(
      Math.abs(layoutTrace.after[0].y - atReverse) < Math.abs(layoutTrace.distance) * 0.2,
      'position-continuous layout retarget, not a snap to either endpoint'
    )
    assert.equal(await alpha.getByRole('button').evaluate(n => n.style.transform), 'rotate(3deg)')
    const retained = layoutTrace.after.slice(0, 3).some(point => point.y > atReverse + 0.1)
    assert.equal(retained, true, 'layout keeps forward momentum briefly after reversing target')
    await button('Resize layout').click()
    await page.waitForFunction(() => {
      const node = document.querySelector('[data-item="Alpha"]')
      const width = node.getBoundingClientRect().width
      return width > 240 && width < 290
    })
    const composedWidth = await alpha.evaluate(n => n.getBoundingClientRect().width)
    const widthTrace = await page.evaluate(async () => {
      const node = document.querySelector('[data-item="Alpha"]')
      const before = node.getBoundingClientRect().width
      window.proof.layout.resize()
      const after = []
      for (let i = 0; i < 4; i++) {
        await new Promise(requestAnimationFrame)
        after.push(node.getBoundingClientRect().width)
      }
      return { before, after }
    })
    assert.ok(
      widthTrace.after.some(width => width > widthTrace.before + 0.1),
      'resize retains positive width velocity after reversal'
    )
    record('Radiant layout adapter: real DOM reorder/resize retains per-axis momentum', {
      ...layoutTrace,
      composedWidth,
      widthTrace,
      boundary:
        'Dedicated local pixel motion parts, persistent upstream springs; production geometry breadth is out of scope.'
    })
    await button('Open native dialog').click()
    const dialog = page.getByRole('dialog')
    await dialog.waitFor()
    assert.equal(await dialog.evaluate(n => n.matches(':modal')), true)
    assert.equal(await dialog.evaluate(n => n.style.transform), 'rotate(2deg)')
    await dialog.evaluate(n =>
      n.addEventListener('cancel', e => e.preventDefault(), { once: true })
    )
    await page.keyboard.press('Escape')
    assert.equal(await dialog.isVisible(), true)
    await page.keyboard.press('Escape')
    await page.waitForFunction(
      () =>
        !document.querySelector('dialog').open && !window.proof.channels.dialog.value.isAnimating()
    )
    assert.equal(
      await button('Open native dialog').evaluate(n => n === document.activeElement),
      true
    )
    assert.equal(await page.evaluate(() => window.proof.channels.dialog.value.isAnimating()), false)
    record(
      'native Dialog entry/cancel/close/ref/transform/focus',
      'Immediate native close; no retained spring exit claim'
    )
    await page.getByLabel('Motion off', { exact: true }).check()
    await button('Spring submit').focus()
    await page.keyboard.down('Space')
    assert.equal((await state('press')).value, 1)
    await page.keyboard.up('Space')
    await button('Follow right').click()
    assert.equal((await state('following')).value, 220)
    record('explicit off policy', 'Button transform suppressed; value target snapped')
    await page.getByLabel('Motion off', { exact: true }).uncheck()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => document.querySelector('main').dataset.motion === 'off')
    await button('Spring submit').focus()
    await page.keyboard.down('Space')
    assert.equal((await state('press')).value, 1)
    await page.keyboard.up('Space')
    record('live reduced-motion policy', 'Same explicit policy, including raw MotionValue channels')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width: 390, height: 844 })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true
    )
    await page.screenshot({ path: `${output}/proof-390.png`, fullPage: true })
    const touch = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'no-preference'
    })
    try {
      const mobile = await touch.newPage()
      await mobile.goto(baseURL)
      const session = await touch.newCDPSession(mobile)
      const submit = mobile.getByRole('button', { name: 'Spring submit', exact: true })
      await submit.scrollIntoViewIfNeeded()
      let rect = await submit.boundingBox()
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, id: 1 }]
      })
      await mobile.waitForFunction(() => window.proof.channels.press.value.get() < 0.98)
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await mobile.waitForFunction(() => window.proof.events.includes('submit'))
      const marker = mobile.getByRole('button', { name: 'Move spring marker', exact: true })
      await marker.scrollIntoViewIfNeeded()
      rect = await marker.boundingBox()
      const point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, id: 2 }
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
      for (let i = 1; i <= 8; i++) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ ...point, x: point.x + i * 8 }]
        })
        await mobile.evaluate(() => new Promise(requestAnimationFrame))
      }
      await mobile.waitForFunction(() => window.proof.channels.drag.value.get() > 20)
      await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
      await mobile.waitForFunction(
        () =>
          !window.proof.channels.drag.value.isAnimating() &&
          Math.abs(window.proof.channels.drag.value.get()) < 0.1
      )
      record(
        'real touch press/submit and drag cancellation',
        'Chromium touch input; neutral snap after cancellation'
      )
    } finally {
      await touch.close()
    }
    await page.setViewportSize({ width: 1200, height: 1000 })
    await page.screenshot({ path: `${output}/proof.png`, fullPage: true })
    await button('Follow right').click()
    await page.evaluate(() => window.proof.unmount())
    assert.equal(
      await page.evaluate(
        () =>
          Object.values(window.proof.channels).filter(c =>
            typeof c.value.isAnimating === 'function' ? c.value.isAnimating() : c.value.isAnimating
          ).length
      ),
      0
    )
    assert.deepEqual(errors, [])
    record('unmount cancellation / browser errors', 'No active owned channels or page errors')
    await writeFile(
      `${output}/results.json`,
      JSON.stringify(
        {
          status: 'passed',
          suitable: true,
          approach: 'Motion springValue with accepted Radiant layout adapter',
          cases,
          browser: browser.version(),
          limitations: [
            'Chromium proof; no manual AT/cross-browser certification',
            'Dialog proves entry plus immediate native close; full animated exit is out of scope',
            'Radiant layout adapter owns dedicated local pixel motion parts; general geometry is out of scope'
          ]
        },
        null,
        2
      )
    )
    console.log(
      `Spring study: ${cases.filter(c => c.status === 'passed').length} passing behavioral cases, including retained layout momentum through the accepted Radiant adapter.`
    )
  } finally {
    await browser.close()
  }
}
if (process.argv[2]) await verify(process.argv[2], process.argv[3] ?? '/tmp/dev171-proof')
