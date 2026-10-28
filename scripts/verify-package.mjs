import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const { devDependencies } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
const consumer = mkdtempSync(path.join(tmpdir(), 'radiant-consumer-'))
const styles = process.argv.includes('--styles')
const compositions = process.argv.includes('--compositions')
const archiveArg = process.argv
  .slice(2)
  .find(argument => !['--styles', '--compositions'].includes(argument))
const archive = path.resolve(archiveArg ?? path.join(consumer, 'radiant.tgz'))
for (const name of [styles && 'installed-styles', compositions && 'installed-compositions'].filter(
  Boolean
))
  rmSync(new URL(`../output/browser/${name}/`, import.meta.url), {
    recursive: true,
    force: true
  })
const run = (command, args, cwd = consumer) =>
  execFileSync(command, args, {
    cwd,
    env: { ...process.env, NODE_PATH: undefined },
    stdio: 'inherit',
    timeout: 180_000
  })

try {
  cpSync(new URL('../tests/consumer/', import.meta.url), consumer, { recursive: true })
  writeFileSync(
    path.join(consumer, 'TypographyComponents.tsx'),
    readFileSync(
      new URL('../.storybook/examples/TypographyComponents.tsx', import.meta.url),
      'utf8'
    ).replace("'../../src/index.js'", "'@cognitap/radiant'")
  )
  writeFileSync(
    path.join(consumer, 'ButtonExamples.tsx'),
    readFileSync(new URL('../.storybook/examples/ButtonExamples.tsx', import.meta.url), 'utf8')
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace("'../../src/motion/react.js'", "'@cognitap/radiant/motion/react'")
  )
  const consumerConfig = JSON.parse(readFileSync(path.join(consumer, 'tsconfig.json'), 'utf8'))
  consumerConfig.files.push('ButtonExamples.tsx')
  writeFileSync(
    path.join(consumer, 'LinkExamples.tsx'),
    readFileSync(new URL('../.storybook/examples/LinkExamples.tsx', import.meta.url), 'utf8')
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace("'../../src/motion/react.js'", "'@cognitap/radiant/motion/react'")
  )
  consumerConfig.files.push('LinkExamples.tsx')
  writeFileSync(
    path.join(consumer, 'FieldExamples.tsx'),
    readFileSync(new URL('../.storybook/examples/FieldExamples.tsx', import.meta.url), 'utf8')
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace("'../../src/motion/react.js'", "'@cognitap/radiant/motion/react'")
  )
  consumerConfig.files.push('FieldExamples.tsx')
  writeFileSync(
    path.join(consumer, 'InputExamples.tsx'),
    readFileSync(new URL('../.storybook/examples/InputExamples.tsx', import.meta.url), 'utf8')
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace("'../../src/motion/react.js'", "'@cognitap/radiant/motion/react'")
  )
  consumerConfig.files.push('InputExamples.tsx')
  writeFileSync(
    path.join(consumer, 'CheckboxExamples.tsx'),
    readFileSync(new URL('../.storybook/examples/CheckboxExamples.tsx', import.meta.url), 'utf8')
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace("'../../src/motion/react.js'", "'@cognitap/radiant/motion/react'")
  )
  consumerConfig.files.push('CheckboxExamples.tsx')
  writeFileSync(
    path.join(consumer, 'RadioExamples.tsx'),
    readFileSync(new URL('../.storybook/examples/RadioExamples.tsx', import.meta.url), 'utf8')
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace("'../../src/motion/react.js'", "'@cognitap/radiant/motion/react'")
  )
  consumerConfig.files.push('RadioExamples.tsx')
  writeFileSync(
    path.join(consumer, 'DialogExamples.tsx'),
    readFileSync(new URL('../.storybook/examples/DialogExamples.tsx', import.meta.url), 'utf8')
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace("'../../src/motion/react.js'", "'@cognitap/radiant/motion/react'")
  )
  consumerConfig.files.push('DialogExamples.tsx')
  writeFileSync(
    path.join(consumer, 'CollapsibleExamples.tsx'),
    readFileSync(new URL('../.storybook/examples/CollapsibleExamples.tsx', import.meta.url), 'utf8')
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace("'../../src/motion/react.js'", "'@cognitap/radiant/motion/react'")
  )
  consumerConfig.files.push('CollapsibleExamples.tsx')
  writeFileSync(
    path.join(consumer, 'AccordionExamples.tsx'),
    readFileSync(new URL('../.storybook/examples/AccordionExamples.tsx', import.meta.url), 'utf8')
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace("'../../src/motion/react.js'", "'@cognitap/radiant/motion/react'")
  )
  consumerConfig.files.push('AccordionExamples.tsx')
  writeFileSync(
    path.join(consumer, 'CardExamples.tsx'),
    readFileSync(new URL('../.storybook/examples/CardExamples.tsx', import.meta.url), 'utf8')
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace("'../../src/motion/react.js'", "'@cognitap/radiant/motion/react'")
  )
  consumerConfig.files.push('CardExamples.tsx')
  writeFileSync(path.join(consumer, 'tsconfig.json'), JSON.stringify(consumerConfig))
  if (compositions) {
    const { copyRecipes } = await import('./verify-compositions.mjs')
    copyRecipes(consumer)
    const config = JSON.parse(readFileSync(path.join(consumer, 'tsconfig.json'), 'utf8'))
    config.files.push('Compositions.tsx')
    writeFileSync(path.join(consumer, 'tsconfig.json'), JSON.stringify(config))
  }
  if (!archiveArg) run('pnpm', ['pack', '--out', archive], root)
  const install = [
    'install',
    '--no-save',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    archive,
    ...[
      'react',
      'react-dom',
      '@types/react',
      '@types/react-dom',
      'typescript',
      ...(compositions ? ['@tanstack/react-form'] : [])
    ].map(name => `${name}@${devDependencies[name]}`)
  ]
  run('npm', install)
  run('npm', ['test'])
  if (styles) {
    const { verifyInstalledStyles } = await import('./verify-installed-styles.mjs')
    await verifyInstalledStyles(consumer, archive, () =>
      run('npm', [
        ...install,
        ...['tailwindcss', '@tailwindcss/cli'].map(name => `${name}@${devDependencies[name]}`)
      ])
    )
  }
  if (compositions) {
    const { verifyInstalledCompositions } = await import('./verify-compositions.mjs')
    await verifyInstalledCompositions(consumer, archive)
  }
} finally {
  rmSync(consumer, { recursive: true, force: true })
}
