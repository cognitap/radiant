import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { cp, copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const consumer = await mkdtemp(path.join(tmpdir(), 'radiant-motion-engine-'))
const output = path.join(root, 'output/browser/motion-engine')
const serve = process.argv.includes('--serve')
assert.ok(Number(process.versions.node.split('.')[0]) >= 26, 'Use Node 26 or newer.')
const run = (command, args) =>
  execFileSync(command, args, {
    cwd: consumer,
    env: {
      ...process.env,
      NODE_PATH: undefined,
      PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH}`
    },
    stdio: 'inherit',
    timeout: 180000
  })
let server
try {
  await cp(path.join(root, 'tests/motion-engine'), consumer, { recursive: true })
  run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'])
  run(process.execPath, ['build.mjs'])
  run(process.execPath, ['ssr-check.mjs'])
  await mkdir(output, { recursive: true })
  await copyFile(
    path.join(consumer, 'bundle-results.json'),
    path.join(output, 'bundle-results.json')
  )
  const allowed = new Map([
    ['/', ['index.html', 'text/html']],
    ['/app.js', ['app.js', 'text/javascript']],
    ['/radiant.css', ['radiant.css', 'text/css']]
  ])
  server = createServer(async (request, response) => {
    const file = allowed.get(new URL(request.url, 'http://127.0.0.1').pathname)
    if (!file) {
      response.writeHead(404)
      response.end()
      return
    }
    response.writeHead(200, { 'Content-Type': file[1] })
    response.end(await readFile(path.join(consumer, file[0])))
  })
  await new Promise(resolve =>
    server.listen(serve ? Number(process.env.PORT ?? 3011) : 0, '127.0.0.1', resolve)
  )
  const url = `http://127.0.0.1:${server.address().port}`
  if (serve) {
    console.log(`DEV-171 research proof (not a production API): ${url}`)
    await new Promise(resolve => {
      process.once('SIGINT', resolve)
      process.once('SIGTERM', resolve)
    })
  } else {
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['verify.mjs', url, output], {
        cwd: consumer,
        stdio: 'inherit'
      })
      child.once('error', reject)
      child.once('exit', code =>
        code === 0 ? resolve() : reject(new Error(`Motion proof exited ${code}`))
      )
    })
    if (process.argv.includes('--require-suitable')) {
      const result = JSON.parse(await readFile(path.join(output, 'results.json'), 'utf8'))
      assert.equal(
        result.suitable,
        true,
        'The accepted Motion + Radiant layout approach must pass the suitability proof.'
      )
    }
  }
} finally {
  if (server) await new Promise(resolve => server.close(resolve))
  await rm(consumer, { recursive: true, force: true })
}
