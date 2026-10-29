import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const { devDependencies } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as {
  devDependencies: Record<string, string>
}
const archiveArg = process.argv[2]
const consumer = mkdtempSync(path.join(tmpdir(), 'radiant-consumer-'))
const archive = path.resolve(archiveArg ?? path.join(consumer, 'radiant.tgz'))
const run = (command: string, args: string[], cwd = consumer) =>
  execFileSync(command, args, {
    cwd,
    env: { ...process.env, NODE_PATH: undefined },
    stdio: 'inherit',
    timeout: 180_000
  })

try {
  if (!archiveArg) run('pnpm', ['pack', '--out', archive], root)
  const pinned = [
    'react',
    'react-dom',
    '@types/react',
    '@types/react-dom',
    'typescript',
    'tailwindcss',
    '@tailwindcss/cli'
  ].map(name => `${name}@${devDependencies[name]}`)
  run('npm', [
    'install',
    '--no-save',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    archive,
    ...pinned
  ])
  cpSync(new URL('../tests/package/', import.meta.url), consumer, { recursive: true })
  writeFileSync(
    path.join(consumer, 'package.json'),
    `${JSON.stringify({ private: true, type: 'module' })}\n`
  )
  const compilerOptions = {
    target: 'ES2022',
    strict: true,
    noEmit: true,
    jsx: 'react-jsx',
    erasableSyntaxOnly: true,
    verbatimModuleSyntax: true,
    skipLibCheck: true,
    module: 'NodeNext',
    moduleResolution: 'NodeNext'
  }
  writeFileSync(
    path.join(consumer, 'tsconfig.json'),
    `${JSON.stringify({ compilerOptions, files: ['types.tsx'] })}\n`
  )
  run(process.execPath, ['--test'])
  const tsc = path.join(consumer, 'node_modules/typescript/bin/tsc')
  run(process.execPath, [tsc, '-p', 'tsconfig.json'])
  run(process.execPath, [
    tsc,
    '-p',
    'tsconfig.json',
    '--module',
    'ESNext',
    '--moduleResolution',
    'Bundler'
  ])
} finally {
  rmSync(consumer, { recursive: true, force: true })
}
