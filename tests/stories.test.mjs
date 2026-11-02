import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = new URL('../src/components/', import.meta.url)
const foundations = new Set(['ThemeScope'])

const components = readdirSync(source).filter(
  name => /^[A-Z]\w*$/.test(name) && !foundations.has(name)
)

test('every component folder holds its component and opens its stories with Default', () => {
  for (const name of components) {
    assert.ok(existsSync(new URL(`${name}/${name}.tsx`, source)), `${name}/ has no ${name}.tsx`)
    const stories = new URL(`${name}/${name}.stories.tsx`, source)
    assert.ok(existsSync(stories), `${name} has no ${name}.stories.tsx`)
    const first = readFileSync(stories, 'utf8').match(/^export const (\w+)/m)?.[1]
    assert.equal(first, 'Default', `${name}.stories.tsx opens with ${first}, not Default`)
  }
})

test('components live in their own folders', () => {
  const stray = readdirSync(new URL('../src/', import.meta.url)).filter(file =>
    /^[A-Z]\w*\.tsx$/.test(file)
  )
  assert.deepEqual(stray, [], 'move each component into src/components/<Name>/')
})
