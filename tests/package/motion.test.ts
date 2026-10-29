// @ts-nocheck
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defineTheme,
  defineMotionProfile,
  defaultMotionProfile,
  defineThemeDocument,
  compileThemeDocument,
  exportThemeSections,
  themeDocumentFromDefinition
} from '@cognitap/radiant'
import { createSpring, createLayoutSpring, bindSpringStyle } from '@cognitap/radiant/motion'
import { JSDOM } from 'jsdom'

test('theme profiles are validated immutable serializable data, independent of CSS motion tokens', () => {
  const input = {
    id: 'motion-theme',
    name: 'Motion theme',
    motion: { spring: { stiffness: 240 }, interactions: { press: { damping: 34 } } },
    tokens: { motion: { pressDuration: '80ms' } }
  }
  const theme = defineTheme(input)
  assert.equal(theme.motion.interactions.press.stiffness, 240)
  assert.equal(theme.motion.interactions.press.damping, 34)
  assert.equal(theme.motion.interactions.layout.damping, 30)
  assert.equal(theme.modes.light['--rad-motion-press-duration'], '80ms')
  assert.ok(Object.isFrozen(theme.motion.interactions.press))
  assert.deepEqual(JSON.parse(JSON.stringify(theme)).motion, theme.motion)
  assert.equal(defaultMotionProfile.mode, 'system')
  const document = themeDocumentFromDefinition(input)
  assert.deepEqual(compileThemeDocument(document).motion, theme.motion)
  assert.deepEqual(exportThemeSections(document, ['motion']).sections.motion.profile, input.motion)
  assert.throws(
    () =>
      defineThemeDocument({ ...document, sections: { motion: { profile: { mode: 'always' } } } }),
    /motion.mode/
  )
  for (const spring of [{ stiffness: 0 }, { mass: Infinity }, { damping: NaN }, { duration: 200 }])
    assert.throws(() => defineMotionProfile({ spring }))
  assert.throws(() => defineMotionProfile({ interactions: { typo: { mass: 1 } } }), /Unknown key/)
})
test('off, neutral, stop and destruction leave no scheduled animation or stale goal', () => {
  const spring = createSpring(0, { enabled: false })
  const changes = []
  const off = spring.subscribe(value => changes.push(value))
  spring.to(200)
  assert.equal(spring.get(), 200)
  assert.equal(spring.isAnimating(), false)
  spring.configure({ reducedValue: 1 })
  spring.to(0.96)
  assert.equal(spring.get(), 1)
  spring.configure({ reducedValue: undefined })
  assert.equal(spring.get(), 0.96)
  spring.stop()
  assert.equal(spring.getVelocity(), 0)
  off()
  const count = changes.length
  spring.jump(2)
  assert.equal(changes.length, count)
  spring.destroy()
  spring.destroy()
  spring.to(99)
  assert.equal(spring.get(), 2)
  assert.equal(spring.isAnimating(), false)
  assert.throws(() => spring.to(NaN), /finite/)
})
test('DOM binding reserves one property, preserves caller transform and restores prior style', () => {
  const { document } = new JSDOM(
    '<button style="transform: rotate(7deg); scale: .8 !important">Submit</button>'
  ).window
  const button = document.querySelector('button')
  const spring = createSpring(1, { enabled: false })
  const cleanup = bindSpringStyle(button, spring, 'scale')
  spring.to(0.96)
  assert.equal(button.style.scale, '0.96')
  assert.equal(button.style.transform, 'rotate(7deg)')
  cleanup()
  assert.equal(button.style.scale, '0.8')
  assert.equal(button.style.getPropertyPriority('scale'), 'important')
  spring.to(0.5)
  assert.equal(button.style.scale, '0.8')
  const cleanupAgain = bindSpringStyle(button, spring, 'scale')
  button.style.scale = '0.7'
  cleanupAgain()
  assert.equal(button.style.scale, '0.7')
  assert.throws(() => bindSpringStyle(button, spring, 'transform'), /Unsupported/)
  spring.destroy()
})
test('layout coordinates are independent persistent springs, off settles to measured geometry atomically', () => {
  const initial = { x: 0, y: 0, width: 120, height: 80 }
  const layout = createLayoutSpring(initial, { enabled: false })
  const goal = { x: 30, y: 180, width: 240, height: 100 }
  layout.to(goal)
  assert.deepEqual(layout.get(), goal)
  assert.throws(() => layout.to({ ...goal, width: -1 }), /bounds/)
  assert.deepEqual(layout.get(), goal)
  layout.configure({ enabled: true })
  assert.equal(layout.isAnimating(), false)
  layout.destroy()
})
