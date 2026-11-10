import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cn } from '../dist/library/cn.js'
import { typographyRoles } from '../dist/library/index.js'

test('hinted token utilities from a caller replace the default for the same property only', () => {
  const color = 'text-[color:var(--rad-color-foreground)]'
  for (const role of typographyRoles) {
    const token = `--rad-typography-roles-${role}`
    for (const [original, caller] of [
      [`font-[family-name:var(${token}-family,system-ui)]`, `font-(family-name:${token}-family)`],
      [`font-[number:var(${token}-weight,400)]`, `font-(number:${token}-weight)`],
      [`text-[length:var(${token}-size,1rem)]`, `text-(length:${token}-size)`],
      [`leading-[var(${token}-line-height,1.5)]`, `leading-(${token}-line-height)`],
      [`tracking-[var(${token}-letter-spacing,0)]`, `tracking-(${token}-letter-spacing)`]
    ]) {
      assert.equal(cn(color, original, caller), `${color} ${caller}`)
      assert.equal(cn(color, caller, original), `${color} ${original}`)
    }
  }
})
