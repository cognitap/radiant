import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = new URL('../src/', import.meta.url)
const foundations = new Set(['ThemeScope'])

const components = readdirSync(source)
  .filter(file => /^[A-Z]\w*\.tsx$/.test(file) && !file.endsWith('.stories.tsx'))
  .map(file => file.slice(0, -'.tsx'.length))
  .filter(name => !foundations.has(name))

test('every component opens its stories with Default', () => {
  for (const name of components) {
    const stories = new URL(`${name}.stories.tsx`, source)
    assert.ok(existsSync(stories), `${name} has no ${name}.stories.tsx`)
    const first = readFileSync(stories, 'utf8').match(/^export const (\w+)/m)?.[1]
    assert.equal(first, 'Default', `${name}.stories.tsx opens with ${first}, not Default`)
  }
})
